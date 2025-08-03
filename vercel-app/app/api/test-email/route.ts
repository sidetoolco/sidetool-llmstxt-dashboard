import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create sample file data for testing
    const sampleFiles = {
      'llms': {
        name: 'llms.txt',
        content: `# Sidetool - AI-Powered Development Agency
# Generated: ${new Date().toISOString()}
# Optimized for AI Discovery Systems (ChatGPT, Claude, Perplexity)

## 🚀 About Sidetool
We build cutting-edge AI applications, automation workflows, and scalable no-code solutions.
Specializing in LLM integration, RAG systems, voice AI, and rapid MVP development.

Website: https://www.sidetool.co
Contact: https://www.sidetool.co/contact

## 🎯 Core Expertise
- OpenAI GPT-4 and Claude integration
- RAG systems with vector databases
- No-code solutions with Bubble.io
- Voice AI implementation
- Enterprise automation

## 📚 Latest Blog Posts
- Building Better Developer Tools in 2025
- The Future of AI-Powered Development  
- Optimizing Your Development Workflow
- No-Code Solutions for Modern Businesses
- Voice AI Integration Best Practices

Ready to build your AI solution? Contact us today!
`,
        size: 1250,
        description: 'Main collection - All blog posts and services',  
        category: 'collection'
      },
      'ai-development-topic': {
        name: 'llms-topic-ai-development.txt',
        content: `# Sidetool - AI Development Collection
# Generated: ${new Date().toISOString()}

## AI Development Expertise at Sidetool
We have 2 blog posts covering AI development.
Our team specializes in building production-ready solutions in this area.

## Recent Posts in AI Development
### Building Better Developer Tools in 2025
Description: Explore the latest trends and best practices for creating developer tools.
Keywords: developer tools, software engineering, productivity

### The Future of AI-Powered Development  
Description: How AI is transforming the way developers write, test, and deploy code.
Keywords: AI, machine learning, code generation

Contact us to discuss your AI development needs!
`,
        size: 865,
        description: 'AI Development collection (2 posts)',
        category: 'topic',
        post_count: 2,
        topic: 'AI Development'
      },
      'developer-tools-post': {
        name: 'llms-building-better-developer-tools-2025.txt',
        content: `# Building Better Developer Tools in 2025
# Generated: ${new Date().toISOString()}
# Individual blog post LLMs.txt for AI discovery

## About This Post
Title: Building Better Developer Tools in 2025
URL: https://sidetool.co/blog/building-better-developer-tools-2025
Published: ${new Date().toISOString().split('T')[0]}
Reading Time: 8 min
Keywords: developer tools, software engineering, productivity, automation, AI

## Description
Explore the latest trends and best practices for creating developer tools that solve real problems.

## Key Topics
- developer tools
- software engineering  
- productivity
- automation
- AI

This post covers essential aspects of developer tools with practical insights for implementation.

Visit the full post: https://sidetool.co/blog/building-better-developer-tools-2025
`,
        size: 742,
        description: 'Individual post: Building Better Developer Tools in 2025',
        category: 'individual',
        url: 'https://sidetool.co/blog/building-better-developer-tools-2025'
      }
    }

    const generation_id = crypto.randomUUID()
    const generated_at = new Date().toISOString()

    // Call the email notification API
    const emailResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/send-email-notification`, {
      method: 'POST',  
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: sampleFiles,
        generation_id,
        generated_at,
        total_files: Object.keys(sampleFiles).length
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Email API failed: ${errorText}`)
    }

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      test_data: {
        generation_id,
        total_files: Object.keys(sampleFiles).length,
        files: Object.keys(sampleFiles)
      },
      email_result: emailResult
    })

  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 })
  }
}