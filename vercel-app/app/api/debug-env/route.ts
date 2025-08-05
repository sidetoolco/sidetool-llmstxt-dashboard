import { NextResponse } from 'next/server'

export async function GET() {
  // Only show in development or with a secret query parameter
  const isDev = process.env.NODE_ENV === 'development'
  
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: isDev ? process.env.NEXT_PUBLIC_SUPABASE_URL : '[HIDDEN]',
        startsWith: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        startsWith: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...'
      },
      SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      RESEND_API_KEY: {
        exists: !!process.env.RESEND_API_KEY,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) + '...'
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        startsWith: process.env.OPENAI_API_KEY?.substring(0, 7) + '...'
      },
      VERCEL_URL: {
        exists: !!process.env.VERCEL_URL,
        value: process.env.VERCEL_URL
      }
    },
    allConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    aiEnabled: !!process.env.OPENAI_API_KEY
  }

  return NextResponse.json(envCheck)
}