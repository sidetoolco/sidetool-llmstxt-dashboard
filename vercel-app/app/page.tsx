'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [dailyFiles, setDailyFiles] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [generating, setGenerating] = useState(false)
  const [publishingFile, setPublishingFile] = useState<string | null>(null)

  useEffect(() => {
    loadDailyFiles()
  }, [])

  const loadDailyFiles = async () => {
    setLoading(true)
    try {
      // Try Supabase API first (database-backed with cron generation)
      const response = await fetch('/api/supabase-files')
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setDailyFiles(data)
    } catch (error) {
      console.error('Error loading Supabase files:', error)
      // Fallback to local file generation
      try {
        const fallbackResponse = await fetch('/api/files')
        const fallbackData = await fallbackResponse.json()
        setDailyFiles({ ...fallbackData, source: 'fallback-local' })
      } catch (fallbackError) {
        console.error('Error loading fallback files:', fallbackError)
        // Final fallback to original API
        try {
          const finalResponse = await fetch('/api/daily-recommendation')
          const finalData = await finalResponse.json()
          setDailyFiles({ ...finalData, source: 'fallback-original' })
        } catch (finalError) {
          console.error('All APIs failed:', finalError)
        }
      }
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

  const copyToClipboard = async (content: string, fileKey: string) => {
    setCopying(fileKey)
    try {
      await navigator.clipboard.writeText(content)
      setTimeout(() => setCopying(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopying(null)
    }
  }

  const downloadAll = () => {
    if (!dailyFiles?.files) return
    
    Object.entries(dailyFiles.files).forEach(([key, file]: [string, any]) => {
      setTimeout(() => {
        downloadFile(file.name, file.content)
      }, Object.keys(dailyFiles.files).indexOf(key) * 200) // Stagger downloads
    })
  }

  const triggerGeneration = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/trigger-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Wait a moment then reload files
        setTimeout(() => {
          loadDailyFiles()
        }, 3000)
      } else {
        console.error('Generation failed:', result.error)
        alert('Generation failed: ' + result.error)
      }
    } catch (error) {
      console.error('Error triggering generation:', error)
      alert('Error triggering generation. Check console for details.')
    } finally {
      setGenerating(false)
    }
  }

  const togglePublishStatus = async (fileId: string, currentStatus: boolean, fileName: string) => {
    setPublishingFile(fileId)
    try {
      let publishedUrl = null
      let notes = null
      
      if (!currentStatus) {
        // Ask for URL when publishing
        publishedUrl = prompt(`Enter the URL where ${fileName} is published (optional):`)
        notes = prompt('Add any notes about this publication (optional):')
      }

      const response = await fetch('/api/publish-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          published: !currentStatus,
          publishedUrl,
          notes
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Reload files to show updated status
        loadDailyFiles()
      } else {
        console.error('Publish status update failed:', result.error)
        alert('Failed to update publish status: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating publish status:', error)
      alert('Error updating publish status. Check console for details.')
    } finally {
      setPublishingFile(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's LLMs.txt files...</p>
        </div>
      </div>
    )
  }

  const files = dailyFiles?.files || {}
  const fileEntries = Object.entries(files)
  
  // Filter files by category
  const filteredFiles = selectedCategory === 'all' 
    ? fileEntries 
    : fileEntries.filter(([, file]: [string, any]) => file.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'All Files', count: fileEntries.length },
    { id: 'collection', name: 'Collections', count: fileEntries.filter(([, f]: [string, any]) => f.category === 'collection').length },
    { id: 'individual', name: 'Individual Posts', count: fileEntries.filter(([, f]: [string, any]) => f.category === 'individual').length },
    { id: 'topic', name: 'Topic Collections', count: fileEntries.filter(([, f]: [string, any]) => f.category === 'topic').length }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📄 LLMs.txt File Generator
          </h1>
          <p className="text-lg text-gray-600">
            Individual and collection files for optimal AI discovery
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generated: {dailyFiles?.date || new Date().toLocaleDateString()} • {dailyFiles?.stats?.totalFiles || 0} files ready
          </p>
          {dailyFiles?.source && (
            <p className="text-xs text-gray-400 mt-1">
              Source: {dailyFiles.source === 'supabase-cron' ? '🗄️ Supabase + Daily Cron' : 
                       dailyFiles.source === 'cron-job' ? '🤖 Daily automation' : 
                       dailyFiles.source === 'on-demand' ? '⚡ Generated on-demand' : 
                       dailyFiles.source === 'fallback-local' ? '💾 Local fallback' :
                       dailyFiles.source === 'fallback-original' ? '🔄 Original API' :
                       '🔄 Fallback generation'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{dailyFiles?.stats?.totalFiles || 0}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{dailyFiles?.stats?.totalPosts || 0}</div>
            <div className="text-sm text-gray-600">Blog Posts</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{dailyFiles?.stats?.newPostsToday || 0}</div>
            <div className="text-sm text-gray-600">New Today</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{dailyFiles?.stats?.totalKeywords || 0}</div>
            <div className="text-sm text-gray-600">Keywords</div>
          </div>
        </div>

        {/* Category Filters & Bulk Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={triggerGeneration}
                disabled={generating}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  generating 
                    ? 'bg-blue-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {generating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Now
                  </>
                )}
              </button>
              
              <button
                onClick={downloadAll}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download All ({fileEntries.length})
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Showing {filteredFiles.length} of {fileEntries.length} files
          </p>
        </div>

        {/* Files Grid */}
        <div className="grid gap-4">
          {filteredFiles.map(([fileKey, file]: [string, any]) => (
            <div key={fileKey} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        file.category === 'collection' ? 'bg-blue-100 text-blue-700' :
                        file.category === 'individual' ? 'bg-green-100 text-green-700' :
                        file.category === 'topic' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {file.category}
                      </span>
                      {file.published ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{file.description}</p>
                  
                  <div className="flex gap-6 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(1)} KB
                    </div>
                    {file.postCount && (
                      <div>
                        <span className="font-medium">Posts:</span> {file.postCount}
                      </div>
                    )}
                    {file.blogPost && (
                      <div>
                        <span className="font-medium">Published:</span> {file.blogPost.date}
                      </div>
                    )}
                    {file.publishedAt && (
                      <div>
                        <span className="font-medium">Published to web:</span> {new Date(file.publishedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => downloadFile(file.name, file.content)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(file.content, fileKey)}
                    className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                      copying === fileKey
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {copying === fileKey ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>

                  {file.id && (
                    <button
                      onClick={() => togglePublishStatus(file.id, file.published, file.name)}
                      disabled={publishingFile === file.id}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                        publishingFile === file.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : file.published
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {publishingFile === file.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                          Updating...
                        </>
                      ) : file.published ? (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                          Unpublish
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Publish
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Published URL Info */}
              {file.publishedUrl && (
                <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 13l3 3 7-7" />
                    </svg>
                    <span className="font-medium text-emerald-800">Published at:</span>
                    <a 
                      href={file.publishedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 underline"
                    >
                      {file.publishedUrl}
                    </a>
                  </div>
                  {file.publishNotes && (
                    <div className="mt-1 text-sm text-emerald-700">
                      <span className="font-medium">Notes:</span> {file.publishNotes}
                    </div>
                  )}
                </div>
              )}

              {/* File Preview */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                  <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Preview Content
                </summary>
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {file.content.substring(0, 600)}
                    {file.content.length > 600 && '...\n\n[Download full file to see complete content]'}
                  </pre>
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>🚀</span>
            How to Use These Files
          </h3>
          <div className="space-y-3 text-blue-800">
            <div>
              <strong>Main Collection Files:</strong> Upload llms.txt to your website root for overall AI discovery
            </div>
            <div>
              <strong>Individual Post Files:</strong> Upload specific post files to create focused AI training on individual topics
            </div>
            <div>
              <strong>Topic Collections:</strong> Use these for AI systems to understand your expertise in specific areas
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <strong>Pro Tip:</strong> Upload the main llms.txt to <code>https://www.sidetool.co/llms.txt</code> and individual files to subfolders like <code>https://www.sidetool.co/llms/[filename].txt</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Files update daily at 3 AM UTC</p>
          <p className="mt-1">
            <button 
              onClick={loadDailyFiles}
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