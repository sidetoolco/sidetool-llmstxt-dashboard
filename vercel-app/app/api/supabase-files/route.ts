import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the latest generation and its files
    const { data: latestGeneration, error: generationError } = await supabase
      .from('llms_latest_generation')
      .select('*')
      .single()

    if (generationError) {
      console.error('Error fetching latest generation:', generationError)
      // Fallback to manual query if view doesn't exist yet
      const { data: fallbackGeneration, error: fallbackError } = await supabase
        .from('llms_generations')
        .select('*')
        .eq('status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (fallbackError) {
        return NextResponse.json({
          error: 'No completed generations found',
          fallback: true
        }, { status: 404 })
      }

      // Get files for this generation with publish status
      const { data: files, error: filesError } = await supabase
        .from('llms_files')
        .select('id, generation_id, file_key, file_name, file_path, content, size, category, description, post_count, topic, blog_post, url, generated_at, published, published_at, published_url, publish_notes')
        .eq('generation_id', fallbackGeneration.generation_id)
        .order('category')
        .order('file_name')

      if (filesError) {
        console.error('Error fetching files:', filesError)
        return NextResponse.json({
          error: 'Failed to fetch files'
        }, { status: 500 })
      }

      return buildResponse(fallbackGeneration, files || [])
    }

    // Get files for the latest generation with publish status
    const { data: files, error: filesError } = await supabase
      .from('llms_files')
      .select('id, generation_id, file_key, file_name, file_path, content, size, category, description, post_count, topic, blog_post, url, generated_at, published, published_at, published_url, publish_notes')
      .eq('generation_id', latestGeneration.generation_id)
      .order('category')
      .order('file_name')

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json({
        error: 'Failed to fetch files'
      }, { status: 500 })
    }

    return buildResponse(latestGeneration, files || [])

  } catch (error: any) {
    console.error('Supabase API error:', error)
    return NextResponse.json({
      error: 'Failed to connect to database',
      details: error.message
    }, { status: 500 })
  }
}

function buildResponse(generation: any, files: any[]) {
  // Transform files into the expected format
  const filesObject: Record<string, any> = {}
  
  files.forEach(file => {
    filesObject[file.file_key] = {
      id: file.id,
      name: file.file_name,
      content: file.content,
      size: file.size,
      description: file.description,
      category: file.category,
      postCount: file.post_count,
      topic: file.topic,
      blogPost: file.blog_post,
      url: file.url,
      published: file.published || false,
      publishedAt: file.published_at,
      publishedUrl: file.published_url,
      publishNotes: file.publish_notes,
      storageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/llms-files/${file.file_path}`
    }
  })

  // Calculate stats from files
  const categories = ['collection', 'topic', 'individual']
  const categoryStats = categories.reduce((stats, category) => {
    stats[category] = files.filter(f => f.category === category).length
    return stats
  }, {} as Record<string, number>)

  const response = {
    date: new Date(generation.generated_at).toISOString().split('T')[0],
    generatedAt: generation.generated_at,
    generationId: generation.generation_id,
    source: 'supabase-cron',
    stats: {
      totalFiles: generation.file_count,
      totalPosts: generation.blog_posts?.length || 0,
      newPostsToday: generation.blog_posts?.filter((p: any) => 
        p.date === new Date().toISOString().split('T')[0]
      ).length || 0,
      totalKeywords: generation.blog_posts ? 
        [...new Set(generation.blog_posts.flatMap((p: any) => p.keywords || []))].length : 0,
      categories: categoryStats
    },
    files: filesObject,
    blogPosts: generation.blog_posts || [],
    implementation: {
      steps: [
        "Files are automatically generated daily at 3 AM UTC",
        "Download any file from the dashboard",
        "Upload to your website's root directory (/public or /)",
        "Ensure it's accessible at https://sidetool.co/llms.txt",
        "Files are also available via Supabase Storage CDN"
      ],
      storageInfo: "Files are stored in Supabase Storage with public CDN access",
      automationInfo: "Powered by Supabase Edge Functions and pg_cron"
    }
  }

  return NextResponse.json(response)
}

// Trigger manual generation
export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the Edge Function to generate new files
    const { data, error } = await supabase.functions.invoke('generate-llms-daily')

    if (error) {
      console.error('Error triggering generation:', error)
      return NextResponse.json({
        error: 'Failed to trigger generation',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Generation triggered successfully',
      data
    })

  } catch (error: any) {
    console.error('Manual generation error:', error)
    return NextResponse.json({
      error: 'Failed to trigger manual generation',
      details: error.message
    }, { status: 500 })
  }
}