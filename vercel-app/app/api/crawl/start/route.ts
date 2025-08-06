import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

export async function POST(request: Request) {
  try {
    const { domain, max_pages, user_id } = await request.json()
    
    if (!domain || !user_id) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!firecrawlApiKey) {
      return NextResponse.json(
        { message: 'Firecrawl API key not configured' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check for active jobs
    const { data: activeJobs } = await supabase
      .from('crawl_jobs')
      .select('id')
      .eq('user_id', user_id)
      .in('status', ['pending', 'mapping', 'crawling', 'processing'])
    
    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json(
        { message: 'You already have an active job. Please wait for it to complete.' },
        { status: 429 }
      )
    }
    
    // Create crawl job
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .insert({
        user_id,
        domain,
        max_pages: max_pages || 20,
        status: 'pending'
      })
      .select()
      .single()
    
    if (jobError || !job) {
      throw new Error('Failed to create job')
    }
    
    // Do mapping synchronously to ensure it completes
    try {
      // Update job status to mapping
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'mapping',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      // Map the website using Firecrawl
      console.log(`Starting URL mapping for ${domain}`)
      
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `https://${domain}`,
          includeSubdomains: false,
          limit: max_pages
        })
      })
      
      if (!mapResponse.ok) {
        const error = await mapResponse.text()
        throw new Error(`Firecrawl map failed: ${error}`)
      }
      
      const mapData = await mapResponse.json()
      const urls = mapData.links || []
      
      console.log(`Found ${urls.length} URLs for ${domain}`)
      
      if (urls.length === 0) {
        throw new Error('No URLs found to crawl')
      }
      
      // Store URLs in database as pending for crawling
      const urlRecords = urls.map((url: string) => ({
        job_id: job.id,
        url,
        status: 'pending',
        title: null,
        description: null,
        content: null,
        crawled_at: null
      }))
      
      await supabase
        .from('crawled_urls')
        .insert(urlRecords)
      
      // Update job status to crawling
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'crawling',
          total_urls: urls.length
        })
        .eq('id', job.id)
      
      // Crawl each URL for content (process up to 5 at a time)
      console.log(`Starting content crawling for ${urls.length} URLs`)
      const crawledUrls = []
      const openaiApiKey = process.env.OPENAI_API_KEY
      
      for (let i = 0; i < urls.length; i += 5) {
        const batch = urls.slice(i, i + 5)
        const batchPromises = batch.map(async (url: string) => {
          try {
            console.log(`Scraping ${url}`)
            
            // Scrape the URL using Firecrawl
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                url,
                formats: ['markdown', 'html']
              })
            })
            
            if (!scrapeResponse.ok) {
              console.error(`Failed to scrape ${url}:`, await scrapeResponse.text())
              return null
            }
            
            const scrapeData = await scrapeResponse.json()
            const markdown = scrapeData.data?.markdown || ''
            const html = scrapeData.data?.html || ''
            const pageTitle = scrapeData.data?.metadata?.title || new URL(url).pathname.slice(1) || 'Untitled'
            
            // Generate AI summary if OpenAI is configured
            let title = pageTitle.substring(0, 50)
            let description = scrapeData.data?.metadata?.description || 'No description available'
            
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
                        content: 'Generate a concise title (3-4 words) and description (9-10 words) for this webpage content. Format: Title: [title]\nDescription: [description]'
                      },
                      {
                        role: 'user',
                        content: markdown.substring(0, 2000)
                      }
                    ],
                    temperature: 0.3,
                    max_tokens: 50
                  })
                })
                
                if (summaryResponse.ok) {
                  const summaryData = await summaryResponse.json()
                  const output = summaryData.choices[0].message.content
                  const lines = output.split('\n')
                  title = lines[0]?.replace('Title: ', '').trim() || title
                  description = lines[1]?.replace('Description: ', '').trim() || description
                }
              } catch (err) {
                console.error('Summary generation error:', err)
              }
            }
            
            // Update URL record with content
            await supabase
              .from('crawled_urls')
              .update({
                status: 'completed',
                title,
                description,
                content: markdown,
                crawled_at: new Date().toISOString()
              })
              .eq('job_id', job.id)
              .eq('url', url)
            
            return {
              url,
              title,
              description,
              content: markdown
            }
          } catch (error) {
            console.error(`Error crawling ${url}:`, error)
            await supabase
              .from('crawled_urls')
              .update({
                status: 'failed',
                error_message: error.message
              })
              .eq('job_id', job.id)
              .eq('url', url)
            return null
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        crawledUrls.push(...batchResults.filter(r => r !== null))
        
        // Update progress
        await supabase
          .from('crawl_jobs')
          .update({
            urls_crawled: crawledUrls.length,
            urls_processed: crawledUrls.length
          })
          .eq('id', job.id)
      }
      
      console.log(`Crawled ${crawledUrls.length} URLs successfully`)
      
      // Generate llms.txt (index with titles and descriptions)
      let llmsTxtContent = `# ${domain} - SideGSO Files\n\n`
      llmsTxtContent += `Generated: ${new Date().toISOString()}\n`
      llmsTxtContent += `Total Pages: ${crawledUrls.length}\n\n`
      llmsTxtContent += `## Pages\n\n`
      
      for (const page of crawledUrls) {
        llmsTxtContent += `- [${page.title}](${page.url}): ${page.description}\n`
      }
      
      // Generate llms-full.txt (complete content)
      let llmsFullTxtContent = `# ${domain} - Complete Content\n\n`
      llmsFullTxtContent += `Generated: ${new Date().toISOString()}\n`
      llmsFullTxtContent += `Total Pages: ${crawledUrls.length}\n\n`
      llmsFullTxtContent += `---\n\n`
      
      for (const page of crawledUrls) {
        llmsFullTxtContent += `## ${page.url}\n\n`
        llmsFullTxtContent += `**Title:** ${page.title}\n`
        llmsFullTxtContent += `**Description:** ${page.description}\n\n`
        llmsFullTxtContent += `### Content\n\n`
        llmsFullTxtContent += page.content || 'No content available'
        llmsFullTxtContent += `\n\n---\n\n`
      }
      
      // Store the generated files with content
      console.log('Storing llms.txt file for job:', job.id)
      console.log('llms.txt size:', new TextEncoder().encode(llmsTxtContent).length, 'bytes')
      
      const { data: file1, error: fileError1 } = await supabase
        .from('generated_files')
        .insert({
          job_id: job.id,
          file_type: 'llms.txt',
          file_path: `${domain}/llms.txt`,
          file_size: new TextEncoder().encode(llmsTxtContent).length,
          content: llmsTxtContent,
          download_url: ''
        })
        .select()
        .single()
      
      if (fileError1) {
        console.error('Error storing llms.txt:', fileError1)
        throw new Error(`Failed to store llms.txt: ${fileError1.message}`)
      } else {
        console.log('Successfully stored llms.txt with id:', file1?.id)
      }
      
      // Store llms-full.txt with complete content
      console.log('Storing llms-full.txt file for job:', job.id)
      console.log('llms-full.txt size:', new TextEncoder().encode(llmsFullTxtContent).length, 'bytes')
      
      const { data: file2, error: fileError2 } = await supabase
        .from('generated_files')
        .insert({
          job_id: job.id,
          file_type: 'llms-full.txt',
          file_path: `${domain}/llms-full.txt`,
          file_size: new TextEncoder().encode(llmsFullTxtContent).length,
          content: llmsFullTxtContent,
          download_url: ''
        })
        .select()
        .single()
      
      if (fileError2) {
        console.error('Error storing llms-full.txt:', fileError2)
        throw new Error(`Failed to store llms-full.txt: ${fileError2.message}`)
      } else {
        console.log('Successfully stored llms-full.txt with id:', file2?.id)
      }
      
      // Update job with final status
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'completed',
          total_urls: urls.length,
          urls_crawled: crawledUrls.length,
          urls_processed: crawledUrls.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      console.log(`Job ${job.id} completed successfully with ${crawledUrls.length} pages crawled`)
        
    } catch (error: any) {
      console.error('Mapping error:', error)
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
        
      return NextResponse.json(
        { message: `Crawl failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      job: {
        id: job.id,
        domain: job.domain,
        status: job.status,
        max_pages: job.max_pages,
        created_at: job.created_at
      }
    })
    
  } catch (error: any) {
    console.error('Start crawl error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to start crawl' },
      { status: 500 }
    )
  }
}

async function startCrawlProcess(
  jobId: string, 
  domain: string, 
  maxPages: number, 
  apiKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Update job status to mapping
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'mapping',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    // Step 1: Map the website using Firecrawl
    console.log(`Starting URL mapping for ${domain}`)
    console.log(`Using API key: ${apiKey?.substring(0, 10)}...`)
    console.log(`Target URL: https://${domain}`)
    
    // Add timeout to prevent Vercel function timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
    
    let mapResponse
    try {
      console.log('Making Firecrawl API request...')
      mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `https://${domain}`,
          includeSubdomains: false,
          limit: maxPages
        }),
        signal: controller.signal
      })
      console.log('Firecrawl API request completed')
    } catch (fetchError: any) {
      console.error('Firecrawl fetch error:', fetchError)
      if (fetchError.name === 'AbortError') {
        throw new Error('Firecrawl API request timed out after 25 seconds')
      }
      throw new Error(`Failed to connect to Firecrawl: ${fetchError.message}`)
    } finally {
      clearTimeout(timeoutId)
    }
    
    console.log(`Firecrawl response status: ${mapResponse.status}`)
    
    if (!mapResponse.ok) {
      const error = await mapResponse.text()
      console.log(`Firecrawl error response: ${error}`)
      throw new Error(`Firecrawl map failed (${mapResponse.status}): ${error}`)
    }
    
    const mapData = await mapResponse.json()
    console.log(`Firecrawl response data:`, JSON.stringify(mapData, null, 2))
    
    const urls = mapData.links || []
    
    console.log(`Found ${urls.length} URLs to crawl`)
    
    if (urls.length === 0) {
      throw new Error('No URLs found to crawl - website may be inaccessible or blocked')
    }
    
    // Store URLs in database
    const urlRecords = urls.map((url: string) => ({
      job_id: jobId,
      url,
      status: 'pending'
    }))
    
    await supabase
      .from('crawled_urls')
      .insert(urlRecords)
    
    // Update job with URL count
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'crawling',
        total_urls: urls.length,
        mapping_completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    // Step 2: Start crawling URLs in batches
    const batchSize = 10
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      await processBatch(jobId, batch, apiKey)
      
      // Update progress
      await supabase
        .from('crawl_jobs')
        .update({
          urls_crawled: Math.min(i + batchSize, urls.length)
        })
        .eq('id', jobId)
    }
    
    // Step 3: Process and generate files
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'processing',
        crawling_completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    await generateLLMFiles(jobId)
    
    // Mark job as completed
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    // Send notification (if enabled)
    await sendCompletionNotification(jobId)
    
  } catch (error: any) {
    console.error('Crawl process error:', error)
    
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    throw error
  }
}

