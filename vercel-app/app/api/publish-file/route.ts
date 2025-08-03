import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { fileId, published, publishedUrl, notes } = await request.json()

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'File ID is required'
      }, { status: 400 })
    }

    console.log(`${published ? '📤 Publishing' : '📥 Unpublishing'} file: ${fileId}`)

    if (published) {
      // Mark as published
      const { error } = await supabase.rpc('mark_file_published', {
        file_id: fileId,
        published_url: publishedUrl || null,
        notes: notes || null
      })

      if (error) {
        console.error('Error marking file as published:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to mark file as published',
          details: error.message
        }, { status: 500 })
      }

      console.log('✅ File marked as published')
    } else {
      // Mark as unpublished
      const { error } = await supabase.rpc('mark_file_unpublished', {
        file_id: fileId
      })

      if (error) {
        console.error('Error marking file as unpublished:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to mark file as unpublished',
          details: error.message
        }, { status: 500 })
      }

      console.log('✅ File marked as unpublished')
    }

    // Get updated file info
    const { data: fileData, error: fetchError } = await supabase
      .from('llms_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated file:', fetchError)
    }

    return NextResponse.json({
      success: true,
      message: published ? 'File marked as published' : 'File marked as unpublished',
      file: fileData,
      updatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Publish status update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update publish status',
      details: error.message
    }, { status: 500 })
  }
}

// Get publish statistics
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.rpc('get_publish_stats')

    if (error) {
      console.error('Error fetching publish stats:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch publish statistics',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats: data[0] || {
        total_files: 0,
        published_files: 0,
        unpublished_files: 0,
        latest_publish_date: null
      }
    })

  } catch (error: any) {
    console.error('Fetch publish stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch publish statistics',
      details: error.message
    }, { status: 500 })
  }
}