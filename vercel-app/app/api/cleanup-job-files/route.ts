import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { job_id } = await request.json()
    
    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First, try to delete any existing files for this job
    console.log(`Attempting to cleanup files for job ${job_id}`)
    
    // Get existing files first to see what we're dealing with
    const { data: existingFiles, error: fetchError } = await supabase
      .from('generated_files')
      .select('id, file_path')
      .eq('job_id', job_id)
    
    console.log(`Found ${existingFiles?.length || 0} existing files`)
    
    if (existingFiles && existingFiles.length > 0) {
      // Delete by IDs to avoid constraint issues
      const fileIds = existingFiles.map(f => f.id)
      const { error: deleteError } = await supabase
        .from('generated_files')
        .delete()
        .in('id', fileIds)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to delete files',
          details: deleteError.message
        }, { status: 500 })
      }
      
      console.log(`Deleted ${fileIds.length} files`)
    }
    
    // Also try a direct delete just in case
    const { error: directDeleteError } = await supabase
      .from('generated_files')
      .delete()
      .eq('job_id', job_id)
    
    if (directDeleteError) {
      console.log('Direct delete error (may be normal if no files exist):', directDeleteError.message)
    }
    
    // Verify cleanup
    const { data: remainingFiles } = await supabase
      .from('generated_files')
      .select('id')
      .eq('job_id', job_id)
    
    return NextResponse.json({
      success: true,
      message: `Cleanup complete for job ${job_id}`,
      files_deleted: existingFiles?.length || 0,
      files_remaining: remainingFiles?.length || 0
    })
    
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}