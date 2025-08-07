import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id') || '16735175-961c-406c-b500-81fc10480017'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First, check what we have
    const { data: job } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    // Get completed URLs
    const { data: urls } = await supabase
      .from('crawled_urls')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'completed')
    
    if (!urls || urls.length === 0) {
      return NextResponse.json({ 
        error: 'No completed URLs',
        job_status: job.status,
        urls_found: 0
      })
    }
    
    // Delete existing files
    const { data: deleted, error: deleteError } = await supabase
      .from('generated_files')
      .delete()
      .eq('job_id', jobId)
      .select()
    
    // Generate simple test files
    const testFiles = []
    
    // Create one consolidated file
    let content = `# ${job.domain} - Generated Files\n\n`
    content += `Generated: ${new Date().toISOString()}\n\n`
    content += `## Pages Crawled\n\n`
    
    for (const url of urls) {
      content += `### ${url.title || 'Untitled'}\n`
      content += `URL: ${url.url}\n`
      content += `${url.description || 'No description'}\n\n`
    }
    
    testFiles.push({
      job_id: jobId,
      file_type: 'llms.txt',
      file_path: `${job.domain}/combined-llms.txt`,
      file_size: new TextEncoder().encode(content).length,
      content: content,
      created_at: new Date().toISOString()
    })
    
    // Insert the test file
    const { data: inserted, error: insertError } = await supabase
      .from('generated_files')
      .insert(testFiles)
      .select()
    
    if (insertError) {
      return NextResponse.json({ 
        error: 'Insert failed',
        details: insertError,
        attempted_files: testFiles.length,
        deleted_count: deleted?.length || 0
      })
    }
    
    // Verify the insert
    const { data: verify } = await supabase
      .from('generated_files')
      .select('id, file_path, file_size')
      .eq('job_id', jobId)
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      domain: job.domain,
      urls_processed: urls.length,
      files_deleted: deleted?.length || 0,
      files_created: inserted?.length || 0,
      files_verified: verify?.length || 0,
      verification: verify
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}