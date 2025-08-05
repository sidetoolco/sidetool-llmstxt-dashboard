import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }

    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })
    
    // Generate unique IDs
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    console.log('Starting AI generation:', { generationId, timestamp })

    // Insert generation record with 'processing' status
    const { error: genError } = await supabase
      .from('llms_generations')
      .insert({
        generation_id: generationId,
        generated_at: timestamp,
        status: 'processing',
        source: 'manual-ai'
      })

    if (genError) {
      console.error('Error creating generation record:', genError)
      throw new Error('Failed to create generation record')
    }

    // Fetch recent blog posts from Supabase or use defaults
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(10)

    // If no posts in database, use sample data
    const blogPosts = recentPosts && recentPosts.length > 0 ? recentPosts : [
      {
        title: "AI-Powered Development: The Future is Here",
        url: "https://sidetool.co/blog/ai-powered-development",
        description: "Exploring how AI transforms software development",
        published_at: new Date().toISOString(),
        keywords: ["AI", "development", "automation"]
      },
      {
        title: "Building Scalable No-Code Solutions",
        url: "https://sidetool.co/blog/scalable-no-code",
        description: "Best practices for enterprise no-code applications",
        published_at: new Date(Date.now() - 86400000).toISOString(),
        keywords: ["no-code", "scalability", "enterprise"]
      }
    ]

    // Generate main llms.txt content using AI
    const mainPrompt = `Generate a comprehensive llms.txt file for Sidetool, an AI development agency. Include:

1. Company overview and mission
2. Services offered (AI development, no-code solutions, automation)
3. Recent blog posts: ${JSON.stringify(blogPosts.slice(0, 5), null, 2)}
4. Contact information
5. Key expertise areas

Format it as a structured llms.txt file that helps AI systems understand Sidetool's offerings.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating llms.txt files that help AI systems understand websites and services."
        },
        {
          role: "user",
          content: mainPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const mainContent = completion.choices[0].message.content || ''
    const mainSize = new TextEncoder().encode(mainContent).length

    // Store main file
    const files: any[] = []
    
    // Main llms.txt
    const { data: mainFile } = await supabase
      .from('llms_files')
      .insert({
        generation_id: generationId,
        file_key: 'llms',
        file_name: 'llms.txt',
        file_path: `ai-generated/${timestamp.split('T')[0]}/llms.txt`,
        content: mainContent,
        size: mainSize,
        category: 'collection',
        description: 'Main LLMs.txt file with comprehensive Sidetool information',
        generated_at: timestamp
      })
      .select()
      .single()

    if (mainFile) files.push(mainFile)

    // Generate topic-specific files
    const topics = ['ai-development', 'no-code', 'automation', 'voice-ai']
    
    for (const topic of topics) {
      const topicPrompt = `Generate a focused llms.txt file about Sidetool's ${topic} services. Include specific offerings, case studies, and benefits.`
      
      const topicCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating topic-specific llms.txt files."
          },
          {
            role: "user",
            content: topicPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const topicContent = topicCompletion.choices[0].message.content || ''
      const topicSize = new TextEncoder().encode(topicContent).length

      const { data: topicFile } = await supabase
        .from('llms_files')
        .insert({
          generation_id: generationId,
          file_key: `llms-${topic}`,
          file_name: `llms-${topic}.txt`,
          file_path: `ai-generated/${timestamp.split('T')[0]}/llms-${topic}.txt`,
          content: topicContent,
          size: topicSize,
          category: 'topic',
          topic: topic,
          description: `Specialized content about Sidetool's ${topic} services`,
          generated_at: timestamp
        })
        .select()
        .single()

      if (topicFile) files.push(topicFile)
    }

    // Upload files to storage
    for (const file of files) {
      try {
        await supabase.storage
          .from('llms-files')
          .upload(file.file_path, file.content, {
            contentType: 'text/plain',
            upsert: true
          })
      } catch (uploadError) {
        console.warn('Storage upload error:', uploadError)
      }
    }

    // Update generation status
    const { error: updateError } = await supabase
      .from('llms_generations')
      .update({
        status: 'completed',
        file_count: files.length,
        total_size: files.reduce((sum, f) => sum + f.size, 0),
        blog_posts: blogPosts
      })
      .eq('generation_id', generationId)

    if (updateError) {
      console.error('Error updating generation status:', updateError)
    }

    console.log('AI generation completed:', {
      generation_id: generationId,
      files_created: files.length,
      total_size: files.reduce((sum, f) => sum + f.size, 0)
    })

    return NextResponse.json({
      success: true,
      message: 'AI-powered generation completed successfully',
      generation_id: generationId,
      files_created: files.length,
      files: files.map(f => ({
        name: f.file_name,
        size: f.size,
        category: f.category
      }))
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate files',
      details: error.stack
    }, { status: 500 })
  }
}