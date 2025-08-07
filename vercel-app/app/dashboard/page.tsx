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
import { Logo, BrandPattern } from '@/components/Brand/Logo'

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
    <div className="min-h-screen mesh-gradient relative overflow-hidden">
      <BrandPattern className="opacity-10" />
      <PerformanceMonitor />
      
      {/* Header with glass effect */}
      <header className="glass-card sticky top-0 z-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <Logo variant="gradient" size="md" showText={true} />
              {isStale && (
                <span className="ml-3 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  Offline mode
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <RippleButton
                onClick={refresh}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                aria-label="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </RippleButton>
              
              <div className="glass-card px-4 py-2 rounded-full">
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
              </div>
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn-brand text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* New crawl card with glass effect */}
        <div className="glass-card card-hover p-8 mb-8">
          <h2 className="text-2xl font-bold gradient-text mb-6 display-font">
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
                className="w-full px-4 py-3 glass-card rounded-lg text-gray-900 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200 gradient-border"
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
            
            <button
              onClick={startCrawl}
              disabled={isCreating || !newDomain}
              className="w-full btn-brand disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 shimmer"
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" />
                  Starting...
                </>
              ) : (
                'Start Crawl'
              )}
            </button>
          </div>
        </div>
        
        {/* Jobs list with glass effect */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/10">
            <h2 className="text-2xl font-bold gradient-text display-font">
              Recent Jobs
            </h2>
          </div>
          
          {loading && !jobs ? (
            <SkeletonTable rows={5} columns={5} />
          ) : jobs && jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="glass-card">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id}
                      className={`hover:bg-white/5 cursor-pointer transition-all duration-200
                        ${selectedJob === job.id ? 'bg-indigo-500/10' : ''}`}
                      onClick={() => setSelectedJob(job.id)}
                      onMouseEnter={() => handleJobHover(job.id)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-800">
                        {job.domain}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)} shimmer`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <div className="w-32">
                          <SmoothProgress value={getProgress(job)} />
                          <span className="text-xs text-gray-600 mt-1">
                            {job.urls_processed}/{job.total_urls}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {formatBytes(job.total_content_size || 0)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/jobs/${job.id}`)
                          }}
                          className="gradient-text hover:opacity-80 px-3 py-1 font-medium transition-opacity"
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
            <div className="px-6 py-16 text-center text-gray-600">
              <div className="mb-4">
                <Logo variant="gradient" size="lg" showText={false} className="mx-auto opacity-30" />
              </div>
              <p className="text-lg">No jobs yet. Start your first crawl above!</p>
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-6 text-center text-xs text-gray-600">
          Press <kbd className="px-2 py-1 glass-card rounded text-indigo-600 font-medium">?</kbd> for keyboard shortcuts
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