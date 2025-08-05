import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend only when needed to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }
  return new Resend(apiKey)
}

interface FileData {
  name: string
  content: string
  size: number
  description: string
  category: string
  url?: string
  topic?: string
  post_count?: number
}

interface EmailNotificationRequest {
  files: Record<string, FileData>
  generation_id: string
  generated_at: string
  total_files: number
}

function generateEmailContent(files: Record<string, FileData>, generation_id: string, generated_at: string) {
  const fileEntries = Object.entries(files)
  const collectionFiles = fileEntries.filter(([_, file]) => file.category === 'collection')
  const topicFiles = fileEntries.filter(([_, file]) => file.category === 'topic')
  const individualFiles = fileEntries.filter(([_, file]) => file.category === 'individual')

  const totalSize = Object.values(files).reduce((sum, file) => sum + file.size, 0)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New LLMs.txt Files Generated</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 30px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0; }
    .stat-card { background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
    .stat-number { font-size: 32px; font-weight: 700; color: #1e40af; margin: 0; }
    .stat-label { color: #64748b; margin: 5px 0 0; font-size: 14px; }
    .section { margin: 30px 0; }
    .section h2 { color: #1e293b; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .file-grid { display: grid; gap: 15px; }
    .file-card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; transition: all 0.2s; }
    .file-card:hover { border-color: #3b82f6; background: #f8faff; }
    .file-title { font-weight: 600; color: #1e293b; margin-bottom: 8px; font-size: 16px; }
    .file-meta { display: flex; gap: 15px; font-size: 13px; color: #64748b; margin-bottom: 10px; }
    .file-description { color: #475569; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
    .file-content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #374151; max-height: 120px; overflow-y: auto; white-space: pre-wrap; }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.collection { background: #8b5cf6; }
    .badge.topic { background: #f59e0b; }
    .badge.individual { background: #10b981; }
    .footer { background: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 10px; transition: background 0.2s; }
    .cta-button:hover { background: #1e40af; }
    .cta-button.secondary { background: #64748b; }
    .cta-button.secondary:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 New LLMs.txt Files Generated</h1>
      <p>Fresh AI discovery files ready for deployment</p>
    </div>

    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">${fileEntries.length}</div>
          <div class="stat-label">Total Files</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${(totalSize / 1024).toFixed(1)}KB</div>
          <div class="stat-label">Total Size</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${collectionFiles.length}</div>
          <div class="stat-label">Collections</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${individualFiles.length}</div>
          <div class="stat-label">Individual Posts</div>
        </div>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="https://gso.sidetool.co" class="cta-button">View Dashboard</a>
        <a href="https://github.com/sidetoolco/sidetool-llmstxt-generator" class="cta-button secondary">View Repository</a>
      </div>

      ${collectionFiles.length > 0 ? `
      <div class="section">
        <h2>📚 Collection Files</h2>
        <div class="file-grid">
          ${collectionFiles.map(([key, file]) => `
            <div class="file-card">
              <div class="file-title">
                ${file.name}
                <span class="badge collection">${file.category}</span>
              </div>
              <div class="file-meta">
                <span>📄 ${(file.size / 1024).toFixed(1)}KB</span>
                <span>🕒 ${new Date(generated_at).toLocaleString()}</span>
              </div>
              <div class="file-description">${file.description}</div>
              <div class="file-content">${file.content.substring(0, 200)}...</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${topicFiles.length > 0 ? `
      <div class="section">
        <h2>🏷️ Topic Collections</h2>
        <div class="file-grid">
          ${topicFiles.map(([key, file]) => `
            <div class="file-card">
              <div class="file-title">
                ${file.name}
                <span class="badge topic">${file.category}</span>
              </div>
              <div class="file-meta">
                <span>📄 ${(file.size / 1024).toFixed(1)}KB</span>
                ${file.post_count ? `<span>📝 ${file.post_count} posts</span>` : ''}
                <span>🕒 ${new Date(generated_at).toLocaleString()}</span>
              </div>
              <div class="file-description">${file.description}</div>
              <div class="file-content">${file.content.substring(0, 200)}...</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${individualFiles.length > 0 ? `
      <div class="section">
        <h2>📄 Individual Post Files</h2>
        <div class="file-grid">
          ${individualFiles.slice(0, 3).map(([key, file]) => `
            <div class="file-card">
              <div class="file-title">
                ${file.name}
                <span class="badge individual">${file.category}</span>
              </div>
              <div class="file-meta">
                <span>📄 ${(file.size / 1024).toFixed(1)}KB</span>
                ${file.url ? `<span>🔗 <a href="${file.url}" style="color: #3b82f6;">View Post</a></span>` : ''}
                <span>🕒 ${new Date(generated_at).toLocaleString()}</span>
              </div>
              <div class="file-description">${file.description}</div>
              <div class="file-content">${file.content.substring(0, 200)}...</div>
            </div>
          `).join('')}
          ${individualFiles.length > 3 ? `
            <div style="text-align: center; padding: 20px; color: #64748b;">
              ... and ${individualFiles.length - 3} more individual files
            </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2>🚀 Next Steps</h2>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0c4a6e;">Ready to Deploy</h3>
          <p style="margin-bottom: 15px; color: #075985;">These files are optimized for AI discovery and ready to be uploaded to your website:</p>
          <ul style="color: #075985; margin: 0;">
            <li><strong>Main file:</strong> Upload <code>llms.txt</code> to your website root (sidetool.co/llms.txt)</li>
            <li><strong>Full content:</strong> Upload <code>llms-full.txt</code> for comprehensive AI understanding</li>
            <li><strong>Topic collections:</strong> Upload topic-specific files for targeted discovery</li>
            <li><strong>Individual posts:</strong> Upload individual files for per-post optimization</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Generation ID:</strong> ${generation_id}</p>
      <p><strong>Generated:</strong> ${new Date(generated_at).toLocaleString()}</p>
      <p>This email was sent automatically by the Sidetool LLMs.txt Generator system.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function POST(request: Request) {
  try {
    const { files, generation_id, generated_at, total_files }: EmailNotificationRequest = await request.json()

    const resend = getResendClient()
    const emailContent = generateEmailContent(files, generation_id, generated_at)
    
    const { data, error } = await resend.emails.send({
      from: 'LLMs.txt Generator <onboarding@resend.dev>',
      to: ['ed@sidetool.co'],
      subject: `🚀 New LLMs.txt Files Generated - ${total_files} files ready`,
      html: emailContent,
    })

    if (error) {
      console.error('Email send error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: error
      }, { status: 500 })
    }

    console.log('✅ Email notification sent successfully:', data?.id)

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
      email_id: data?.id,
      sent_to: 'ed@sidetool.co',
      total_files
    })

  } catch (error: any) {
    console.error('Email notification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send email notification',
      details: error.message
    }, { status: 500 })
  }
}