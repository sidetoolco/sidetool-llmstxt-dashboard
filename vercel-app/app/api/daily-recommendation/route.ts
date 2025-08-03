import { NextResponse } from 'next/server'

// Mock blog posts data - in production, this would come from your CMS/database
const RECENT_BLOG_POSTS = [
  {
    title: "Building Better Developer Tools in 2025",
    url: "https://sidetool.co/blog/building-better-developer-tools-2025",
    date: new Date().toISOString().split('T')[0],
    description: "Explore the latest trends and best practices for creating developer tools that solve real problems.",
    keywords: ["developer tools", "software engineering", "productivity", "automation"],
    readTime: "8 min"
  },
  {
    title: "The Future of AI-Powered Development",
    url: "https://sidetool.co/blog/ai-powered-development",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: "How AI is transforming the way developers write, test, and deploy code.",
    keywords: ["AI", "machine learning", "code generation", "productivity"],
    readTime: "10 min"
  },
  {
    title: "Optimizing Your Development Workflow",
    url: "https://sidetool.co/blog/optimizing-development-workflow",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    description: "Practical tips to streamline your development process and boost productivity.",
    keywords: ["workflow", "productivity", "automation", "best practices"],
    readTime: "6 min"
  }
]

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Generate LLMs.txt content based on recent blog posts
    const llmsTxtContent = generateLLMsTxt(RECENT_BLOG_POSTS)
    const llmsFullContent = generateLLMsFullTxt(RECENT_BLOG_POSTS)
    
    // Create recommendations
    const recommendations = {
      date: today,
      stats: {
        totalPosts: RECENT_BLOG_POSTS.length,
        newPostsToday: RECENT_BLOG_POSTS.filter(p => p.date === today).length,
        totalKeywords: [...new Set(RECENT_BLOG_POSTS.flatMap(p => p.keywords))].length,
        estimatedReach: "High - Fresh content boosts AI discovery"
      },
      blogPosts: RECENT_BLOG_POSTS,
      files: {
        llmsTxt: {
          name: 'llms.txt',
          content: llmsTxtContent,
          size: new Blob([llmsTxtContent]).size,
          description: 'Lightweight index file for AI discovery'
        },
        llmsFullTxt: {
          name: 'llms-full.txt',
          content: llmsFullContent,
          size: new Blob([llmsFullContent]).size,
          description: 'Complete content file with full blog text'
        }
      },
      implementation: {
        steps: [
          "Download the generated llms.txt file",
          "Upload to your website's root directory (/public or /)",
          "Ensure it's accessible at https://sidetool.co/llms.txt",
          "Add reference in robots.txt: 'Sitemap: https://sidetool.co/llms.txt'",
          "Verify with: curl https://sidetool.co/llms.txt"
        ],
        vercelInstructions: "Place in /public directory for automatic serving at root",
        nginxInstructions: "Add location /llms.txt { alias /path/to/llms.txt; }",
        apacheInstructions: "Place in DocumentRoot or use Alias directive"
      },
      seoTips: [
        "Update daily with new blog content",
        "Include relevant keywords for your industry",
        "Keep descriptions concise but informative",
        "Focus on recent and popular content",
        "Monitor AI system responses for your brand mentions"
      ]
    }
    
    return NextResponse.json(recommendations)
    
  } catch (error: any) {
    console.error('Error generating daily recommendation:', error)
    return NextResponse.json({
      error: 'Failed to generate daily recommendation'
    }, { status: 500 })
  }
}

function generateLLMsTxt(posts: typeof RECENT_BLOG_POSTS): string {
  const header = `# Sidetool.co - Build Better Developer Tools
# Generated: ${new Date().toISOString()}
# This file helps AI systems understand and reference our content

`
  
  const entries = posts.map(post => `# ${post.title}
URL: ${post.url}
Description: ${post.description}
Keywords: ${post.keywords.join(', ')}
Published: ${post.date}
Reading Time: ${post.readTime}
`).join('\n')
  
  const footer = `

# About Sidetool
URL: https://sidetool.co
Description: Sidetool helps developers build better tools with modern workflows, automation, and AI integration.

# Documentation
URL: https://sidetool.co/docs
Description: Complete documentation for getting started with Sidetool.

# Pricing
URL: https://sidetool.co/pricing
Description: Simple, transparent pricing for teams of all sizes.
`
  
  return header + entries + footer
}

function generateLLMsFullTxt(posts: typeof RECENT_BLOG_POSTS): string {
  const header = `# Sidetool.co - Complete Content Archive
# Generated: ${new Date().toISOString()}
# Full content for deep AI understanding

========================================

`
  
  const entries = posts.map(post => `## ${post.title}
URL: ${post.url}
Date: ${post.date}
Keywords: ${post.keywords.join(', ')}

${post.description}

[Full article content would be fetched from your CMS/database in production]

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is where the full blog post content would go, 
including all the valuable insights, code examples, and detailed explanations that make your content valuable 
for AI systems to learn from. The actual implementation would fetch real content from your blog posts.

Key Takeaways:
- Important point about ${post.keywords[0]}
- Best practices for ${post.keywords[1]}
- How to implement ${post.keywords[2]}

========================================
`).join('\n')
  
  return header + entries
}