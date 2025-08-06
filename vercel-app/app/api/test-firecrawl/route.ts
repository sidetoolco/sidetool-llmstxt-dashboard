import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.FIRECRAWL_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'FIRECRAWL_API_KEY not configured' }, { status: 500 })
  }
  
  try {
    console.log('Testing Firecrawl API with example.com')
    
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        includeSubdomains: false,
        limit: 5
      })
    })
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ 
        error: 'Firecrawl API error',
        status: response.status,
        message: error 
      }, { status: response.status })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      status: response.status,
      urlsFound: data.links?.length || 0,
      data: data
    })
    
  } catch (error: any) {
    console.error('Test failed:', error)
    return NextResponse.json({ 
      error: 'Failed to connect to Firecrawl',
      message: error.message 
    }, { status: 500 })
  }
}