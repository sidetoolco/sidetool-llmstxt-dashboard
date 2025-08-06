import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNextUrlFromQueue, getQueueLength, firecrawlRateLimiter } from '@/lib/redis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

export async function POST(request: Request) {
  try {
    const { job_id } = await request.json()
    
    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check rate limit for Firecrawl
    const { success: canProceed } = await firecrawlRateLimiter.limit(`job:${job_id}`)
    if (!canProceed) {
      return NextResponse.json({ 
        message: 'Rate limited - waiting to avoid API overload',
        remaining: await getQueueLength(job_id)
      })
    }
    
    // Get next URL from queue
    const url = await getNextUrlFromQueue(job_id)
    
    if (!url) {
      // No more URLs to process - generate files
      await generateFiles(job_id, supabase)
      return NextResponse.json({ 
        message: 'Queue empty - files generated',
        completed: true 
      })
    }
    
    // Process the URL
    console.log(`Processing ${url} for job ${job_id}`)
    
    try {
      // Scrape the URL using Firecrawl
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown']
        })
      })
      
      if (!scrapeResponse.ok) {
        throw new Error(`Firecrawl error: ${scrapeResponse.status}`)
      }
      
      const scrapeData = await scrapeResponse.json()
      const markdown = scrapeData.data?.markdown || ''
      const pageTitle = scrapeData.data?.metadata?.title || 'Untitled'
      const description = scrapeData.data?.metadata?.description || 'No description'
      
      // Generate AI summary if OpenAI is configured
      let title = pageTitle
      let summary = description
      
      if (openaiApiKey && markdown) {
        try {
          const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Generate a concise title (3-4 words) and description (9-10 words). Format: Title: [title]\nDescription: [description]'
                },
                {
                  role: 'user',
                  content: markdown.substring(0, 1500)
                }
              ],
              temperature: 0.3,
              max_tokens: 50
            })
          })
          
          if (summaryResponse.ok) {
            const data = await summaryResponse.json()
            const output = data.choices[0].message.content
            const lines = output.split('\n')
            title = lines[0]?.replace('Title: ', '').trim() || title
            summary = lines[1]?.replace('Description: ', '').trim() || summary
          }
        } catch (err) {
          console.error('OpenAI error:', err)
        }
      }
      
      // Update URL record
      await supabase
        .from('crawled_urls')
        .update({
          status: 'completed',
          title: title.substring(0, 100),
          description: summary.substring(0, 200),
          content: markdown.substring(0, 50000),
          crawled_at: new Date().toISOString()
        })
        .eq('job_id', job_id)
        .eq('url', url)
      
      // Update job progress
      const { data: completedUrls } = await supabase
        .from('crawled_urls')
        .select('id')
        .eq('job_id', job_id)
        .eq('status', 'completed')
      
      await supabase
        .from('crawl_jobs')
        .update({
          urls_processed: completedUrls?.length || 0
        })
        .eq('id', job_id)
      
    } catch (error: any) {
      console.error(`Error processing ${url}:`, error)
      
      // Mark URL as failed
      await supabase
        .from('crawled_urls')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('job_id', job_id)
        .eq('url', url)
    }
    
    // Check remaining queue
    const remaining = await getQueueLength(job_id)
    
    return NextResponse.json({
      message: `Processed ${url}`,
      remaining,
      continue: remaining > 0
    })
    
  } catch (error: any) {
    console.error('Process error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function generateFiles(jobId: string, supabase: any) {
  // Get job info
  const { data: job } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  // Get all completed URLs
  const { data: urls } = await supabase
    .from('crawled_urls')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'completed')
    .order('url')
  
  if (!urls || urls.length === 0) {
    console.log('No completed URLs to generate files from')
    return
  }
  
  const filesToInsert = []
  
  // Generate individual llms.txt file for each page
  for (const url of urls) {
    // Extract page name from URL for filename
    const urlPath = new URL(url.url).pathname
    const pageName = urlPath.split('/').filter(Boolean).pop() || 'index'
    
    // Generate individual llms.txt content
    let pageContent = `# ${url.title}\n\n`
    pageContent += `> ${url.description}\n\n`
    pageContent += `## Overview\n\n`
    pageContent += `This content is from ${url.url}\n\n`
    pageContent += `## Content\n\n`
    
    // Add the actual content with proper formatting
    if (url.content) {
      // Clean and format the content
      const cleanContent = url.content
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .trim()
      
      pageContent += cleanContent
    } else {
      pageContent += 'No content available for this page.'
    }
    
    pageContent += `\n\n---\n\n`
    pageContent += `*Generated by SideGSO on ${new Date().toISOString()}*\n`
    pageContent += `*Source: ${url.url}*`
    
    // Add individual file to insert list
    filesToInsert.push({
      job_id: jobId,
      file_type: 'llms.txt',
      file_path: `${job.domain}/${pageName}-llms.txt`,
      file_size: new TextEncoder().encode(pageContent).length,
      content: pageContent
    })
  }
  
  // Also generate consolidated index file
  let indexContent = `# ${job.domain} - SideGSO Files\n\n`
  indexContent += `Generated: ${new Date().toISOString()}\n`
  indexContent += `Total Pages: ${urls.length}\n\n`
  indexContent += `## Available LLMs.txt Files\n\n`
  
  for (const url of urls) {
    const urlPath = new URL(url.url).pathname
    const pageName = urlPath.split('/').filter(Boolean).pop() || 'index'
    indexContent += `- **${pageName}-llms.txt**: [${url.title}](${url.url})\n`
    indexContent += `  - ${url.description}\n\n`
  }
  
  indexContent += `## How to Use\n\n`
  indexContent += `1. Download the individual llms.txt files for the pages you want\n`
  indexContent += `2. Place them in your website's root directory or appropriate path\n`
  indexContent += `3. The files are now accessible to LLMs for better context about your content\n\n`
  indexContent += `## About SideGSO\n\n`
  indexContent += `SideGSO helps you generate LLM-optimized content files for your website, improving AI understanding of your content.`
  
  filesToInsert.push({
    job_id: jobId,
    file_type: 'llms.txt',
    file_path: `${job.domain}/index-llms.txt`,
    file_size: new TextEncoder().encode(indexContent).length,
    content: indexContent
  })
  
  // Store all files
  await supabase
    .from('generated_files')
    .insert(filesToInsert)
  
  // Mark job as completed
  await supabase
    .from('crawl_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId)
  
  console.log(`Generated ${filesToInsert.length} files for job ${jobId}`)
}