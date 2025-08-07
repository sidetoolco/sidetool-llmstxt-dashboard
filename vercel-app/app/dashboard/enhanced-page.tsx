'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'
import { SkeletonCard, SkeletonTable } from '@/components/UI/Skeleton'
import { RippleButton, HoverCard, SmoothProgress, Toast, Spinner } from '@/components/UI/MicroInteractions'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useLocalFirst, localCache } from '@/lib/localCache'
import { measurePerformance, debounce, formatBytes, prefetch } from '@/lib/utils'
import { PerformanceMonitor } from '@/components/Performance/PerformanceMonitor'

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

export default function EnhancedDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Local-first data fetching
  const fetchJobs = useCallback(async () => {
    if (!user) return []
    
    const { data, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data || []
  }, [user])
  
  const { 
    data: jobs, 
    loading, 
    error, 
    isStale, 
    refresh 
  } = useLocalFirst<Job[]>('user_jobs', fetchJobs, {
    store: 'jobs',
    dependencies: [user?.id],
    staleTime: 60000 // 1 minute
  })
  
  const [newDomain, setNewDomain] = useState('')
  const [maxPages, setMaxPages] = useState(20)
  const [isCreating, setIsCreating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  
  // Prefetch job details on hover
  const handleJobHover = useCallback((jobId: string) => {
    prefetch(`/jobs/${jobId}`)
  }, [])
  
  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      cmd: true,
      handler: () => document.getElementById('new-crawl-input')?.focus(),
      description: 'New crawl job'
    },
    {
      key: 'r',
      cmd: true,
      handler: () => refresh(),
      description: 'Refresh jobs'
    },
    {
      key: 'Enter',
      handler: () => {
        if (selectedJob) {
          router.push(`/jobs/${selectedJob}`)
        }
      },
      description: 'Open selected job'
    },
    {
      key: 'ArrowUp',
      handler: () => {
        if (jobs && jobs.length > 0) {
          const currentIndex = jobs.findIndex(j => j.id === selectedJob)
          const newIndex = Math.max(0, currentIndex - 1)
          setSelectedJob(jobs[newIndex].id)
        }
      }
    },
    {
      key: 'ArrowDown',
      handler: () => {
        if (jobs && jobs.length > 0) {
          const currentIndex = jobs.findIndex(j => j.id === selectedJob)
          const newIndex = Math.min(jobs.length - 1, currentIndex + 1)
          setSelectedJob(jobs[newIndex].id)
        }
      }
    }
  ])
  
  // Debounced domain validation
  const validateDomain = debounce((input: string) => {
    const cleanDomain = input.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    
    if (!domainRegex.test(cleanDomain)) {
      setToast({ message: 'Please enter a valid domain', type: 'error' })
      return false
    }
    return true
  }, 300)
  
  const startCrawl = async () => {
    if (!user || !validateDomain(newDomain)) return
    
    setIsCreating(true)
    
    try {
      const response = await measurePerformance(
        'start_crawl',
        () => fetch('/api/crawl/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: newDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            maxPages,
            userId: user.id
          })
        }),
        2000
      )
      
      const data = await response.json()
      
      if (data.success) {
        setToast({ message: 'Crawl started successfully!', type: 'success' })
        setNewDomain('')
        
        // Optimistically update local cache
        const newJob: Job = {
          id: data.jobId,
          domain: newDomain,
          status: 'pending',
          max_pages: maxPages,
          total_urls: 0,
          urls_crawled: 0,
          urls_processed: 0,
          created_at: new Date().toISOString()
        }
        
        const currentJobs = jobs || []
        await localCache.set('jobs', 'user_jobs', [newJob, ...currentJobs])
        
        // Prefetch the new job page
        prefetch(`/jobs/${data.jobId}`)
        
        setTimeout(() => {
          router.push(`/jobs/${data.jobId}`)
        }, 500)
      } else {
        setToast({ message: data.error || 'Failed to start crawl', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsCreating(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      crawling: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }
  
  const getProgress = (job: Job) => {
    if (job.total_urls === 0) return 0
    return (job.urls_processed / job.total_urls) * 100
  }
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SkeletonCard />
          <div className="mt-8">
            <SkeletonTable rows={5} columns={5} />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PerformanceMonitor />
      
      {/* Header with smooth animations */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                SideGSO Dashboard
              </h1>
              {isStale && (
                <span className="ml-3 text-xs text-yellow-600 dark:text-yellow-400">
                  • Offline mode
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <RippleButton
                onClick={refresh}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </RippleButton>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </span>
              
              <RippleButton
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Sign out
              </RippleButton>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New crawl card with micro-interactions */}
        <HoverCard className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Start New Crawl
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="new-crawl-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website Domain
              </label>
              <input
                id="new-crawl-input"
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startCrawl()}
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Pages: {maxPages}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <RippleButton
              onClick={startCrawl}
              disabled={isCreating || !newDomain}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md 
                hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" />
                  Starting...
                </>
              ) : (
                'Start Crawl'
              )}
            </RippleButton>
          </div>
        </HoverCard>
        
        {/* Jobs list with enhanced UI */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Jobs
            </h2>
          </div>
          
          {loading && !jobs ? (
            <SkeletonTable rows={5} columns={5} />
          ) : jobs && jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150
                        ${selectedJob === job.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => setSelectedJob(job.id)}
                      onMouseEnter={() => handleJobHover(job.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {job.domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="w-32">
                          <SmoothProgress value={getProgress(job)} />
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {job.urls_processed}/{job.total_urls}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatBytes(job.total_content_size || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <RippleButton
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/jobs/${job.id}`)
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1"
                        >
                          View
                        </RippleButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No jobs yet. Start your first crawl above!
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">?</kbd> for keyboard shortcuts
        </div>
      </main>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}