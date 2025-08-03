'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [dailyFiles, setDailyFiles] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadDailyFiles()
  }, [])

  const loadDailyFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-recommendation')
      const data = await response.json()
      setDailyFiles(data)
    } catch (error) {
      console.error('Error loading daily files:', error)
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      file.category === 'collection' ? 'bg-blue-100 text-blue-700' :
                      file.category === 'individual' ? 'bg-green-100 text-green-700' :
                      file.category === 'topic' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {file.category}
                    </span>
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
                </div>
              </div>

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