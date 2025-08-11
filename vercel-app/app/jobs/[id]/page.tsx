'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingDotsAnimation } from '@/components/ui/LottieAnimations'

interface GeneratedFile {
  id: string
  file_type: 'llms.txt' | 'llms-full.txt'
  file_path?: string
  content: string
  file_size: number
  created_at: string
  download_count?: number
}

interface CrawledUrl {
  url: string
  title?: string
  description?: string
  status: string
  content_size?: number
  error_message?: string
}

interface JobDetails {
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
  error_message?: string
}

// Domain favicon component
function DomainFavicon({ domain }: { domain: string }) {
  const [imageError, setImageError] = useState(false)
  
  if (imageError) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-xl">S</span>
      </div>
    )
  }
  
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden shadow-sm">
      <img 
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt={`${domain} favicon`}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [urls, setUrls] = useState<CrawledUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'files' | 'urls'>('files')
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && params.id) {
      loadJobDetails()
      
      // Set up auto-refresh for active jobs
      const jobId = String(params.id).replace(/^eq\./, '')
      const interval = setInterval(async () => {
        // Only refresh if job might still be active
        if (job && ['pending', 'mapping', 'crawling', 'processing'].includes(job.status)) {
          loadJobDetails()
        }
      }, 5000) // Refresh every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [user, params.id, job?.status])

  const loadJobDetails = async () => {
    if (!user || !params.id) return
    
    setLoading(true)
    
    // Clean the job ID in case it has any prefixes
    const jobId = String(params.id).replace(/^eq\./, '')
    
    try {
      // Load job details
      const { data: jobData, error: jobError } = await supabase
        .from('crawl_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()
      
      if (jobError || !jobData) {
        router.push('/dashboard')
        return
      }
      
      setJob(jobData)
      
      // Load generated files
      const { data: filesData, error: filesError } = await supabase
        .from('generated_files')
        .select('*')
        .eq('job_id', jobId)
        .order('file_type')
      
      if (filesError) {
        console.error('Error loading files:', filesError)
      }
      
      console.log(`Loaded ${filesData?.length || 0} files for job ${jobId}`)
      setFiles(filesData || [])
      
      // Load crawled URLs
      const { data: urlsData } = await supabase
        .from('crawled_urls')
        .select('url, title, description, status, content_size, error_message')
        .eq('job_id', jobId)
        .order('url')
      
      setUrls(urlsData || [])
      
    } catch (error) {
      console.error('Error loading job details:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Use the file path's filename if available, otherwise fallback to domain_file_type
    a.download = file.file_path?.split('/').pop() || `${job?.domain.replace(/\./g, '_')}_${file.file_type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Update download count
    supabase
      .from('generated_files')
      .update({ 
        download_count: (file.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', file.id)
      .then(() => {})
  }

  const copyToClipboard = async (content: string, fileId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(fileId)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingDotsAnimation size={100} />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <DomainFavicon domain={job.domain} />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{job.domain}</h1>
                  <p className="text-xs text-gray-500">Job ID: {job.id.substring(0, 8)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Status</p>
              <span className={getStatusBadge(job.status)}>
                {job.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">URLs Processed</p>
              <p className="text-xl font-semibold text-gray-900">{job.urls_processed} / {job.total_urls}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Total Size</p>
              <p className="text-xl font-semibold text-gray-900">{formatBytes(job.total_content_size || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Completed</p>
              <p className="text-xl font-semibold text-gray-900">
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In Progress'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {job.status !== 'completed' && job.total_urls > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Processing Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((job.urls_processed / job.total_urls) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(job.urls_processed / job.total_urls) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'files'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generated Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'urls'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Crawled URLs ({urls.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'files' ? (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {files.map((file, index) => (
                <motion.div 
                  key={file.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {file.file_path?.split('/').pop() || file.file_type}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatBytes(file.file_size)} • Downloaded {file.download_count || 0} times
                      </p>
                      {file.file_path?.includes('index-llms.txt') && (
                        <span className="badge-info mt-2 inline-block">Index File</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPreview(showPreview === file.id ? null : file.id)}
                        className="btn-secondary text-sm"
                      >
                        {showPreview === file.id ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(file.content, file.id)}
                        className={copiedFile === file.id
                          ? 'badge-success px-6 py-3 text-sm font-medium'
                          : 'btn-secondary text-sm'
                        }
                      >
                        {copiedFile === file.id ? '✓ Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        className="btn-primary text-sm"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  
                  {showPreview === file.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto"
                    >
                      <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                        {file.content.substring(0, 1000)}
                        {file.content.length > 1000 && '\n\n... (truncated)'}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              
              {files.length === 0 && (
                <div className="card p-16 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No files generated yet</p>
                  <p className="text-sm text-gray-400 mt-1">Files will appear here once the job is complete</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="urls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {urls.map((url, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm">
                          <a 
                            href={url.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                          >
                            {url.url.replace(/^https?:\/\//, '').substring(0, 50)}
                            {url.url.length > 50 && '...'}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {url.title || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`badge ${
                            url.status === 'completed' ? 'badge-success' :
                            url.status === 'failed' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {url.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {url.content_size ? formatBytes(url.content_size) : '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                
                {urls.length === 0 && (
                  <div className="p-16 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <p className="text-gray-500">No URLs crawled yet</p>
                    <p className="text-sm text-gray-400 mt-1">URLs will appear here as they are processed</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}