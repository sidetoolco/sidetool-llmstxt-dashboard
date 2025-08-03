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
      if (error.message && error.message.includes('No completed generations found')) {
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
        const finalResponse = await fetch('/api/daily-recommendation')
        const finalData = await finalResponse.json()
        setDailyFiles({ ...finalData, source: 'demo-mode' })
      } catch (finalError) {
        console.error('All APIs failed:', finalError)
        // Last resort: show demo data
        setDailyFiles({
          date: new Date().toISOString().split('T')[0],
          source: 'demo-offline',
          stats: {
            totalFiles: 3,
            totalPosts: 5,
            newPostsToday: 1,
            totalKeywords: 15
          },
          files: {
            'llms': {
              name: 'llms.txt',
              content: '# Demo LLMs.txt File\n\nThis is a demo file showing the dashboard functionality.\nTo see real files, please configure Supabase environment variables in Vercel.',
              size: 150,
              description: 'Demo main collection file',
              category: 'collection',
              published: false
            }
          }
        })
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 h-16 w-16 border-4 border-transparent border-t-blue-300 rounded-full mx-auto animate-spin" style={{animationDelay: '0.5s', animationDuration: '2s'}}></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your latest LLMs.txt files...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30 px-4 py-8">
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
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            filteredFiles.map(([fileKey, file]: [string, any]) => (
              <article 
                key={fileKey} 
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                role="article"
                aria-labelledby={`file-title-${fileKey}`}
              >
                <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    {/* File Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 id={`file-title-${fileKey}`} className="text-xl font-bold text-gray-900 truncate">
                          {file.name}
                        </h3>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          file.category === 'collection' ? 'bg-blue-100 text-blue-800' :
                          file.category === 'individual' ? 'bg-green-100 text-green-800' :
                          file.category === 'topic' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {file.category === 'collection' ? 'Collection' :
                           file.category === 'individual' ? 'Individual' :
                           file.category === 'topic' ? 'Topic' :
                           file.category}
                        </span>
                        
                        {file.published ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="ml-1.5">Draft</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed mb-4 text-base">
                      {file.description}
                    </p>
                    
                    {/* File Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10l-3-3h6l-3 3m0-10L18 10l-3 3" />
                        </svg>
                        <span className="text-gray-700">
                          <span className="font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                        </span>
                      </div>
                      
                      {file.postCount && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-medium">{file.postCount}</span> posts
                          </span>
                        </div>
                      )}
                      
                      {file.blogPost && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700">
                            Created <span className="font-medium">{file.blogPost.date}</span>
                          </span>
                        </div>
                      )}
                      
                      {file.publishedAt && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-700">
                            Published <span className="font-medium">{new Date(file.publishedAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => downloadFile(file.name, file.content)}
                      className="group px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 hover:scale-105 shadow-md hover:shadow-lg"
                      aria-label={`Download ${file.name}`}
                    >
                      <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(file.content, fileKey)}
                      className={`group px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 hover:scale-105 shadow-md hover:shadow-lg ${
                        copying === fileKey
                          ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                      }`}
                      aria-label={copying === fileKey ? 'Content copied' : `Copy ${file.name} content`}
                    >
                      {copying === fileKey ? (
                        <>
                          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {file.id && (
                      <button
                        onClick={() => togglePublishStatus(file.id, file.published, file.name)}
                        disabled={publishingFile === file.id}
                        className={`group px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 hover:scale-105 shadow-md hover:shadow-lg border-2 ${
                          publishingFile === file.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                            : file.published
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                        }`}
                        aria-label={publishingFile === file.id ? 'Updating publish status' : file.published ? `Unpublish ${file.name}` : `Publish ${file.name}`}
                      >
                        {publishingFile === file.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Updating...</span>
                          </>
                        ) : file.published ? (
                          <>
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                            <span>Unpublish</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </header>
              </div>

                {/* Published URL Info */}
                {file.publishedUrl && (
                  <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 13l3 3 7-7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">Published Location</h4>
                        <a 
                          href={file.publishedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium break-all"
                        >
                          <span className="truncate">{file.publishedUrl}</span>
                          <svg className="flex-shrink-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 13l3 3 7-7" />
                          </svg>
                        </a>
                        {file.publishNotes && (
                          <p className="mt-2 text-sm text-green-700">
                            <span className="font-medium">Notes:</span> {file.publishNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced File Preview */}
                <details className="group">
                  <summary className="cursor-pointer flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center group-open:bg-blue-100 transition-colors duration-200">
                        <svg className="w-4 h-4 text-gray-600 group-open:text-blue-600 transition-all duration-200 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">Preview Content</span>
                    </div>
                    <span className="text-xs text-gray-500 group-open:text-blue-600 transition-colors duration-200">
                      Click to {file.content.length > 600 ? 'expand' : 'view'}
                    </span>
                  </summary>
                  
                  <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{file.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {file.content.length > 600 ? `${(file.content.length / 1024).toFixed(1)}KB (truncated)` : `${file.content.length} chars`}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
{file.content.substring(0, 600)}{file.content.length > 600 && '\n\n[Download complete file to see full content]'}
                    </pre>
                  </div>
                </details>
              </article>
            ))
          )}
        </main>

        {/* Enhanced Instructions */}
        <section className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-8 mt-12 border border-blue-200" role="region" aria-label="Usage Instructions">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">
                How to Use Your LLMs.txt Files
              </h3>
              <p className="text-blue-700 text-lg">
                Optimize AI discovery by strategically placing these files on your website
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-blue-900 mb-2">Collection Files</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                Upload main collection files to your website root for comprehensive AI discovery across all your content.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-blue-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-blue-900 mb-2">Individual Posts</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                Create focused AI training by uploading specific post files for detailed topic understanding.
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-blue-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-blue-900 mb-2">Topic Collections</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                Help AI systems understand your expertise by organizing content into specialized topic areas.
              </p>
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-2">Quick Start Guide</h4>
                <div className="space-y-2 text-sm">
                  <p>1. Upload main <code className="bg-white/20 px-2 py-1 rounded font-mono">llms.txt</code> to <code className="bg-white/20 px-2 py-1 rounded font-mono">https://yourdomain.com/llms.txt</code></p>
                  <p>2. Place individual files in <code className="bg-white/20 px-2 py-1 rounded font-mono">/llms/[filename].txt</code> subdirectory</p>
                  <p>3. Update and republish regularly to keep AI systems informed about your latest content</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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