import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Triggering manual LLMs.txt generation...')

    // Call the Edge Function to generate new files
    const { data, error } = await supabase.functions.invoke('generate-llms-daily', {
      body: { trigger: 'manual', timestamp: new Date().toISOString() }
    })

    if (error) {
      console.error('Error triggering generation:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to trigger generation',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Manual generation triggered successfully')

    return NextResponse.json({
      success: true,
      message: 'Generation triggered successfully',
      data,
      triggeredAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Manual generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger manual generation',
      details: error.message
    }, { status: 500 })
  }
}