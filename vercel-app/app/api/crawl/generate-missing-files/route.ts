import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSimpleFiles } from '@/lib/file-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { job_id, user_id } = await request.json()
    
    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the job first
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (jobError || !job) {
      // Try with different ID formats in case there's a formatting issue
      console.log(`Job not found with ID: ${job_id}`)
      console.log('Job fetch error:', jobError)
      return NextResponse.json({ 
        error: 'Job not found',
        job_id_provided: job_id,
        details: jobError?.message 
      }, { status: 404 })
    }
    
    // Verify job belongs to user if user_id provided
    if (user_id && job.user_id !== user_id) {
      console.log(`User mismatch - Job user: ${job.user_id}, Provided user: ${user_id}`)
      return NextResponse.json({ 
        error: 'Unauthorized - job belongs to different user',
        job_domain: job.domain 
      }, { status: 403 })
    }
    
    // Check if files already exist
    const { data: existingFiles } = await supabase
      .from('generated_files')
      .select('id')
      .eq('job_id', job_id)
      .limit(1)
    
    if (existingFiles && existingFiles.length > 0) {
      return NextResponse.json({ 
        message: 'Files already exist for this job',
        files_count: existingFiles.length 
      })
    }
    
    // Check if there are any completed URLs to generate from
    const { data: urls } = await supabase
      .from('crawled_urls')
      .select('*')
      .eq('job_id', job_id)
      .eq('status', 'completed')
    
    if (!urls || urls.length === 0) {
      return NextResponse.json({ 
        error: 'No completed URLs found for this job. Cannot generate files.',
        suggestion: 'Try retrying the job to crawl the pages first'
      }, { status: 400 })
    }
    
    // Generate files
    console.log(`Generating files for job ${job_id} with ${urls.length} completed URLs`)
    
    let generatedFiles
    try {
      generatedFiles = await generateSimpleFiles(job_id, supabase)
    } catch (genError: any) {
      console.error('File generation error:', genError)
      return NextResponse.json({ 
        error: 'Failed to generate files',
        details: genError.message,
        urls_count: urls.length
      }, { status: 500 })
    }
    
    // Check how many files were created
    const { data: newFiles } = await supabase
      .from('generated_files')
      .select('id, file_type, file_path')
      .eq('job_id', job_id)
    
    return NextResponse.json({
      success: true,
      message: `Generated ${newFiles?.length || 0} files for job ${job_id}`,
      urls_used: urls.length,
      files: newFiles,
      generated_count: generatedFiles?.length || 0
    })
    
  } catch (error: any) {
    console.error('Error generating missing files:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check which jobs are missing files
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all user's jobs
    const { data: jobs } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!jobs) {
      return NextResponse.json({ jobs_missing_files: [] })
    }
    
    // Check which jobs have no files
    const jobsWithoutFiles = []
    
    for (const job of jobs) {
      const { data: files } = await supabase
        .from('generated_files')
        .select('id')
        .eq('job_id', job.id)
        .limit(1)
      
      const { data: completedUrls } = await supabase
        .from('crawled_urls')
        .select('id')
        .eq('job_id', job.id)
        .eq('status', 'completed')
      
      if ((!files || files.length === 0) && completedUrls && completedUrls.length > 0) {
        jobsWithoutFiles.push({
          id: job.id,
          domain: job.domain,
          status: job.status,
          urls_processed: job.urls_processed,
          total_urls: job.total_urls,
          completed_urls_count: completedUrls.length
        })
      }
    }
    
    return NextResponse.json({
      jobs_missing_files: jobsWithoutFiles,
      count: jobsWithoutFiles.length
    })
    
  } catch (error: any) {
    console.error('Error checking missing files:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}