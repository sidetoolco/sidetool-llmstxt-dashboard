import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the file
    const { data: file, error } = await supabase
      .from('generated_files')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Return the file content as a download
    return new NextResponse(file.content || '', {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${file.file_type}"`
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}