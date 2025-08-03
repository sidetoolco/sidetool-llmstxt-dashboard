import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is from Supabase Cron
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Cron job triggered: Starting llms.txt generation')
    
    // Call the generate-llmstxt function
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-llmstxt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Generation failed: ${JSON.stringify(result)}`)
    }
    
    console.log('Cron job completed successfully:', result)
    
    // Log cron execution
    await supabase
      .from('llms_generation_logs')
      .insert({
        site_url: 'https://sidetool.co',
        urls_processed: result.urls_processed || 0,
        urls_successful: result.urls_successful || 0,
        llms_txt_path: result.files?.llms_txt || null,
        llms_full_txt_path: result.files?.llms_full_txt || null,
        generated_at: new Date().toISOString()
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron job executed successfully',
        generation_result: result
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('Cron job error:', error)
    
    // Log error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('llms_generation_logs')
        .insert({
          site_url: 'https://sidetool.co',
          urls_processed: 0,
          urls_successful: 0,
          error_message: `Cron error: ${String(error)}`,
          generated_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log cron error:', logError)
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error)
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})