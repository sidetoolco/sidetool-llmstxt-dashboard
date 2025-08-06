import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getQueueLength } from '@/lib/redis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get job status
    const { data: job } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    // Get queue length from Redis
    let queueLength = 0
    try {
      queueLength = await getQueueLength(jobId)
    } catch (e) {
      console.error('Redis error:', e)
    }
    
    // Get completed URLs count
    const { data: completedUrls } = await supabase
      .from('crawled_urls')
      .select('id')
      .eq('job_id', jobId)
      .eq('status', 'completed')
    
    // Get generated files
    const { data: files } = await supabase
      .from('generated_files')
      .select('*')
      .eq('job_id', jobId)
    
    return NextResponse.json({
      job,
      queueLength,
      completedCount: completedUrls?.length || 0,
      files: files || [],
      isComplete: job.status === 'completed',
      shouldContinueProcessing: job.status === 'processing' && queueLength > 0
    })
    
  } catch (error: any) {
    console.error('Status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}