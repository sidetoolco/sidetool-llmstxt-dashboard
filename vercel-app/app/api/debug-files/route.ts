import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')
    
    if (!jobId) {
      return NextResponse.json({ error: 'job_id parameter required' }, { status: 400 })
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all files for this job
    const { data: files, error: filesError } = await supabase
      .from('generated_files')
      .select('*')
      .eq('job_id', jobId)
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    // Get crawled URLs count
    const { data: urls, error: urlsError } = await supabase
      .from('crawled_urls')
      .select('id, status')
      .eq('job_id', jobId)
    
    const completedUrls = urls?.filter(u => u.status === 'completed').length || 0
    
    return NextResponse.json({
      job_id: jobId,
      job_status: job?.status,
      job_user_id: job?.user_id,
      total_urls: urls?.length || 0,
      completed_urls: completedUrls,
      files_count: files?.length || 0,
      files: files?.map(f => ({
        id: f.id,
        file_type: f.file_type,
        file_path: f.file_path,
        file_size: f.file_size,
        has_content: !!f.content,
        content_length: f.content?.length || 0,
        created_at: f.created_at
      })),
      errors: {
        files: filesError?.message,
        job: jobError?.message,
        urls: urlsError?.message
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}