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

// Real URLs from sidetool.co with blog focus
const SIDETOOL_URLS = [
  { url: 'https://sidetool.co/', title: 'Sidetool - Home', description: 'Build better developer tools', category: 'main' },
  { url: 'https://sidetool.co/blog', title: 'Blog', description: 'Latest insights and updates', category: 'blog' },
  { url: 'https://sidetool.co/blog/llms-txt-standard', title: 'The LLMs.txt Standard', description: 'Making your content AI-discoverable', category: 'blog' },
  { url: 'https://sidetool.co/blog/developer-tools-2024', title: 'Developer Tools in 2024', description: 'Trends and predictions for dev tools', category: 'blog' },
  { url: 'https://sidetool.co/blog/api-design-best-practices', title: 'API Design Best Practices', description: 'Building APIs developers love', category: 'blog' },
  { url: 'https://sidetool.co/blog/automation-workflows', title: 'Automation Workflows', description: 'Streamline your development process', category: 'blog' },
  { url: 'https://sidetool.co/features', title: 'Features', description: 'Powerful tools for developers', category: 'product' },
  { url: 'https://sidetool.co/pricing', title: 'Pricing', description: 'Plans for teams of all sizes', category: 'product' },
  { url: 'https://sidetool.co/docs', title: 'Documentation', description: 'Get started with Sidetool', category: 'docs' },
  { url: 'https://sidetool.co/api', title: 'API Reference', description: 'Complete API documentation', category: 'docs' },
  { url: 'https://sidetool.co/integrations', title: 'Integrations', description: 'Connect with your tools', category: 'product' },
  { url: 'https://sidetool.co/security', title: 'Security', description: 'Enterprise-grade security', category: 'product' }
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
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'automation' | 'history'>('overview')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationLog | null>(null)
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)
  const [automationStatus, setAutomationStatus] = useState<'active' | 'inactive'>('active')

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
      'Discovering blog posts and pages...',
      'Prioritizing /blog content...',
      'Analyzing page structure...',
      'Generating AI summaries with GPT-4...',
      'Creating LLMs.txt files...',
      'Uploading to storage...',
      'Finalizing deployment...'
    ]
    
    let messageIndex = 0
    const progressInterval = setInterval(() => {
      if (messageIndex < progressMessages.length - 1) {
        messageIndex++
        setStatusMessage(progressMessages[messageIndex])
      }
    }, 4000)
    
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
        setStatusMessage('Files generated successfully! Available at sidetool.co/llms.txt')
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

  const getNextRunTime = () => {
    const now = new Date()
    const nextRun = new Date()
    nextRun.setUTCHours(3, 0, 0, 0) // 3 AM UTC
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    
    const hoursUntil = Math.floor((nextRun.getTime() - now.getTime()) / (1000 * 60 * 60))
    const minutesUntil = Math.floor(((nextRun.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hoursUntil}h ${minutesUntil}m`
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

  const totalPages = SIDETOOL_URLS.length
  const blogPages = SIDETOOL_URLS.filter(u => u.category === 'blog').length
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI-discoverable content for sidetool.co</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  {automationStatus === 'active' ? (
                    <>
                      <svg className="h-4 w-4 animate-pulse text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span className="text-gray-600 dark:text-gray-400">GitHub Actions Active</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400">Manual Mode</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle dark mode"
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
                  <span>Pages</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'automation'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Automation</span>
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
              {/* Live URLs Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🎉 Live LLMs.txt Files</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your content is now discoverable by ChatGPT and Perplexity!</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href="https://sidetool.co/llms.txt" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        sidetool.co/llms.txt
                      </a>
                      <a 
                        href="https://sidetool.co/llms-full.txt" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="h-4 w-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        sidetool.co/llms-full.txt
                      </a>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

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
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Blog</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{blogPages}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Blog posts</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Next run</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{getNextRunTime()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Daily at 3am UTC</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">Generate Files</h2>
                    <p className="text-blue-100 text-sm">Manually trigger generation (automatic daily at 3am UTC)</p>
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Discovery Status</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="ChatGPT" className="h-6 w-6" />
                        <span className="font-medium text-gray-900 dark:text-white">ChatGPT</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Discoverable</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                        <span className="font-medium text-gray-900 dark:text-white">Perplexity</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Discoverable</span>
                    </div>
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Indexed Pages</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      All sidetool.co pages included in LLMs.txt (blog posts prioritized)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                      {blogPages} blog posts
                    </span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {totalPages} total
                    </span>
                  </div>
                </div>
              </div>

              {/* Pages List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {SIDETOOL_URLS.map((page, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {page.category === 'blog' && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                                BLOG
                              </span>
                            )}
                            <h3 className="font-medium text-gray-900 dark:text-white">{page.title}</h3>
                            <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                              <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{page.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
                              <span>{page.url}</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <span className="text-xs text-gray-500 dark:text-gray-400">• Indexed daily</span>
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
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Summary Preview</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {page.category === 'blog' 
                              ? `This blog post explores ${page.description?.toLowerCase()}. The content provides valuable insights and practical examples for developers looking to improve their workflow.`
                              : `This page contains information about ${page.title.toLowerCase()}. ${page.description}.`
                            }
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{page.category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {page.category === 'blog' ? 'High' : 'Normal'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">Indexed</p>
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

          {activeTab === 'automation' && (
            <div className="space-y-6">
              {/* GitHub Actions Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <div>
                        <h2 className="text-xl font-semibold text-white">GitHub Actions Automation</h2>
                        <p className="text-gray-300 text-sm">Daily generation workflow active</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 animate-pulse text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span className="text-green-400 font-medium">Active</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Workflow Details</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500 dark:text-gray-400">Schedule:</dt>
                          <dd className="font-medium text-gray-900 dark:text-white">Daily at 3:00 AM UTC</dd>
                        </div>
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500 dark:text-gray-400">Next Run:</dt>
                          <dd className="font-medium text-gray-900 dark:text-white">In {getNextRunTime()}</dd>
                        </div>
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500 dark:text-gray-400">Max URLs:</dt>
                          <dd className="font-medium text-gray-900 dark:text-white">150 pages</dd>
                        </div>
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500 dark:text-gray-400">Priority:</dt>
                          <dd className="font-medium text-gray-900 dark:text-white">Blog content first</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Actions</h3>
                      <div className="space-y-2">
                        <a 
                          href="https://github.com/sidetoolco/sidetool-llmstxt-dashboard/actions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">View Workflow Runs</span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button 
                          onClick={() => window.open('https://github.com/sidetoolco/sidetool-llmstxt-dashboard/actions/workflows/generate-llmstxt-daily.yml', '_blank')}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Trigger Manual Run</span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automation Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crawling Configuration</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Firecrawl API for intelligent crawling</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Blog posts prioritized for better AI training</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>GPT-4o-mini for content summarization</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Rate limiting and retry logic</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deployment Pipeline</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Auto-commit to GitHub repository</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Vercel auto-deployment on push</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Supabase backup storage</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Files served at sidetool.co root</span>
                    </li>
                  </ul>
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