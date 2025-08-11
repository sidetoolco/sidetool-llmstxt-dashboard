import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSimpleFiles } from '@/lib/file-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json()
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Find incomplete jobs (marked as completed but didn't process all pages)
    const { data: jobs, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'completed')
    
    if (error) {
      throw error
    }
    
    const incompleteJobs = jobs?.filter(job => {
      // Job is incomplete if it processed less than 80% of total URLs
      return job.total_urls > 0 && (job.urls_processed / job.total_urls) < 0.8
    }) || []
    
    console.log(`Found ${incompleteJobs.length} incomplete jobs`)
    
    // Fix each incomplete job
    for (const job of incompleteJobs) {
      // Mark as failed so it can be retried
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          error_message: `Only processed ${job.urls_processed} of ${job.total_urls} pages`
        })
        .eq('id', job.id)
      
      console.log(`Fixed job ${job.id} (${job.domain}): ${job.urls_processed}/${job.total_urls} pages`)
    }
    
    return NextResponse.json({
      message: `Fixed ${incompleteJobs.length} incomplete jobs`,
      jobs: incompleteJobs.map(j => ({
        id: j.id,
        domain: j.domain,
        processed: j.urls_processed,
        total: j.total_urls
      }))
    })
    
  } catch (error: any) {
    console.error('Error fixing incomplete jobs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check for incomplete jobs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: jobs, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
    
    if (error) {
      throw error
    }
    
    const incompleteJobs = jobs?.filter(job => {
      return job.total_urls > 0 && (job.urls_processed / job.total_urls) < 0.8
    }) || []
    
    return NextResponse.json({
      incomplete_jobs: incompleteJobs,
      count: incompleteJobs.length
    })
    
  } catch (error: any) {
    console.error('Error checking incomplete jobs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}