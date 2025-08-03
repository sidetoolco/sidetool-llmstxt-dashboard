'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [dailyFile, setDailyFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    loadDailyFile()
  }, [])

  const loadDailyFile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-recommendation')
      const data = await response.json()
      setDailyFile(data)
    } catch (error) {
      console.error('Error loading daily file:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (content: string) => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(content)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's LLMs.txt file...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📄 Daily LLMs.txt
          </h1>
          <p className="text-lg text-gray-600">
            Today's AI-optimized content file for sidetool.co
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generated: {dailyFile?.date || new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Main File Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                llms.txt
              </h2>
              <p className="text-gray-600 mb-4">
                Your daily LLMs.txt file ready to upload to sidetool.co
              </p>
              
              {/* Stats */}
              <div className="flex gap-6 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Blog Posts:</span> {dailyFile?.stats?.totalPosts || 0}
                </div>
                <div>
                  <span className="font-medium">New Today:</span> {dailyFile?.stats?.newPostsToday || 0}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {dailyFile?.files?.llmsTxt?.size ? `${(dailyFile.files.llmsTxt.size / 1024).toFixed(1)} KB` : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => downloadFile('llms.txt', dailyFile?.files?.llmsTxt?.content || '')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              
              <button
                onClick={() => copyToClipboard(dailyFile?.files?.llmsTxt?.content || '')}
                className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                  copying 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copying ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">File Preview:</h3>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {dailyFile?.files?.llmsTxt?.content?.substring(0, 800) || 'Loading content...'}
              {dailyFile?.files?.llmsTxt?.content?.length > 800 && '...\n\n[Download full file to see complete content]'}
            </pre>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>🚀</span>
            How to Use This File
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Download" to get the llms.txt file</li>
            <li>Upload it to your website's root directory (/public folder)</li>
            <li>Make sure it's accessible at: <code className="bg-blue-100 px-2 py-1 rounded">https://www.sidetool.co/llms.txt</code></li>
            <li>AI systems like ChatGPT will now discover your content!</li>
          </ol>
        </div>

        {/* Recent Blog Posts */}
        {dailyFile?.blogPosts && dailyFile.blogPosts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Blog Posts Included ({dailyFile.blogPosts.length})
            </h3>
            <div className="grid gap-3 max-h-80 overflow-y-auto">
              {dailyFile.blogPosts.slice(0, 10).map((post: any, index: number) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{post.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{post.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">📅 {post.date}</span>
                      <span className="text-xs text-gray-500">⏱ {post.readTime}</span>
                    </div>
                  </div>
                  {post.date === new Date().toISOString().split('T')[0] && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium ml-3">
                      NEW
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>File updates daily at 3 AM UTC</p>
          <p className="mt-1">
            <button 
              onClick={loadDailyFile}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Refresh now
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}