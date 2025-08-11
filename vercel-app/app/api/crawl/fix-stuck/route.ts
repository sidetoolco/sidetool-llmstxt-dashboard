import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSimpleFiles } from '@/lib/file-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Find stuck jobs (in progress for more than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: stuckJobs, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'mapping', 'crawling', 'processing'])
      .lt('created_at', tenMinutesAgo)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      stuck_jobs: stuckJobs || [],
      count: stuckJobs?.length || 0
    })
    
  } catch (error: any) {
    console.error('Error checking stuck jobs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { job_id, action = 'complete' } = await request.json()
    
    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    if (action === 'complete') {
      // Get all crawled URLs for this job
      const { data: urls } = await supabase
        .from('crawled_urls')
        .select('*')
        .eq('job_id', job_id)
        .eq('status', 'completed')
      
      const completedCount = urls?.length || 0
      
      // Generate files with whatever content we have
      if (completedCount > 0) {
        try {
          await generateSimpleFiles(job_id, supabase)
        } catch (err) {
          console.error('Error generating files:', err)
        }
      }
      
      // Mark job as completed
      const { error: updateError } = await supabase
        .from('crawl_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          urls_processed: completedCount,
          urls_crawled: completedCount
        })
        .eq('id', job_id)
      
      if (updateError) {
        throw updateError
      }
      
      return NextResponse.json({
        message: `Job ${job_id} marked as completed`,
        urls_processed: completedCount,
        status: 'completed'
      })
      
    } else if (action === 'retry') {
      // Process remaining unprocessed URLs
      const { data: pendingUrls } = await supabase
        .from('crawled_urls')
        .select('*')
        .eq('job_id', job_id)
        .in('status', ['pending', 'failed'])
      
      if (!pendingUrls || pendingUrls.length === 0) {
        // No pending URLs, just complete the job
        return await completeJob(job_id, supabase)
      }
      
      // Process pending URLs
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }
      
      let processedCount = 0
      const batchSize = 5
      
      for (let i = 0; i < pendingUrls.length; i += batchSize) {
        const batch = pendingUrls.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (urlRecord) => {
          try {
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                url: urlRecord.url,
                formats: ['markdown']
              })
            })
            
            if (scrapeResponse.ok) {
              const data = await scrapeResponse.json()
              const markdown = data.data?.markdown || ''
              const title = data.data?.metadata?.title || 'Untitled'
              const description = data.data?.metadata?.description || 'No description'
              
              await supabase
                .from('crawled_urls')
                .update({
                  status: 'completed',
                  title: title.substring(0, 100),
                  description: description.substring(0, 200),
                  content: markdown.substring(0, 50000),
                  crawled_at: new Date().toISOString()
                })
                .eq('id', urlRecord.id)
              
              processedCount++
            }
          } catch (err) {
            console.error(`Error processing ${urlRecord.url}:`, err)
          }
        }))
        
        // Update job progress
        await supabase
          .from('crawl_jobs')
          .update({
            urls_processed: job.urls_processed + processedCount
          })
          .eq('id', job_id)
        
        // Small delay between batches
        if (i + batchSize < pendingUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      // Complete the job
      return await completeJob(job_id, supabase)
      
    } else if (action === 'cancel') {
      // Cancel the job
      const { error: updateError } = await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Job cancelled by user'
        })
        .eq('id', job_id)
      
      if (updateError) {
        throw updateError
      }
      
      return NextResponse.json({
        message: `Job ${job_id} cancelled`,
        status: 'failed'
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Error fixing stuck job:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function completeJob(jobId: string, supabase: any) {
  // Get final counts
  const { data: urls } = await supabase
    .from('crawled_urls')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'completed')
  
  const completedCount = urls?.length || 0
  
  // Generate files
  if (completedCount > 0) {
    try {
      await generateSimpleFiles(jobId, supabase)
    } catch (err) {
      console.error('Error generating files:', err)
    }
  }
  
  // Mark as completed
  await supabase
    .from('crawl_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      urls_processed: completedCount,
      urls_crawled: completedCount
    })
    .eq('id', jobId)
  
  return NextResponse.json({
    message: `Job ${jobId} completed`,
    urls_processed: completedCount,
    status: 'completed'
  })
}