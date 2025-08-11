import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get ALL jobs to help debug
    const { data: jobs, error } = await supabase
      .from('crawl_jobs')
      .select('id, domain, user_id, status, urls_processed, total_urls, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Group by user
    const jobsByUser: any = {}
    for (const job of jobs || []) {
      if (!jobsByUser[job.user_id]) {
        jobsByUser[job.user_id] = []
      }
      jobsByUser[job.user_id].push(job)
    }
    
    // Find fin.ai jobs specifically
    const finAiJobs = jobs?.filter(j => j.domain?.includes('fin.ai')) || []
    
    return NextResponse.json({
      total_jobs: jobs?.length || 0,
      fin_ai_jobs: finAiJobs,
      user_b4bfa9d2: jobsByUser['b4bfa9d2-d85b-44dd-ab9a-0593d8db4c82'] || [],
      all_jobs: jobs
    })
    
  } catch (error: any) {
    console.error('List jobs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}