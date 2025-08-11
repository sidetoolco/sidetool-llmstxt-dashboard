'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingDotsAnimation, EmptyStateAnimation } from '@/components/ui/LottieAnimations'

interface Job {
  id: string
  domain: string
  status: string
  max_pages: number
  total_urls: number
  urls_crawled: number
  urls_processed: number
  created_at: string
  completed_at?: string
  total_content_size?: number
}

// Favicon component with fallback
function DomainFavicon({ domain }: { domain: string }) {
  const [imageError, setImageError] = useState(false)
  
  if (imageError) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </div>
    )
  }
  
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-gray-100 overflow-hidden">
      <img 
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt={`${domain} favicon`}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [maxPages, setMaxPages] = useState(25)
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])
  
  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('crawl_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setNotification({ message: 'Failed to load jobs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [user])
  
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])
  
  const startCrawl = async () => {
    if (!user) {
      setNotification({ message: 'Please sign in to start a crawl', type: 'error' })
      return
    }
    
    if (!newDomain) {
      setNotification({ message: 'Please enter a domain', type: 'error' })
      return
    }
    
    setIsCreating(true)
    
    try {
      const cleanDomain = newDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const response = await fetch('/api/crawl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: cleanDomain,
          max_pages: maxPages,
          user_id: user.id
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`)
      }
      
      if (data.success && data.job) {
        setNotification({ message: 'Crawl started successfully!', type: 'success' })
        setNewDomain('')
        setTimeout(() => {
          router.push(`/jobs/${data.job.id}`)
        }, 500)
      }
    } catch (error: any) {
      console.error('Start crawl error:', error)
      setNotification({ message: error.message || 'Failed to start crawl', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'badge-success',
      failed: 'badge-danger',
      processing: 'badge-info',
      crawling: 'badge-warning',
      pending: 'badge'
    }
    return badges[status as keyof typeof badges] || 'badge'
  }
  
  const getProgress = (job: Job) => {
    if (job.total_urls === 0) return 0
    return Math.round((job.urls_processed / job.total_urls) * 100)
  }
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingDotsAnimation size={100} />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SideGSO</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={fetchJobs}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
              </div>
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn-secondary text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="stat-card"
          >
            <div className="stat-label">Total Crawls</div>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-change stat-change-positive">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              Active
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="stat-card"
          >
            <div className="stat-label">Pages Processed</div>
            <div className="stat-value">
              {jobs.reduce((sum, job) => sum + job.urls_processed, 0).toLocaleString()}
            </div>
            <div className="stat-change text-gray-500">
              All time
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="stat-card"
          >
            <div className="stat-label">Total Data</div>
            <div className="stat-value">
              {formatBytes(jobs.reduce((sum, job) => sum + (job.total_content_size || 0), 0))}
            </div>
            <div className="stat-change text-gray-500">
              Extracted
            </div>
          </motion.div>
        </div>
        
        {/* New crawl card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Start New Crawl
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Website Domain
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <input
                  id="domain"
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startCrawl()}
                  placeholder="example.com"
                  className="input pl-10"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the domain you want to crawl (without https://)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Maximum Pages to Crawl
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10, 25, 50].map((value) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMaxPages(value)}
                    className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all ${
                      maxPages === value
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </motion.button>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {maxPages === 10 ? '✨ Perfect for small sites' : 
                 maxPages === 25 ? '🎯 Recommended for most sites' : 
                 '🚀 Great for comprehensive coverage'}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startCrawl}
              disabled={isCreating || !newDomain}
              className="w-full btn-primary py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <LoadingDotsAnimation size={40} />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Start Crawling
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
        
        {/* Jobs list */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Crawl Jobs
            </h2>
          </div>
          
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <LoadingDotsAnimation size={80} />
            </div>
          ) : jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {jobs.map((job, index) => (
                      <motion.tr 
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DomainFavicon domain={job.domain} />
                            <div className="text-sm font-medium text-gray-900">
                              {job.domain}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${getProgress(job)}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                                />
                              </div>
                              <span className="text-xs text-gray-600 font-medium">
                                {getProgress(job)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {job.urls_processed}/{job.total_urls} pages
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatBytes(job.total_content_size || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                          >
                            View Details →
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <EmptyStateAnimation />
              <p className="mt-4 text-gray-600">No crawl jobs yet</p>
              <p className="text-sm text-gray-500 mt-1">Start your first crawl above to begin</p>
            </div>
          )}
        </motion.div>
      </main>
      
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}