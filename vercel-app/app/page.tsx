'use client'

import { useEffect, useState, useCallback } from 'react'

interface FileWithStatus {
  id: string
  name: string
  size: number
  content?: string
  category: string
  description?: string
  generated_at?: string
  published_at?: string | null
  published_url?: string | null
}

interface DailyFiles {
  date: string
  files: FileWithStatus[]
  totalSize: number
  source?: string
}

export default function Dashboard() {
  const [dailyFiles, setDailyFiles] = useState<DailyFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const loadDailyFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supabase-files')
      
      if (!response.ok) {
        throw new Error('Failed to load files')
      }
      
      const data = await response.json()
      setDailyFiles(data)
    } catch (error: any) {
      console.error('Error loading files:', error)
      
      // Try fallback
      try {
        const fallbackResponse = await fetch('/api/files')
        const fallbackData = await fallbackResponse.json()
        setDailyFiles(fallbackData)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDailyFiles()
  }, [loadDailyFiles])

  const copyToClipboard = async (content: string, fileId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(fileId)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadFile = (file: FileWithStatus) => {
    if (!file.content) return
    
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const triggerGeneration = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' })
      })
      
      const result = await response.json()
      if (result.success) {
        setTimeout(() => loadDailyFiles(), 2000)
      }
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      collection: 'bg-purple-100 text-purple-800 border-purple-200',
      topic: 'bg-blue-100 text-blue-800 border-blue-200',
      individual: 'bg-green-100 text-green-800 border-green-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category] || colors.default
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'collection':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'topic':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LLMs.txt Dashboard</h1>
                <p className="text-sm text-gray-600">AI-optimized content files for Sidetool</p>
              </div>
            </div>
            
            <button
              onClick={triggerGeneration}
              disabled={generating}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                generating
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Generate Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {dailyFiles && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{dailyFiles.files.length}</p>
              <p className="text-sm text-gray-600 mt-1">Files Generated</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Size</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(dailyFiles.totalSize / 1024).toFixed(1)}</p>
              <p className="text-sm text-gray-600 mt-1">Total KB</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Latest</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{new Date(dailyFiles.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 mt-1">{new Date(dailyFiles.date).toLocaleTimeString()}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Status</span>
              </div>
              <p className="text-lg font-bold text-gray-900 text-green-600">Ready</p>
              <p className="text-sm text-gray-600 mt-1">All files available</p>
            </div>
          </div>
        )}

        {/* Files Grid */}
        {dailyFiles && dailyFiles.files.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {dailyFiles.files.map(file => (
              <div
                key={file.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-gray-200"
              >
                {/* File Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        {getCategoryIcon(file.category)}
                        {file.name}
                      </h3>
                      {file.description && (
                        <p className="text-sm text-gray-600 leading-relaxed">{file.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(file.category)}`}>
                      {file.category}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    {file.published_at && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Published
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                {file.content && (
                  <div className="bg-gray-50 p-4">
                    <button
                      onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                      className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between"
                    >
                      <span>Preview Content</span>
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${expandedFile === file.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFile === file.id && (
                      <pre className="mt-3 text-xs text-gray-600 font-mono bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto">
                        {file.content.substring(0, 1000)}
                        {file.content.length > 1000 && '\n\n... (truncated)'}
                      </pre>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => copyToClipboard(file.content || '', file.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      copiedFile === file.id
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {copiedFile === file.id ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Content</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => downloadFile(file)}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xl text-gray-600 font-medium mb-2">No files generated yet</p>
            <p className="text-gray-500 mb-6">Click the "Generate Now" button to create your LLMs.txt files</p>
            <button
              onClick={triggerGeneration}
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Generate Your First Files
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Files are generated daily at 3 AM UTC • 
            <a href="/api/debug-env" className="text-blue-600 hover:underline ml-1">Check Environment</a>
          </p>
        </div>
      </main>
    </div>
  )
}