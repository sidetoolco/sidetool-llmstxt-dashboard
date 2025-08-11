import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get('email')
  const userId = searchParams.get('user_id')
  
  if (!userEmail && !userId) {
    return NextResponse.json({ error: 'Email or user_id required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let actualUserId = userId
    
    // If email provided, get user ID
    if (userEmail && !userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()
      
      if (userData) {
        actualUserId = userData.id
      }
    }
    
    if (!actualUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get all jobs for this user
    const { data: jobs } = await supabase
      .from('crawl_jobs')
      .select('id, domain, status, urls_processed, total_urls, created_at')
      .eq('user_id', actualUserId)
      .order('created_at', { ascending: false })
    
    // For each job, check if files exist
    const jobsWithFileStatus = []
    
    for (const job of jobs || []) {
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
      
      jobsWithFileStatus.push({
        ...job,
        has_files: files && files.length > 0,
        completed_urls_count: completedUrls?.length || 0,
        needs_file_generation: (completedUrls?.length || 0) > 0 && (!files || files.length === 0)
      })
    }
    
    // Find fin.ai specifically
    const finAiJobs = jobsWithFileStatus.filter(j => j.domain.includes('fin.ai'))
    
    return NextResponse.json({
      user_id: actualUserId,
      total_jobs: jobsWithFileStatus.length,
      jobs_needing_files: jobsWithFileStatus.filter(j => j.needs_file_generation),
      fin_ai_jobs: finAiJobs,
      all_jobs: jobsWithFileStatus
    })
    
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}