'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { FileCard } from '@/components/FileCard'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { StatsCard, StatsCardSkeleton } from '@/components/StatsCard'
import { DashboardSkeleton } from '@/components/LoadingSkeleton'
import { useToast, ToastContainer } from '@/components/ui/Toast'

export interface FileWithStatus {
  id: string
  name: string
  size: number
  content?: string
  category: string
  description?: string
  generated_at?: string
  published_at?: string | null
  published_url?: string | null
  public_url?: string | null
  notes?: string | null
}

interface DailyFiles {
  date: string
  files: FileWithStatus[]
  totalSize: number
  source?: string
}

export default function ImprovedDashboard() {
  const [dailyFiles, setDailyFiles] = useState<DailyFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishingFile, setPublishingFile] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [envStatus, setEnvStatus] = useState<any>(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Use toast notifications
  const { toasts, showToast, removeToast } = useToast()

  // Load environment status
  useEffect(() => {
    fetch('/api/debug-env')
      .then(res => res.json())
      .then(data => setEnvStatus(data))
      .catch(() => {})
  }, [])

  // Load daily files
  const loadDailyFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supabase-files')
      
      if (!response.ok) {
        throw new Error('Failed to load files')
      }
      
      const data = await response.json()
      setDailyFiles(data)
      
      if (data.source === 'demo-mode' || data.source === 'demo-offline') {
        showToast('info', 'Running in demo mode. Some features may be limited.')
      }
    } catch (error: any) {
      console.error('Error loading files:', error)
      showToast('error', 'Failed to load files. Please try again.')
      
      // Load fallback data
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
  }, [showToast])

  useEffect(() => {
    loadDailyFiles()
  }, [loadDailyFiles])

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', `${label} copied to clipboard!`)
    } catch (err) {
      showToast('error', 'Failed to copy to clipboard')
    }
  }

  // Trigger generation
  const triggerGeneration = async () => {
    setGenerating(true)
    
    try {
      const response = await fetch('/api/generate-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trigger: 'manual' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        showToast('success', 'Files generated successfully!')
        setTimeout(() => {
          loadDailyFiles()
        }, 2000)
      } else {
        showToast('error', result.error || 'Generation failed')
        console.error('Generation failed:', result)
      }
    } catch (error: any) {
      console.error('Error triggering generation:', error)
      showToast('error', 'Failed to trigger generation')
    } finally {
      setGenerating(false)
    }
  }

  // Toggle publish status
  const togglePublishStatus = async (fileId: string, currentStatus: boolean, fileName: string) => {
    setPublishingFile(fileId)
    
    try {
      // Show optimistic update
      showToast('info', currentStatus ? 'Unpublishing file...' : 'Publishing file...')
      
      const response = await fetch('/api/publish-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          action: currentStatus ? 'unpublish' : 'publish',
          customUrl: currentStatus ? null : fileName.replace('.txt', ''),
          notes: currentStatus ? null : 'Published via dashboard'
        })
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', currentStatus 
          ? `${fileName} unpublished successfully`
          : `${fileName} published successfully!`
        )
        await loadDailyFiles()
      } else {
        showToast('error', result.error || 'Operation failed')
      }
    } catch (error: any) {
      console.error('Error toggling publish status:', error)
      showToast('error', 'Failed to update publish status')
    } finally {
      setPublishingFile(null)
    }
  }

  // Download all files
  const downloadAllFiles = async () => {
    if (!dailyFiles?.files.length) return

    showToast('info', 'Preparing download...')

    try {
      const zip = (await import('jszip')).default
      const zipFile = new zip()

      dailyFiles.files.forEach(file => {
        if (file.content) {
          zipFile.file(file.name, file.content)
        }
      })

      const blob = await zipFile.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `llms-files-${dailyFiles.date}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast('success', 'Files downloaded successfully!')
    } catch (error) {
      console.error('Error downloading files:', error)
      showToast('error', 'Failed to download files')
    }
  }

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    if (!dailyFiles?.files) return []

    let filtered = dailyFiles.files

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'date':
          compareValue = new Date(b.generated_at || 0).getTime() - new Date(a.generated_at || 0).getTime()
          break
        case 'size':
          compareValue = b.size - a.size
          break
        case 'category':
          compareValue = a.category.localeCompare(b.category)
          break
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return sorted
  }, [dailyFiles?.files, searchQuery, selectedCategory, sortBy, sortOrder])

  // Get category counts
  const categories = useMemo(() => {
    if (!dailyFiles?.files) return []

    const counts = dailyFiles.files.reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { value: 'all', label: 'All Files', count: dailyFiles.files.length },
      ...Object.entries(counts).map(([category, count]) => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        count
      }))
    ]
  }, [dailyFiles?.files])

  // Calculate stats
  const stats = useMemo(() => {
    if (!dailyFiles) return null

    const publishedCount = dailyFiles.files.filter(f => f.published_at).length
    const totalSize = dailyFiles.totalSize / 1024 // Convert to KB

    return {
      totalFiles: dailyFiles.files.length,
      publishedFiles: publishedCount,
      totalSize: totalSize.toFixed(1) + ' KB',
      lastGenerated: dailyFiles.date
    }
  }, [dailyFiles])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LLMs.txt Generator</h1>
                <p className="text-sm text-gray-600">AI-optimized content for Sidetool</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {envStatus && !envStatus.allConfigured && (
                <Link
                  href="/api/debug-env"
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Check Config
                </Link>
              )}
              
              <button
                onClick={triggerGeneration}
                disabled={generating || dailyFiles?.source === 'demo-mode'}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  generating || dailyFiles?.source === 'demo-mode'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg'
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Files"
              value={stats.totalFiles}
              description="Available for AI systems"
              color="blue"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            
            <StatsCard
              title="Published Files"
              value={stats.publishedFiles}
              description="Publicly accessible"
              color="green"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
              trend={stats.publishedFiles > 0 ? { value: 'Active', isPositive: true } : undefined}
            />
            
            <StatsCard
              title="Total Size"
              value={stats.totalSize}
              description="Optimized content"
              color="purple"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              }
            />
            
            <StatsCard
              title="Last Generated"
              value={new Date(stats.lastGenerated).toLocaleDateString()}
              description={new Date(stats.lastGenerated).toLocaleTimeString()}
              color="orange"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Search and Filter */}
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          categories={categories}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedFiles.length} of {dailyFiles?.files.length || 0} files
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
          
          {dailyFiles && dailyFiles.files.length > 0 && (
            <button
              onClick={downloadAllFiles}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download All
            </button>
          )}
        </div>

        {/* Files Grid */}
        {filteredAndSortedFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onTogglePublish={togglePublishStatus}
                onCopyToClipboard={copyToClipboard}
                isPublishing={publishingFile === file.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium mb-2">No files found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'Try adjusting your search criteria' : 'Click "Generate Now" to create files'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}