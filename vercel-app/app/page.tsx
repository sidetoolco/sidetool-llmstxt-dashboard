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
  storageUrl?: string
}

interface DailyFiles {
  date: string
  generatedAt: string
  generationId: string
  source: string
  files: Record<string, any>
  totalSize?: number
  stats?: {
    totalFiles: number
    categories: Record<string, number>
  }
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
      console.log('Loaded data:', data)
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

  const downloadFile = (file: any) => {
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

  // Convert files object to array for display
  const filesArray = dailyFiles?.files 
    ? Object.entries(dailyFiles.files).map(([key, file]) => ({
        ...file,
        id: file.id || key,
        name: file.name || key
      }))
    : []

  // Calculate total size if not provided
  const totalSize = dailyFiles?.totalSize || filesArray.reduce((sum, file) => sum + (file.size || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Sidetool Logo */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Sidetool GSO</h1>
                  <p className="text-xs text-gray-500">Generated Semantic Objects</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://sidetool.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                sidetool.co →
              </a>
              <button
                onClick={triggerGeneration}
                disabled={generating}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  generating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {generating ? 'Generating...' : 'Generate Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Files:</span>
                <span className="ml-2 font-medium text-gray-900">{filesArray.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Size:</span>
                <span className="ml-2 font-medium text-gray-900">{(totalSize / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {dailyFiles ? new Date(dailyFiles.generatedAt || dailyFiles.date).toLocaleString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Source:</span>
                <span className="ml-2 font-medium text-gray-900">{dailyFiles?.source || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-blue-900 font-medium mb-1">About LLMs.txt Files</p>
              <p className="text-blue-700">
                These files help AI systems understand Sidetool's services and content. 
                Files are generated daily at 3 AM UTC and include blog posts, service descriptions, and technical capabilities.
                Place them at your website root (e.g., sidetool.co/llms.txt) for AI discovery.
              </p>
            </div>
          </div>
        </div>

        {/* Files List */}
        {filesArray.length > 0 ? (
          <div className="space-y-4">
            {/* Group files by category */}
            {['collection', 'topic', 'individual'].map(category => {
              const categoryFiles = filesArray.filter(file => file.category === category)
              if (categoryFiles.length === 0) return null

              return (
                <div key={category} className="space-y-3">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {category === 'collection' ? 'Main Collections' : 
                     category === 'topic' ? 'Topic Collections' : 
                     'Individual Files'}
                  </h2>
                  
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {categoryFiles.map(file => (
                      <div key={file.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                              {file.published && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Published
                                </span>
                              )}
                            </div>
                            {file.description && (
                              <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                            )}
                            
                            {/* Preview Toggle */}
                            {file.content && (
                              <button
                                onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <svg 
                                  className={`w-3 h-3 transform transition-transform ${expandedFile === file.id ? 'rotate-90' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {expandedFile === file.id ? 'Hide' : 'Show'} preview
                              </button>
                            )}
                            
                            {/* Content Preview */}
                            {expandedFile === file.id && file.content && (
                              <pre className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                                {file.content.substring(0, 500)}
                                {file.content.length > 500 && '\n\n... (truncated)'}
                              </pre>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            {file.storageUrl && (
                              <a
                                href={file.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-gray-600"
                                title="View in storage"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => copyToClipboard(file.content || '', file.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                                copiedFile === file.id
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {copiedFile === file.id ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                              onClick={() => downloadFile(file)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No files found</p>
            <p className="text-sm text-gray-500 mb-4">Generate files to see them here</p>
            <button
              onClick={triggerGeneration}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
            >
              Generate Files
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>Generated Semantic Objects (GSO) by Sidetool</p>
              <p className="text-xs mt-1">
                Automated daily at 3 AM UTC • 
                <a href="/api/debug-env" className="text-blue-600 hover:underline ml-1">Debug</a> • 
                <a href="https://github.com/sidetoolco" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">GitHub</a>
              </p>
            </div>
            <div className="text-right">
              <p>Need help?</p>
              <a href="mailto:hello@sidetool.co" className="text-blue-600 hover:underline">hello@sidetool.co</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}