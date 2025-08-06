'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'

interface CrawlJob {
  id: string
  domain: string
  status: 'pending' | 'mapping' | 'crawling' | 'processing' | 'completed' | 'failed'
  max_pages: number
  total_urls?: number
  urls_crawled: number
  urls_processed: number
  created_at: string
  completed_at?: string
  error_message?: string
  llms_txt_id?: string
  llms_full_txt_id?: string
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [domain, setDomain] = useState('')
  const [maxPages, setMaxPages] = useState(20)
  const [jobs, setJobs] = useState<CrawlJob[]>([])
  const [activeJob, setActiveJob] = useState<CrawlJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Load user's jobs
  useEffect(() => {
    if (user) {
      loadJobs()
      
      // Set up real-time subscription for job updates
      const subscription = supabase
        .channel('job-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'crawl_jobs',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          loadJobs()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadJobs = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error loading jobs:', error)
      return
    }

    setJobs(data || [])
    
    // Set active job if there's one in progress
    const inProgressJob = data?.find(job => 
      ['pending', 'mapping', 'crawling', 'processing'].includes(job.status)
    )
    setActiveJob(inProgressJob || null)
  }

  const validateDomain = (input: string): string | null => {
    // Remove protocol if present
    let cleanDomain = input.replace(/^https?:\/\//, '')
    
    // Remove trailing slash
    cleanDomain = cleanDomain.replace(/\/$/, '')
    
    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    
    if (!domainRegex.test(cleanDomain)) {
      return 'Please enter a valid domain (e.g., example.com)'
    }
    
    return null
  }

  const startCrawl = async () => {
    if (!user) return
    
    setError(null)
    
    // Validate domain
    const validationError = validateDomain(domain)
    if (validationError) {
      setError(validationError)
      return
    }
    
    // Clean domain for processing
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    setLoading(true)
    
    try {
      // Create crawl job
      const response = await fetch('/api/crawl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: cleanDomain,
          max_pages: maxPages,
          user_id: user.id
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to start crawl')
      }
      
      const { job } = await response.json()
      
      setActiveJob(job)
      setDomain('')
      await loadJobs()
      
    } catch (err: any) {
      setError(err.message || 'Failed to start crawl')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'mapping':
      case 'crawling':
      case 'processing': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
      case 'failed':
        return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
      default:
        return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">LLMs.txt Generator</h1>
                <p className="text-xs text-gray-500">Generate AI-ready content from any website</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate LLMs.txt Files</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                Website Domain
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                disabled={loading || activeJob !== null}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the domain you want to generate LLMs.txt files for
              </p>
            </div>

            <div>
              <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Pages to Crawl
              </label>
              <select
                id="maxPages"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                disabled={loading || activeJob !== null}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value={10}>10 pages</option>
                <option value={20}>20 pages (recommended)</option>
                <option value={50}>50 pages</option>
                <option value={100}>100 pages</option>
                <option value={200}>200 pages (pro)</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startCrawl}
              disabled={!domain || loading || activeJob !== null}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : activeJob ? 'Job in Progress' : 'Start Generation'}
            </button>
          </div>
        </div>

        {/* Active Job Progress */}
        {activeJob && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Active Job</h3>
                <p className="text-sm text-blue-700">{activeJob.domain}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(activeJob.status)}`}>
                {getStatusIcon(activeJob.status)}
                <span>{activeJob.status}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-700">
                <span>Progress</span>
                <span>{activeJob.urls_processed} / {activeJob.total_urls || '?'} URLs</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: activeJob.total_urls 
                      ? `${(activeJob.urls_processed / activeJob.total_urls) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Status Messages */}
            <div className="mt-4 text-sm text-blue-700">
              {activeJob.status === 'mapping' && 'Discovering URLs on the website...'}
              {activeJob.status === 'crawling' && 'Extracting content from pages...'}
              {activeJob.status === 'processing' && 'Generating AI summaries...'}
              {activeJob.error_message && (
                <div className="mt-2 text-red-600">{activeJob.error_message}</div>
              )}
            </div>
          </div>
        )}

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h3>
          
          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{job.domain}</h4>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span>{job.status}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {job.urls_processed} URLs processed • {new Date(job.created_at).toLocaleString()}
                      </div>
                      {job.error_message && (
                        <div className="mt-2 text-sm text-red-600">{job.error_message}</div>
                      )}
                    </div>
                    
                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Files
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No jobs yet. Start by entering a domain above.</p>
          )}
        </div>
      </main>
    </div>
  )
}