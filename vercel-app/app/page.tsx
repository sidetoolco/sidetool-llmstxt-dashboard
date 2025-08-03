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
      
      // Check if error is due to no files (404) vs connection error (500)
      if (error instanceof Error && error.message.includes('No completed generations found')) {
        // Supabase is connected but no files exist yet
        setDailyFiles({
          date: new Date().toISOString().split('T')[0],
          source: 'supabase-empty',
          stats: {
            totalFiles: 0,
            totalPosts: 0,
            newPostsToday: 0,
            totalKeywords: 0
          },
          files: {},
          message: 'No files generated yet. Click "Generate Now" to create your first LLMs.txt files!'
        })
        return
      }
      
      // Fallback to original API for connection errors
      try {
        console.log('Falling back to local files API')
        const fallbackResponse = await fetch('/api/files')
        const fallbackData = await fallbackResponse.json()
        
        if (fallbackData.error) {
          throw new Error(fallbackData.error)
        }
        
        setDailyFiles(fallbackData)
      } catch (fallbackError) {
        console.error('Error loading fallback files:', fallbackError)
        
        // Final fallback to demo mode
        setDailyFiles({
          date: new Date().toISOString().split('T')[0],
          source: 'demo-mode',
          stats: {
            totalFiles: 0,
            totalPosts: 0,
            newPostsToday: 0,
            totalKeywords: 0
          },
          files: {},
          message: 'Demo mode: Configure environment variables to enable full functionality'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    const files = dailyFiles?.files || {}
    Object.entries(files).forEach(([_, file]: [string, any]) => {
      downloadFile(file.name, file.content)
    })
  }

  const copyToClipboard = async (content: string, fileKey: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopying(fileKey)
      setTimeout(() => setCopying(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard. Please try again.')
    }
  }

  const triggerGeneration = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/trigger-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trigger: 'manual' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Reload files after successful generation
        setTimeout(() => {
          loadDailyFiles()
        }, 2000) // Give it a moment to complete
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

  // Define variables before loading check (CRITICAL FIX)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 h-16 w-16 border-4 border-transparent border-t-blue-300 rounded-full mx-auto animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your latest LLMs.txt files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <header className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-blue-700 bg-clip-text text-transparent mb-4">
              LLMs.txt Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create optimized AI discovery files for individual posts and curated collections
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Last updated: {dailyFiles?.date || new Date().toLocaleDateString()}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{dailyFiles?.stats?.totalFiles || 0} files available</span>
            </div>
          </div>
          {dailyFiles?.source && (
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>
                  {dailyFiles.source === 'supabase-cron' ? 'Database + Automated' : 
                   dailyFiles.source === 'supabase-empty' ? 'Database Ready' :
                   dailyFiles.source === 'cron-job' ? 'Automated Generation' : 
                   dailyFiles.source === 'on-demand' ? 'On-Demand Generation' : 
                   dailyFiles.source === 'fallback-local' ? 'Local Fallback' :
                   dailyFiles.source === 'fallback-original' ? 'API Fallback' :
                   dailyFiles.source === 'demo-mode' ? 'Demo Mode' :
                   dailyFiles.source === 'demo-offline' ? 'Offline Demo' :
                   'Fallback Mode'}
                </span>
              </div>
              
              {(dailyFiles.source === 'demo-mode' || dailyFiles.source === 'demo-offline') && (
                <div className="mt-4 max-w-lg mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                        Configuration Required
                      </h3>
                      <p className="text-xs text-yellow-700 leading-relaxed">
                        Add environment variables in Vercel to enable full functionality:
                        <code className="ml-1 px-1 py-0.5 bg-yellow-100 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and 
                        <code className="ml-1 px-1 py-0.5 bg-yellow-100 rounded text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {dailyFiles.source === 'supabase-empty' && (
                <div className="mt-4 max-w-lg mx-auto p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800 mb-1">
                        Database Connected
                      </h3>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        {dailyFiles.message || 'Ready to generate your first LLMs.txt files. Click "Generate Now" to begin!'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Enhanced Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10" role="region" aria-label="Dashboard Statistics">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dailyFiles?.stats?.totalFiles || 0}</div>
            <div className="text-sm font-medium text-gray-600">Total Files</div>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dailyFiles?.stats?.totalPosts || 0}</div>
            <div className="text-sm font-medium text-gray-600">Blog Posts</div>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dailyFiles?.stats?.newPostsToday || 0}</div>
            <div className="text-sm font-medium text-gray-600">New Today</div>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dailyFiles?.stats?.totalKeywords || 0}</div>
            <div className="text-sm font-medium text-gray-600">Keywords</div>
          </div>
        </section>

        {/* Enhanced Filters & Actions */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 border border-gray-100" role="region" aria-label="File Filters and Actions">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            {/* Category Filters */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filter by Type</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                    aria-pressed={selectedCategory === category.id}
                  >
                    <span className="relative z-10">
                      {category.name}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={triggerGeneration}
                disabled={generating || (dailyFiles?.source === 'demo-mode' || dailyFiles?.source === 'demo-offline')}
                className={`group relative px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
                  generating || (dailyFiles?.source === 'demo-mode' || dailyFiles?.source === 'demo-offline')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
                aria-label={generating ? 'Generation in progress' : 'Generate new files'}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (dailyFiles?.source === 'demo-mode' || dailyFiles?.source === 'demo-offline') ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Setup Required</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Generate Now</span>
                  </>
                )}
              </button>
              
              <button
                onClick={downloadAll}
                disabled={fileEntries.length === 0}
                className="group relative px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                aria-label={`Download all ${fileEntries.length} files`}
              >
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download All ({fileEntries.length})</span>
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredFiles.length}</span> of <span className="font-semibold text-gray-900">{fileEntries.length}</span> files
            </p>
            {filteredFiles.length !== fileEntries.length && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Enhanced Files Grid */}
        <main className="space-y-6" role="main" aria-label="Generated Files">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files match your filters</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or generate new files.</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Files will appear here</h3>
              <p className="text-gray-600 mb-6">Click "Generate Now" to create your LLMs.txt files.</p>
            </div>
          )}
        </main>

        {/* Enhanced Footer */}
        <footer className="text-center mt-16 py-8 border-t border-gray-200" role="contentinfo">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Auto-updates daily at 3:00 AM UTC</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <button 
              onClick={loadDailyFiles}
              className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              aria-label="Refresh files now"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh now</span>
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Powered by AI-driven content analysis to create optimized LLMs.txt files for ChatGPT, Claude, Perplexity, and other AI systems.
              Built with modern web technologies and accessibility standards.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}