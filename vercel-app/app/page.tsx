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

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [preview, setPreview] = useState('')
  const [history, setHistory] = useState<GenerationLog[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  useEffect(() => {
    loadHistory()
  }, [])

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

  const getStatusIcon = () => {
    if (status === 'generating') {
      return (
        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    }
    if (status === 'success') {
      return (
        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    if (status === 'error') {
      return (
        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sidetool LLMs.txt Generator</h1>
                <p className="text-sm text-gray-500">Automated content indexing for AI consumption</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Auto-generates daily at 2:00 AM UTC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {status !== 'idle' && statusMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 transition-all duration-300 ${
            status === 'generating' ? 'bg-blue-50 border border-blue-200' :
            status === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {getStatusIcon()}
            <div className="flex-1">
              <p className={`font-medium ${
                status === 'generating' ? 'text-blue-900' :
                status === 'success' ? 'text-green-900' :
                'text-red-900'
              }`}>
                {statusMessage}
              </p>
              {status === 'generating' && (
                <p className="text-sm text-blue-600 mt-1">This typically takes 30-60 seconds...</p>
              )}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Generation & Files */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Quick Actions</h2>
                <p className="text-blue-100 text-sm">Generate fresh LLMs.txt files from Sidetool.co content</p>
              </div>
              <div className="p-6">
                <button 
                  onClick={generateFiles}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
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
                
                {/* Latest Generation Stats */}
                {history.length > 0 && history[0] && !history[0].error_message && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Latest Generation</h3>
                      <span className="text-xs text-gray-500">{formatDate(history[0].generated_at)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{history[0].urls_processed}</p>
                        <p className="text-xs text-gray-500">Pages Scanned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{history[0].urls_successful}</p>
                        <p className="text-xs text-gray-500">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {Math.round((history[0].urls_successful / history[0].urls_processed) * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">Success Rate</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Files Access Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Access Generated Files</h2>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-3">
                {/* LLMs.txt File */}
                <a 
                  href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms.txt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">llms.txt</p>
                        <p className="text-sm text-gray-500">Index with AI-ready summaries</p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>

                {/* LLMs-full.txt File */}
                <a 
                  href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms-full.txt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">llms-full.txt</p>
                        <p className="text-sm text-gray-500">Complete content archive</p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              </div>

              {/* Preview Button */}
              <button 
                onClick={loadPreview}
                disabled={previewLoading}
                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {previewLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading Preview...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview llms.txt</span>
                  </>
                )}
              </button>
              
              {/* Preview Content */}
              {showPreview && (
                <div className="mt-4 relative">
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="p-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {preview}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Generation History</h2>
                  <button 
                    onClick={loadHistory}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {item.error_message ? (
                            <div className="p-1 bg-red-100 rounded">
                              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          ) : (
                            <div className="p-1 bg-green-100 rounded">
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <span className={`text-sm font-medium ${
                            item.error_message ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.error_message ? 'Failed' : 'Success'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{formatDate(item.generated_at)}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>{item.urls_processed} pages</span>
                        <span>•</span>
                        <span>{item.urls_successful} successful</span>
                      </div>
                      {item.error_message && (
                        <p className="mt-2 text-xs text-red-600 line-clamp-2">{item.error_message}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No generation history yet</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Generate Now" to start</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}