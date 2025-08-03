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
    console.log('Starting simple generation test')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const baseUrl = 'https://sidetool.co'
    const timestamp = new Date().toISOString().split('T')[0]
    
    // Create simple test content
    const llmsTxtContent = `# ${baseUrl} llms.txt

- [Sidetool Homepage](https://sidetool.co): Custom AI automations for your business
- [About](https://sidetool.co/about): Learn about our automation services
- [Services](https://sidetool.co/services): AI solutions and workflow automation
- [Case Studies](https://sidetool.co/case-studies): Success stories from our clients
- [Contact](https://sidetool.co/contact): Get in touch with our team

Generated: ${new Date().toISOString()}`

    const llmsFullTxtContent = `# ${baseUrl} llms-full.txt

<|firecrawl-page-1-lllmstxt|>
# Sidetool - Custom AI Automations

Sidetool specializes in building custom AI automations that handle your business tasks, hassle-free.

## Our Services
- Custom AI Solutions
- Workflow Automation  
- AI Integration
- Business Process Optimization

## Why Choose Sidetool?
- Expert team of AI specialists
- Fast delivery (days, not months)
- Transparent pricing
- Flexible engagement models

Visit https://sidetool.co for more information.

Generated: ${new Date().toISOString()}`
    
    console.log('Uploading files to storage...')
    
    // Upload llms.txt
    const llmsTxtPath = `sidetool/${timestamp}/llms.txt`
    const { error: llmsTxtError } = await supabase.storage
      .from('llms-files')
      .upload(llmsTxtPath, new Blob([llmsTxtContent], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (llmsTxtError) {
      console.error('Error uploading llms.txt:', llmsTxtError)
      throw llmsTxtError
    }
    
    console.log('llms.txt uploaded successfully')
    
    // Upload llms-full.txt
    const llmsFullTxtPath = `sidetool/${timestamp}/llms-full.txt`
    const { error: llmsFullTxtError } = await supabase.storage
      .from('llms-files')
      .upload(llmsFullTxtPath, new Blob([llmsFullTxtContent], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (llmsFullTxtError) {
      console.error('Error uploading llms-full.txt:', llmsFullTxtError)
      throw llmsFullTxtError
    }
    
    console.log('llms-full.txt uploaded successfully')
    
    // Store metadata in database
    const { error: dbError } = await supabase
      .from('llms_generation_logs')
      .insert({
        site_url: baseUrl,
        urls_processed: 5,
        urls_successful: 5,
        llms_txt_path: llmsTxtPath,
        llms_full_txt_path: llmsFullTxtPath,
        generated_at: new Date().toISOString()
      })
    
    if (dbError) {
      console.error('Error storing metadata:', dbError)
      throw dbError
    }
    
    console.log('Metadata stored successfully')
    
    // Create public URLs for the files
    const { data: llmsTxtUrl } = supabase.storage
      .from('llms-files')
      .getPublicUrl(llmsTxtPath)
    
    const { data: llmsFullTxtUrl } = supabase.storage
      .from('llms-files')
      .getPublicUrl(llmsFullTxtPath)
    
    console.log('Generation complete!')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simple test files generated successfully',
        urls_processed: 5,
        urls_successful: 5,
        files: {
          llms_txt: llmsTxtUrl.publicUrl,
          llms_full_txt: llmsFullTxtUrl.publicUrl
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('Error in generate-llmstxt function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        message: 'Internal error occurred'
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