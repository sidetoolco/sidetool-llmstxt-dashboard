import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  
  if (!jobId) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get job details
    const { data: job } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    // Get all files for this job
    const { data: files } = await supabase
      .from('generated_files')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    
    // Get URLs count
    const { data: urls } = await supabase
      .from('crawled_urls')
      .select('id, status')
      .eq('job_id', jobId)
    
    const completedUrls = urls?.filter(u => u.status === 'completed') || []
    
    return NextResponse.json({
      job: {
        id: job?.id,
        domain: job?.domain,
        status: job?.status,
        urls_processed: job?.urls_processed,
        total_urls: job?.total_urls
      },
      files: {
        count: files?.length || 0,
        list: files?.map(f => ({
          id: f.id,
          file_type: f.file_type,
          file_path: f.file_path,
          size: f.file_size || f.size,
          created_at: f.created_at
        }))
      },
      urls: {
        total: urls?.length || 0,
        completed: completedUrls.length
      },
      files_exist: (files?.length || 0) > 0,
      needs_generation: completedUrls.length > 0 && (files?.length || 0) === 0
    })
    
  } catch (error: any) {
    console.error('Check job files error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}