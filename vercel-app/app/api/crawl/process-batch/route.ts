import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getQueueLength } from '@/lib/redis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { job_id, batch_size = 5 } = await request.json()
    
    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check job exists and is processing
    const { data: job } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    if (job.status !== 'processing') {
      return NextResponse.json({ 
        message: `Job is ${job.status}, not processing`,
        status: job.status 
      })
    }
    
    // Process batch of URLs
    const processedCount = []
    for (let i = 0; i < batch_size; i++) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://gso.sidetool.co'}/api/crawl/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ job_id })
        })
        
        const result = await response.json()
        processedCount.push(result.message)
        
        // If queue is empty or error, stop
        if (!result.continue || result.completed) {
          break
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (err) {
        console.error(`Batch processing error on URL ${i + 1}:`, err)
      }
    }
    
    // Get updated queue length
    const remaining = await getQueueLength(job_id)
    
    // Get updated job status
    const { data: updatedJob } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    return NextResponse.json({
      message: `Processed ${processedCount.length} URLs`,
      processed: processedCount,
      remaining,
      job_status: updatedJob?.status,
      urls_processed: updatedJob?.urls_processed || 0
    })
    
  } catch (error: any) {
    console.error('Batch process error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check if processing is needed
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }
  
  try {
    const queueLength = await getQueueLength(jobId)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: job } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    return NextResponse.json({
      job_id: jobId,
      status: job?.status,
      queue_length: queueLength,
      urls_processed: job?.urls_processed || 0,
      needs_processing: job?.status === 'processing' && queueLength > 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}