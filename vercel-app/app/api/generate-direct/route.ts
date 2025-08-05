import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Blog post data (same as in Edge Function)
const RECENT_BLOG_POSTS = [
  {
    title: "Building Better Developer Tools in 2025",
    url: "https://sidetool.co/blog/building-better-developer-tools-2025",
    date: new Date().toISOString().split('T')[0],
    description: "Explore the latest trends and best practices for creating developer tools that solve real problems.",
    keywords: ["developer tools", "software engineering", "productivity", "automation", "AI"],
    readTime: "8 min",
    category: "ai-development"
  },
  {
    title: "The Future of AI-Powered Development",
    url: "https://sidetool.co/blog/ai-powered-development",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: "How AI is transforming the way developers write, test, and deploy code.",
    keywords: ["AI", "machine learning", "code generation", "productivity", "automation"],
    readTime: "10 min",
    category: "ai-development"
  },
  {
    title: "Optimizing Your Development Workflow",
    url: "https://sidetool.co/blog/optimizing-development-workflow",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    description: "Practical tips to streamline your development process and boost productivity.",
    keywords: ["workflow", "productivity", "automation", "best practices", "efficiency"],
    readTime: "6 min",
    category: "automation"
  },
  {
    title: "No-Code Solutions for Modern Businesses",
    url: "https://sidetool.co/blog/no-code-solutions",
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    description: "How no-code platforms are democratizing application development.",
    keywords: ["no-code", "Bubble", "FlutterFlow", "business automation", "rapid development"],
    readTime: "7 min",
    category: "no-code"
  },
  {
    title: "Voice AI Integration Best Practices",
    url: "https://sidetool.co/blog/voice-ai-integration",
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    description: "Complete guide to integrating voice AI solutions in your applications.",
    keywords: ["voice AI", "Vapi AI", "Retell", "conversational interfaces", "speech recognition"],
    readTime: "9 min",
    category: "voice-ai"
  }
]

function generateMainLlmsTxt(posts: any[]) {
  return `# Sidetool - AI-Powered Development Agency
# Generated: ${new Date().toISOString()}
# Direct Generation (Temporary)

## About Sidetool
We build cutting-edge AI applications, automation workflows, and scalable no-code solutions.
Website: https://www.sidetool.co

## Latest Blog Posts

${posts.map(post => `### ${post.title}
URL: ${post.url}
Description: ${post.description}
Keywords: ${post.keywords.join(', ')}
Published: ${post.date}
`).join('\n')}

## Services
- AI & LLM Development
- No-Code Solutions
- Enterprise Automation

Contact: https://www.sidetool.co/contact
`
}

export async function POST() {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/generate-direct',
    },
    async (span) => {
      try {
        const { logger } = Sentry
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        logger.info('Starting direct generation (temporary workaround)', {
          trigger: 'manual',
          timestamp: new Date().toISOString()
        })

        const generationId = crypto.randomUUID()
        const timestamp = new Date().toISOString()

        // Generate simple llms.txt content
        const llmsContent = generateMainLlmsTxt(RECENT_BLOG_POSTS)
        const llmsSize = new TextEncoder().encode(llmsContent).length

        // Store in database
        const { error: genError } = await supabase
          .from('llms_generations')
          .insert({
            generation_id: generationId,
            generated_at: timestamp,
            file_count: 1,
            total_size: llmsSize,
            status: 'completed'
          })

        if (genError) {
          logger.error('Error inserting generation record', { error: genError })
          throw genError
        }

        // Store file record
        const { error: fileError } = await supabase
          .from('llms_files')
          .insert({
            generation_id: generationId,
            file_key: 'llms',
            file_name: 'llms.txt',
            file_path: `direct/${timestamp.split('T')[0]}/llms.txt`,
            content: llmsContent,
            size: llmsSize,
            category: 'collection',
            description: 'Main LLMs.txt file (direct generation)',
            generated_at: timestamp
          })

        if (fileError) {
          logger.error('Error inserting file record', { error: fileError })
          throw fileError
        }

        // Store in Supabase Storage
        const filePath = `direct/${timestamp.split('T')[0]}/llms.txt`
        const { error: uploadError } = await supabase.storage
          .from('llms-files')
          .upload(filePath, llmsContent, {
            contentType: 'text/plain',
            upsert: true
          })

        if (uploadError) {
          logger.warn('Error uploading to storage (non-critical)', { error: uploadError })
        }

        logger.info('Direct generation completed successfully', {
          generation_id: generationId,
          file_count: 1
        })

        span.setAttribute('generation.success', true)
        span.setAttribute('generation.id', generationId)
        span.setAttribute('generation.method', 'direct')

        return NextResponse.json({
          success: true,
          message: 'Direct generation completed (temporary workaround)',
          generation_id: generationId,
          file_count: 1,
          total_size: llmsSize,
          generated_at: timestamp,
          note: 'This is a temporary workaround. Please deploy the Edge Function for full functionality.'
        })

      } catch (error: any) {
        const { logger } = Sentry
        logger.error('Direct generation error', {
          error: error.message,
          stack: error.stack
        })
        Sentry.captureException(error, {
          tags: {
            operation: 'direct-generation',
            error_type: 'generation-error'
          }
        })
        return NextResponse.json({
          success: false,
          error: 'Failed to generate files directly',
          details: error.message
        }, { status: 500 })
      }
    }
  )
}