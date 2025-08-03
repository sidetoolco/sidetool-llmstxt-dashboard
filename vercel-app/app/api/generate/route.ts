import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const functionUrl = process.env.SUPABASE_FUNCTION_URL || 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt'
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: data.error || 'Failed to generate files'
      }, { status: response.status })
    }
    
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error calling Supabase function:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}