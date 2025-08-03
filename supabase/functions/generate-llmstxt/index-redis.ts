import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import OpenAI from 'https://esm.sh/openai@4.24.0'
import { Redis } from 'https://esm.sh/@upstash/redis@1.31.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeResult {
  url: string
  content: string
  success: boolean
  error?: string
  title?: string
  description?: string
  cached?: boolean
}

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
    const upstashRedisUrl = Deno.env.get('UPSTASH_REDIS_URL')!
    const upstashRedisToken = Deno.env.get('UPSTASH_REDIS_TOKEN')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })
    const redis = new Redis({
      url: upstashRedisUrl,
      token: upstashRedisToken,
    })
    
    const baseUrl = 'https://sidetool.co'
    const maxUrls = 20 // Can process more with caching
    
    console.log(`Starting llms.txt generation for ${baseUrl}`)
    
    // Get or set the list of URLs to process
    let urlsToProcess = await redis.get<string[]>('sidetool:urls')
    
    if (!urlsToProcess) {
      // First time: set up the URLs
      urlsToProcess = [
        'https://sidetool.co',
        'https://sidetool.co/about',
        'https://sidetool.co/services', 
        'https://sidetool.co/case-studies',
        'https://sidetool.co/case-studies/test-pilot',
        'https://sidetool.co/case-studies/bidx',
        'https://sidetool.co/case-studies/altinvest',
        'https://sidetool.co/case-studies/revenueroll',
        'https://sidetool.co/case-studies/envoys',
        'https://sidetool.co/case-studies/surveill',
        'https://sidetool.co/case-studies/gritppo',
        'https://sidetool.co/case-studies/the-wie-suite',
        'https://sidetool.co/case-studies/ipm',
        'https://sidetool.co/case-studies/trn',
        'https://sidetool.co/case-studies/waterfront',
        'https://sidetool.co/case-studies/route-genius',
        'https://sidetool.co/case-studies/hi-coach',
        'https://sidetool.co/blog',
        'https://sidetool.co/contact',
        'https://sidetool.co/pricing'
      ]
      
      // Store in Redis for 30 days
      await redis.setex('sidetool:urls', 2592000, JSON.stringify(urlsToProcess))
    }
    
    urlsToProcess = urlsToProcess.slice(0, maxUrls)
    console.log(`Processing ${urlsToProcess.length} URLs`)
    
    // Check rate limit
    const rateKey = 'firecrawl:rate:minute'
    const currentCount = await redis.incr(rateKey)
    
    if (currentCount === 1) {
      // First request in this minute, set expiry
      await redis.expire(rateKey, 60)
    }
    
    const scrapedData: ScrapeResult[] = []
    
    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i]
      const cacheKey = `content:${url}`
      
      // Check cache first
      const cachedContent = await redis.get<string>(cacheKey)
      
      if (cachedContent) {
        console.log(`Using cached content for ${url}`)
        scrapedData.push({
          url,
          content: cachedContent,
          success: true,
          cached: true
        })
        continue
      }
      
      // Check rate limit before making request
      const requestCount = await redis.get<number>(rateKey) || 0
      
      if (requestCount >= 45) {
        console.log('Approaching rate limit, waiting 60 seconds...')
        await delay(60000)
        await redis.set(rateKey, 0)
      }
      
      console.log(`Scraping ${i + 1}/${urlsToProcess.length}: ${url}`)
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 0,
            timeout: 30000
          })
        })
        
        // Increment rate counter
        await redis.incr(rateKey)
        
        const scrapeText = await scrapeResponse.text()
        
        if (!scrapeResponse.ok) {
          if (scrapeText.includes('Rate limit exceeded')) {
            console.log('Rate limit hit, waiting 60 seconds...')
            await delay(60000)
            await redis.set(rateKey, 0)
            i-- // Retry this URL
            continue
          }
          throw new Error(`Scrape failed: ${scrapeText}`)
        }
        
        const result = JSON.parse(scrapeText)
        const markdown = result?.data?.markdown || result?.markdown || ''
        
        if (markdown) {
          // Cache the content for 7 days
          await redis.setex(cacheKey, 604800, markdown)
          console.log(`Cached content for ${url}`)
        }
        
        scrapedData.push({
          url,
          content: markdown,
          success: !!markdown,
          error: markdown ? undefined : 'No content found'
        })
        
        // Small delay between requests
        if (i < urlsToProcess.length - 1) {
          await delay(1500)
        }
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
        scrapedData.push({
          url,
          content: '',
          success: false,
          error: String(error)
        })
      }
    }
    
    const successfulScrapes = scrapedData.filter(d => d.success)
    console.log(`Successfully processed ${successfulScrapes.length} URLs (${scrapedData.filter(d => d.cached).length} from cache)`)
    
    // Generate summaries for successful scrapes
    for (const data of scrapedData) {
      if (!data.success || !data.content) {
        data.title = 'Page'
        data.description = 'Content not available'
        continue
      }
      
      // Check if we have cached summary
      const summaryKey = `summary:${data.url}`
      const cachedSummary = await redis.get<{title: string, description: string}>(summaryKey)
      
      if (cachedSummary) {
        data.title = cachedSummary.title
        data.description = cachedSummary.description
        continue
      }
      
      try {
        const prompt = `Given this webpage content from ${data.url}, generate:
1. A title (3-4 words max)
2. A description (9-10 words max)

Content:
${data.content.substring(0, 2000)}

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
        
        data.title = title
        data.description = description
        
        // Cache the summary for 30 days
        await redis.setex(summaryKey, 2592000, JSON.stringify({title, description}))
        
      } catch (error) {
        console.error(`Error generating summary for ${data.url}:`, error)
        data.title = 'Page'
        data.description = 'Content summary'
      }
    }
    
    // Generate llms.txt content
    const llmsTxtLines = [`# ${baseUrl} llms.txt`, '']
    for (const data of scrapedData) {
      if (data.success) {
        llmsTxtLines.push(`- [${data.title}](${data.url}): ${data.description}`)
      }
    }
    const llmsTxtContent = llmsTxtLines.join('\n')
    
    // Generate llms-full.txt content
    const llmsFullTxtSections = [`# ${baseUrl} llms-full.txt`, '']
    let pageIndex = 1
    for (const data of scrapedData) {
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
        urls_processed: urlsToProcess.length,
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
    
    // Store generation stats in Redis
    await redis.incr('sidetool:generation:count')
    await redis.set('sidetool:generation:latest', new Date().toISOString())
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'LLMs.txt files generated successfully',
        urls_processed: urlsToProcess.length,
        urls_successful: successfulScrapes.length,
        cached_content: scrapedData.filter(d => d.cached).length,
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