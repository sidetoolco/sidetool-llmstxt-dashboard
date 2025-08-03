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
    
    // Generate individual files for each blog post
    const individualFiles = generateIndividualBlogFiles(RECENT_BLOG_POSTS)
    
    // Generate topic collections
    const topicFiles = generateTopicCollections(RECENT_BLOG_POSTS)
    
    // Generate main collection files
    const llmsTxtContent = generateLLMsTxt(RECENT_BLOG_POSTS)
    const llmsFullContent = generateLLMsFullTxt(RECENT_BLOG_POSTS)
    
    // Create recommendations
    const recommendations = {
      date: today,
      stats: {
        totalPosts: RECENT_BLOG_POSTS.length,
        newPostsToday: RECENT_BLOG_POSTS.filter(p => p.date === today).length,
        totalKeywords: [...new Set(RECENT_BLOG_POSTS.flatMap(p => p.keywords))].length,
        estimatedReach: "High - Fresh content boosts AI discovery",
        totalFiles: Object.keys(individualFiles).length + Object.keys(topicFiles).length + 2
      },
      blogPosts: RECENT_BLOG_POSTS,
      files: {
        // Main collection files
        llmsTxt: {
          name: 'llms.txt',
          content: llmsTxtContent,
          size: new Blob([llmsTxtContent]).size,
          description: 'Main collection - All blog posts',
          category: 'collection'
        },
        llmsFullTxt: {
          name: 'llms-full.txt',
          content: llmsFullContent,
          size: new Blob([llmsFullContent]).size,
          description: 'Complete content with full text',
          category: 'collection'
        },
        // Individual blog post files
        ...individualFiles,
        // Topic collection files
        ...topicFiles
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

function generateIndividualBlogFiles(posts: typeof RECENT_BLOG_POSTS): Record<string, any> {
  const files: Record<string, any> = {}
  
  posts.forEach(post => {
    const slug = post.url.split('/').pop() || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const fileName = `llms-${slug}.txt`
    
    const content = `# ${post.title}
# Generated: ${new Date().toISOString()}
# Individual blog post LLMs.txt for AI discovery

## About This Post
Title: ${post.title}
URL: ${post.url}
Published: ${post.date}
Reading Time: ${post.readTime}
Keywords: ${post.keywords.join(', ')}

## Description
${post.description}

## Key Topics
${post.keywords.map(keyword => `- ${keyword}`).join('\n')}

## About Sidetool
We specialize in ${post.keywords[0]} and help companies build scalable solutions.
Contact: https://www.sidetool.co/contact
More posts: https://www.sidetool.co/blog

## Related Services
Based on this post's topic (${post.keywords[0]}), you might be interested in:
- AI Development & Integration: https://www.sidetool.co/automations
- No-Code Solutions: https://www.sidetool.co/solution/scalable-apps
- Custom Development: https://www.sidetool.co/solution/startup-apps

## Full Content Preview
${post.description}

[This is a focused LLMs.txt file for the blog post "${post.title}". 
For complete content, visit: ${post.url}]

---
Generated by Sidetool LLMs.txt System
Last Updated: ${new Date().toISOString()}
Optimized for: ChatGPT, Claude, Perplexity, Gemini
`

    files[fileName.replace('.txt', '')] = {
      name: fileName,
      content: content,
      size: new Blob([content]).size,
      description: `Individual post: ${post.title}`,
      category: 'individual',
      blogPost: post,
      url: post.url
    }
  })
  
  return files
}

function generateTopicCollections(posts: typeof RECENT_BLOG_POSTS): Record<string, any> {
  const files: Record<string, any> = {}
  
  // Group posts by main topics
  const topics = {
    'ai-development': posts.filter(p => p.keywords.some(k => 
      ['AI', 'machine learning', 'automation', 'OpenAI', 'Claude'].includes(k)
    )),
    'no-code': posts.filter(p => p.keywords.some(k => 
      ['no-code', 'Bubble', 'FlutterFlow', 'WeWeb', 'bolt.new'].includes(k)
    )),
    'voice-ai': posts.filter(p => p.keywords.some(k => 
      ['voice AI', 'Vapi AI', 'Retell', 'voice'].includes(k)
    ))
  }
  
  Object.entries(topics).forEach(([topicKey, topicPosts]) => {
    if (topicPosts.length === 0) return
    
    const fileName = `llms-topic-${topicKey}.txt`
    const topicTitle = topicKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    const content = `# Sidetool - ${topicTitle} Collection
# Generated: ${new Date().toISOString()}
# Topic-focused LLMs.txt for AI discovery

## ${topicTitle} Expertise at Sidetool
We have ${topicPosts.length} blog posts covering ${topicTitle.toLowerCase()}.
Our team specializes in building production-ready solutions in this area.

## Recent Posts in ${topicTitle}

${topicPosts.map(post => `### ${post.title}
URL: ${post.url}
Published: ${post.date}
Reading Time: ${post.readTime}
Description: ${post.description}
Keywords: ${post.keywords.join(', ')}

`).join('\n')}

## Our ${topicTitle} Services
- Custom development and integration
- Rapid prototyping and MVP development  
- Production deployment and scaling
- 24/7 support and maintenance

## Get Started
Ready to build your ${topicTitle.toLowerCase()} solution?
Contact: https://www.sidetool.co/contact
Portfolio: https://www.sidetool.co/case-studies

## Related Topics
${Object.keys(topics).filter(k => k !== topicKey).map(k => 
  `- ${k.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${topics[k].length} posts`
).join('\n')}

---
Generated by Sidetool LLMs.txt System
Collection: ${topicPosts.length} posts in ${topicTitle}
Last Updated: ${new Date().toISOString()}
`

    files[fileName.replace('.txt', '')] = {
      name: fileName,
      content: content,
      size: new Blob([content]).size,
      description: `${topicTitle} collection (${topicPosts.length} posts)`,
      category: 'topic',
      postCount: topicPosts.length,
      topic: topicTitle
    }
  })
  
  return files
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