async function processBatch(jobId: string, urls: string[], apiKey: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const openaiKey = process.env.OPENAI_API_KEY!
  
  const crawlPromises = urls.map(async (url) => {
    const startTime = Date.now()
    
    try {
      // Crawl the URL with Firecrawl
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to scrape ${url}`)
      }
      
      const data = await response.json()
      const markdown = data.data?.markdown || ''
      const html = data.data?.html || ''
      const pageTitle = data.data?.metadata?.title || ''
      const metaDescription = data.data?.metadata?.description || ''
      
      const crawlDuration = Date.now() - startTime
      
      // Generate AI summary using GPT-4o-mini
      const summaryStartTime = Date.now()
      let title = ''
      let description = ''
      
      if (markdown && openaiKey) {
        try {
          const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Generate a concise title (3-4 words) and description (9-10 words) for this webpage content. Format: Title: [title]\nDescription: [description]'
                },
                {
                  role: 'user',
                  content: markdown.substring(0, 2000) // Limit context for efficiency
                }
              ],
              temperature: 0.3,
              max_tokens: 50
            })
          })
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            const output = summaryData.choices[0].message.content
            const lines = output.split('\n')
            title = lines[0]?.replace('Title: ', '').trim() || pageTitle.substring(0, 50)
            description = lines[1]?.replace('Description: ', '').trim() || metaDescription.substring(0, 100)
          }
        } catch (err) {
          console.error('Summary generation error:', err)
          title = pageTitle.substring(0, 50)
          description = metaDescription.substring(0, 100)
        }
      }
      
      const processingDuration = Date.now() - summaryStartTime
      
      // Update URL record
      await supabase
        .from('crawled_urls')
        .update({
          status: 'completed',
          markdown_content: markdown,
          html_content: html,
          content_size: new TextEncoder().encode(markdown).length,
          title,
          description,
          page_title: pageTitle,
          meta_description: metaDescription,
          crawled_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          crawl_duration_ms: crawlDuration,
          processing_duration_ms: processingDuration
        })
        .eq('job_id', jobId)
        .eq('url', url)
      
      // Track API usage
      await supabase
        .from('api_usage')
        .insert([
          {
            job_id: jobId,
            user_id: (await supabase.from('crawl_jobs').select('user_id').eq('id', jobId).single()).data?.user_id,
            service: 'firecrawl_scrape',
            endpoint: url,
            response_time_ms: crawlDuration
          },
          {
            job_id: jobId,
            user_id: (await supabase.from('crawl_jobs').select('user_id').eq('id', jobId).single()).data?.user_id,
            service: 'openai_summary',
            endpoint: url,
            response_time_ms: processingDuration
          }
        ])
      
    } catch (error: any) {
      console.error(`Error processing ${url}:`, error)
      
      await supabase
        .from('crawled_urls')
        .update({
          status: 'failed',
          error_message: error.message,
          crawled_at: new Date().toISOString()
        })
        .eq('job_id', jobId)
        .eq('url', url)
    }
  })
  
  await Promise.all(crawlPromises)
}

async function generateLLMFiles(jobId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Get all successfully crawled URLs
  const { data: urls, error } = await supabase
    .from('crawled_urls')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'completed')
    .order('url')
  
  if (error || !urls || urls.length === 0) {
    throw new Error('No successfully crawled URLs found')
  }
  
  // Get job info
  const { data: job } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  // Generate llms.txt (index file with titles and descriptions)
  let llmsTxtContent = `# ${job.domain} - LLMs.txt\n\n`
  llmsTxtContent += `Generated: ${new Date().toISOString()}\n`
  llmsTxtContent += `Total Pages: ${urls.length}\n\n`
  llmsTxtContent += `## Pages\n\n`
  
  for (const url of urls) {
    llmsTxtContent += `- [${url.title || 'Untitled'}](${url.url}): ${url.description || 'No description'}\n`
  }
  
  // Generate llms-full.txt (complete content)
  let llmsFullTxtContent = `# ${job.domain} - Complete Content\n\n`
  llmsFullTxtContent += `Generated: ${new Date().toISOString()}\n`
  llmsFullTxtContent += `Total Pages: ${urls.length}\n\n`
  llmsFullTxtContent += `---\n\n`
  
  for (const url of urls) {
    llmsFullTxtContent += `## ${url.url}\n\n`
    llmsFullTxtContent += `**Title:** ${url.title || url.page_title || 'Untitled'}\n`
    llmsFullTxtContent += `**Description:** ${url.description || url.meta_description || 'No description'}\n\n`
    llmsFullTxtContent += `### Content\n\n`
    llmsFullTxtContent += url.markdown_content || 'No content available'
    llmsFullTxtContent += `\n\n---\n\n`
  }
  
  // Calculate sizes
  const llmsTxtSize = new TextEncoder().encode(llmsTxtContent).length
  const llmsFullTxtSize = new TextEncoder().encode(llmsFullTxtContent).length
  
  // Store files in database
  const { data: llmsTxt } = await supabase
    .from('generated_files')
    .insert({
      job_id: jobId,
      user_id: job.user_id,
      file_type: 'llms.txt',
      content: llmsTxtContent,
      size: llmsTxtSize
    })
    .select()
    .single()
  
  const { data: llmsFullTxt } = await supabase
    .from('generated_files')
    .insert({
      job_id: jobId,
      user_id: job.user_id,
      file_type: 'llms-full.txt',
      content: llmsFullTxtContent,
      size: llmsFullTxtSize
    })
    .select()
    .single()
  
  // Update job with file references
  await supabase
    .from('crawl_jobs')
    .update({
      llms_txt_id: llmsTxt?.id,
      llms_full_txt_id: llmsFullTxt?.id,
      total_content_size: llmsTxtSize + llmsFullTxtSize,
      processing_completed_at: new Date().toISOString()
    })
    .eq('id', jobId)
}

async function sendCompletionNotification(jobId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Get job and user info
  const { data: job } = await supabase
    .from('crawl_jobs')
    .select('*, users(email, name)')
    .eq('id', jobId)
    .single()
  
  if (!job || !job.users) return
  
  // Create notification record
  await supabase
    .from('user_notifications')
    .insert({
      user_id: job.user_id,
      job_id: jobId,
      type: 'job_completed',
      channel: 'email',
      subject: `LLMs.txt generation completed for ${job.domain}`,
      message: `Your LLMs.txt files for ${job.domain} have been generated successfully. ${job.urls_processed} pages were processed.`
    })
  
  // Send email via API (implement based on your email service)
  // This would integrate with Resend, SendGrid, or another email service
}