import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check job status
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', params.jobId)
      .single()
    
    // Check files
    const { data: files, error: filesError } = await supabase
      .from('generated_files')
      .select('*')
      .eq('job_id', params.jobId)
    
    // Check URLs
    const { data: urls, error: urlsError } = await supabase
      .from('crawled_urls')
      .select('*')
      .eq('job_id', params.jobId)
    
    return NextResponse.json({
      job: job,
      jobError: jobError,
      files: files || [],
      filesError: filesError,
      urls: urls || [],
      urlsError: urlsError,
      filesCount: files?.length || 0,
      urlsCount: urls?.length || 0
    })
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }
}