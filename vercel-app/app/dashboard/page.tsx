'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { RippleButton, HoverCard, SmoothProgress, Toast } from '@/components/ui/MicroInteractions'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useLocalFirst, localCache } from '@/lib/localCache'
import { measurePerformance, debounce, formatBytes, prefetch } from '@/lib/utils'
import { PerformanceMonitor } from '@/components/Performance/PerformanceMonitor'
import { RayLogo } from '@/components/Brand/RayLogo'

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
  const [maxPages, setMaxPages] = useState(25)
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
    <div className="min-h-screen bg-ray-black">
      <PerformanceMonitor />
      
      {/* Header */}
      <header className="bg-ray-gray-950 border-b border-ray-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <RayLogo size="sm" showText={true} />
              {isStale && (
                <span className="badge-ray yellow">
                  Offline
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                className="p-1.5 text-ray-gray-400 hover:text-ray-gray-100 transition-colors"
                aria-label="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
              
              <span className="text-xs text-ray-gray-500">
                {user?.email}
              </span>
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn-ray-secondary text-xs"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* New crawl card */}
        <div className="ray-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Start New Crawl
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="new-crawl-input" className="block text-xs font-medium text-ray-gray-400 mb-2">
                Website Domain
              </label>
              <input
                id="new-crawl-input"
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startCrawl()}
                placeholder="example.com"
                className="input-ray"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-ray-gray-400 mb-2">
                Max Pages to Crawl
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[10, 25, 50, 100, 250].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMaxPages(value)}
                    className={`py-1.5 px-3 text-xs font-medium rounded border transition-all ${
                      maxPages === value
                        ? 'bg-ray-red text-white border-ray-red'
                        : 'bg-ray-gray-950 text-ray-gray-400 border-ray-gray-800 hover:border-ray-gray-600 hover:text-ray-gray-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ray-gray-600 mt-1">
                {maxPages < 50 ? 'Good for small sites' : maxPages < 100 ? 'Recommended for most sites' : 'For large sites'}
              </p>
            </div>
            
            <button
              onClick={startCrawl}
              disabled={isCreating || !newDomain}
              className="w-full btn-ray disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="ray-loading" />
                  Starting...
                </>
              ) : (
                'Start Crawl'
              )}
            </button>
          </div>
        </div>
        
        {/* Jobs list */}
        <div className="ray-card overflow-hidden">
          <div className="px-6 py-4 border-b border-ray-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Recent Jobs
            </h2>
          </div>
          
          {loading && !jobs ? (
            <SkeletonTable rows={5} columns={5} />
          ) : jobs && jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-ray-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ray-gray-800">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id}
                      className={`hover:bg-ray-gray-900 cursor-pointer transition-all duration-200
                        ${selectedJob === job.id ? 'bg-ray-gray-900' : ''}`}
                      onClick={() => setSelectedJob(job.id)}
                      onMouseEnter={() => handleJobHover(job.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-ray-gray-100">
                        {job.domain}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`badge-ray ${job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'yellow'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="w-32">
                          <div className="progress-ray">
                            <div className="progress-ray-bar" style={{ width: `${getProgress(job)}%` }} />
                          </div>
                          <span className="text-xs text-ray-gray-500 mt-1">
                            {job.urls_processed}/{job.total_urls}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-ray-gray-400">
                        {formatBytes(job.total_content_size || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-ray-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/jobs/${job.id}`)
                          }}
                          className="text-ray-red hover:text-ray-red/80 font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-ray-gray-500">
              <p className="text-sm">No jobs yet. Start your first crawl above.</p>
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center text-xs text-ray-gray-600">
          Press <kbd className="kbd">?</kbd> for keyboard shortcuts
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