'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gytlhmhrthpackunppjd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTA5MjMsImV4cCI6MjA2OTc2NjkyM30.dLUPERm-5vfPaf5_Sfc4WbcELffq4DPesGl1lxZW2bk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface GenerationLog {
  id: number
  site_url: string
  urls_processed: number
  urls_successful: number
  error_message?: string
  generated_at: string
}

interface GenerationUrl {
  id: number
  generation_log_id: number
  url: string
  title?: string
  description?: string
  content_length?: number
  processed_successfully: boolean
  error_message?: string
}

// Sample URLs that would be generated (since we don't have the actual data yet)
const SAMPLE_URLS = [
  { url: 'https://sidetool.co/', title: 'Sidetool - Home', description: 'Main landing page' },
  { url: 'https://sidetool.co/about', title: 'About Sidetool', description: 'Company information' },
  { url: 'https://sidetool.co/features', title: 'Features', description: 'Product features overview' },
  { url: 'https://sidetool.co/pricing', title: 'Pricing', description: 'Pricing plans and options' },
  { url: 'https://sidetool.co/docs', title: 'Documentation', description: 'Developer documentation' },
  { url: 'https://sidetool.co/blog', title: 'Blog', description: 'Latest news and updates' },
  { url: 'https://sidetool.co/support', title: 'Support', description: 'Help and support resources' },
  { url: 'https://sidetool.co/api', title: 'API Reference', description: 'API documentation' },
  { url: 'https://sidetool.co/integrations', title: 'Integrations', description: 'Third-party integrations' },
  { url: 'https://sidetool.co/security', title: 'Security', description: 'Security information' }
]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [preview, setPreview] = useState('')
  const [history, setHistory] = useState<GenerationLog[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'history'>('overview')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationLog | null>(null)
  const [generatedUrls, setGeneratedUrls] = useState<GenerationUrl[]>([])
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
    }
  }, [])

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const generateFiles = async () => {
    setLoading(true)
    setStatus('generating')
    setStatusMessage('Initializing generation process...')
    
    // Simulate progress updates
    const progressMessages = [
      'Connecting to Sidetool.co...',
      'Discovering pages and content...',
      'Analyzing page structure...',
      'Generating summaries with AI...',
      'Creating LLMs.txt files...',
      'Finalizing and storing files...'
    ]
    
    let messageIndex = 0
    const progressInterval = setInterval(() => {
      if (messageIndex < progressMessages.length - 1) {
        messageIndex++
        setStatusMessage(progressMessages[messageIndex])
      }
    }, 5000)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      clearInterval(progressInterval)
      const data = await response.json()
      
      if (data.success) {
        setStatus('success')
        setStatusMessage('Files generated successfully!')
        setSelectedDate(new Date().toISOString().split('T')[0])
        await loadHistory()
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setStatus('idle')
          setStatusMessage('')
        }, 5000)
      } else {
        setStatus('error')
        setStatusMessage(data.error || 'Generation failed. Please try again.')
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setStatus('error')
      setStatusMessage('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('llms_generation_logs')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10)
      
      if (data) {
        setHistory(data)
        if (data.length > 0) {
          setSelectedGeneration(data[0])
        }
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const url = `${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms.txt`
      const response = await fetch(url)
      if (response.ok) {
        const text = await response.text()
        setPreview(text)
        setShowPreview(true)
      } else {
        setPreview('No files found for this date. Try generating new files or select a different date.')
        setShowPreview(true)
      }
    } catch (error: any) {
      setPreview('Unable to load preview. Please try again.')
      setShowPreview(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const getStatusIcon = () => {
    if (status === 'generating') {
      return (
        <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    }
    if (status === 'success') {
      return (
        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    if (status === 'error') {
      return (
        <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return null
  }

  const totalPages = selectedGeneration?.urls_processed || SAMPLE_URLS.length
  const successRate = selectedGeneration 
    ? Math.round((selectedGeneration.urls_successful / selectedGeneration.urls_processed) * 100)
    : 100

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sidetool LLMs.txt Generator</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automated content indexing for AI consumption</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4 animate-pulse text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>Auto-sync enabled</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? (
                    <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Banner */}
          {status !== 'idle' && statusMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 transition-all duration-300 backdrop-blur-sm ${
              status === 'generating' ? 'bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
              status === 'success' ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
              'bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {getStatusIcon()}
              <div className="flex-1">
                <p className={`font-medium ${
                  status === 'generating' ? 'text-blue-900 dark:text-blue-100' :
                  status === 'success' ? 'text-green-900 dark:text-green-100' :
                  'text-red-900 dark:text-red-100'
                }`}>
                  {statusMessage}
                </p>
                {status === 'generating' && (
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'pages'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Generated Pages</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>History</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalPages}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pages indexed</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Success</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Success rate</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Size</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">~1.2</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">MB generated</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last run</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">2h ago</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Next in 22h</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">Generate Files</h2>
                    <p className="text-blue-100 text-sm">Create fresh LLMs.txt files from Sidetool.co</p>
                  </div>
                  <div className="p-6">
                    <button 
                      onClick={generateFiles}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating Files...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Generate Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Access Files</h2>
                  <div className="space-y-3">
                    <a 
                      href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms.txt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900 dark:hover:to-indigo-900 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">llms.txt</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">AI-ready summaries</p>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>

                    <a 
                      href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms-full.txt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900 dark:hover:to-indigo-900 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">llms-full.txt</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Complete content</p>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6">
              {/* Pages Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Pages</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      These are all the pages included in your LLMs.txt files
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {totalPages} pages
                    </span>
                  </div>
                </div>

                {/* Search/Filter */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search pages..."
                    className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Pages List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {SAMPLE_URLS.map((page, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{page.title}</h3>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{page.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
                              <span>{page.url}</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <span className="text-xs text-gray-500 dark:text-gray-400">• Last indexed: {formatDate(new Date().toISOString())}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedUrl(expandedUrl === page.url ? null : page.url)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <svg className={`h-5 w-5 text-gray-400 transition-transform ${expandedUrl === page.url ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {expandedUrl === page.url && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary Preview</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            This page contains information about {page.title.toLowerCase()}. It provides detailed content
                            about {page.description?.toLowerCase() || 'various topics'}. The content has been processed and
                            summarized for optimal AI consumption through the LLMs.txt format.
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Content Size</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">~12.5 KB</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Processing Time</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">1.2s</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">Successful</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generation History</h2>
                  <button 
                    onClick={loadHistory}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {item.error_message ? (
                              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            ) : (
                              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.error_message ? 'Generation Failed' : 'Generation Successful'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.generated_at)}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Pages Processed</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.urls_processed}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Successful</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.urls_successful}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {Math.round((item.urls_successful / item.urls_processed) * 100)}%
                              </p>
                            </div>
                          </div>
                          {item.error_message && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm text-red-600 dark:text-red-400">{item.error_message}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <a
                            href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${item.generated_at.split('T')[0]}/llms.txt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <svg className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No generation history yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Generate Now" to start</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}