import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import OpenAI from 'https://esm.sh/openai@4.24.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeResult {
  url: string
  content: string
  success: boolean
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })
    
    const baseUrl = 'https://sidetool.co'
    const maxUrls = 50
    
    console.log(`Starting llms.txt generation for ${baseUrl}`)
    
    // Map website URLs using Firecrawl API directly
    const mapResponse = await fetch('https://api.firecrawl.dev/v0/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: baseUrl,
        limit: maxUrls
      })
    })
    
    if (!mapResponse.ok) {
      throw new Error(`Firecrawl map failed: ${await mapResponse.text()}`)
    }
    
    const mapResult = await mapResponse.json()
    
    if (!mapResult?.links || mapResult.links.length === 0) {
      throw new Error('No URLs found during mapping')
    }
    
    const urls = mapResult.links.slice(0, maxUrls)
    console.log(`Found ${urls.length} URLs to process`)
    
    // Scrape all URLs
    const scrapePromises = urls.map(async (url: string) => {
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown'],
            onlyMainContent: true
          })
        })
        
        if (!scrapeResponse.ok) {
          throw new Error(`Scrape failed for ${url}: ${await scrapeResponse.text()}`)
        }
        
        const result = await scrapeResponse.json()
        
        return {
          url,
          content: result?.data?.markdown || result?.markdown || '',
          success: !!(result?.data?.markdown || result?.markdown),
          error: (result?.data?.markdown || result?.markdown) ? undefined : 'No content found'
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
        return {
          url,
          content: '',
          success: false,
          error: String(error)
        }
      }
    })
    
    const scrapedData = await Promise.all(scrapePromises)
    const successfulScrapes = scrapedData.filter(d => d.success)
    console.log(`Successfully scraped ${successfulScrapes.length} out of ${scrapedData.length} URLs`)
    
    // Generate summaries for each page
    const summaryPromises = scrapedData.map(async (data) => {
      if (!data.success || !data.content) {
        return { ...data, title: 'Page', description: 'Content not available' }
      }
      
      try {
        const prompt = `Given this webpage content from ${data.url}, generate:
1. A title (3-4 words max)
2. A description (9-10 words max)

Content:
${data.content.substring(0, 3000)}

Format your response as:
Title: [title here]
Description: [description here]`
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates concise summaries.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.3
        })
        
        const result = response.choices[0].message.content || ''
        const lines = result.split('\n')
        
        let title = 'Page'
        let description = 'Content summary'
        
        for (const line of lines) {
          if (line.startsWith('Title:')) {
            title = line.replace('Title:', '').trim()
          } else if (line.startsWith('Description:')) {
            description = line.replace('Description:', '').trim()
          }
        }
        
        return { ...data, title, description }
      } catch (error) {
        console.error(`Error generating summary for ${data.url}:`, error)
        return { ...data, title: 'Page', description: 'Content summary' }
      }
    })
    
    const dataWithSummaries = await Promise.all(summaryPromises)
    
    // Generate llms.txt content
    const llmsTxtLines = [`# ${baseUrl} llms.txt`, '']
    for (const data of dataWithSummaries) {
      if (data.success && data.content) {
        llmsTxtLines.push(`- [${data.title}](${data.url}): ${data.description}`)
      }
    }
    const llmsTxtContent = llmsTxtLines.join('\n')
    
    // Generate llms-full.txt content
    const llmsFullTxtSections = [`# ${baseUrl} llms-full.txt`, '']
    let pageIndex = 1
    for (const data of dataWithSummaries) {
      if (data.success && data.content) {
        llmsFullTxtSections.push(`<|firecrawl-page-${pageIndex}-lllmstxt|>`)
        llmsFullTxtSections.push(data.content)
        llmsFullTxtSections.push('')
        pageIndex++
      }
    }
    const llmsFullTxtContent = llmsFullTxtSections.join('\n')
    
    // Store in Supabase Storage
    const timestamp = new Date().toISOString().split('T')[0]
    
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
    
    // Store metadata in database
    const { error: dbError } = await supabase
      .from('llms_generation_logs')
      .insert({
        site_url: baseUrl,
        urls_processed: urls.length,
        urls_successful: successfulScrapes.length,
        llms_txt_path: llmsTxtPath,
        llms_full_txt_path: llmsFullTxtPath,
        generated_at: new Date().toISOString()
      })
    
    if (dbError) {
      console.error('Error storing metadata:', dbError)
      throw dbError
    }
    
    // Create public URLs for the files
    const { data: llmsTxtUrl } = supabase.storage
      .from('llms-files')
      .getPublicUrl(llmsTxtPath)
    
    const { data: llmsFullTxtUrl } = supabase.storage
      .from('llms-files')
      .getPublicUrl(llmsFullTxtPath)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'LLMs.txt files generated successfully',
        urls_processed: urls.length,
        urls_successful: successfulScrapes.length,
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
    
    // Log error to database
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
          error_message: String(error),
          generated_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
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