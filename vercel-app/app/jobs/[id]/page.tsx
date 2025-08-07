'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'
import { RayLogo } from '@/components/Brand/RayLogo'

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ray-black flex items-center justify-center">
        <div className="ray-loading" style={{ width: 32, height: 32 }}></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-ray-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Job not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-ray"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ray-black">
      {/* Header */}
      <header className="bg-ray-gray-950 border-b border-ray-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-ray-gray-400 hover:text-ray-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">{job.domain}</h1>
                <p className="text-xs text-ray-gray-500">Job ID: {job.id.substring(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-ray-gray-500">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Job Summary */}
        <div className="ray-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Job Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-ray-gray-500 mb-1">Status</p>
              <span className={`badge-ray ${job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'yellow'}`}>
                {job.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-ray-gray-500 mb-1">URLs Processed</p>
              <p className="font-medium text-ray-gray-100">{job.urls_processed} / {job.total_urls}</p>
            </div>
            <div>
              <p className="text-xs text-ray-gray-500 mb-1">Total Size</p>
              <p className="font-medium text-ray-gray-100">{formatBytes(job.total_content_size || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-ray-gray-500 mb-1">Completed</p>
              <p className="font-medium text-ray-gray-100">
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In Progress'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-ray-gray-800 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'files'
                  ? 'border-ray-red text-ray-red'
                  : 'border-transparent text-ray-gray-400 hover:text-ray-gray-100'
              }`}
            >
              Generated Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'urls'
                  ? 'border-ray-red text-ray-red'
                  : 'border-transparent text-ray-gray-400 hover:text-ray-gray-100'
              }`}
            >
              Crawled URLs ({urls.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'files' ? (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="ray-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {file.file_path?.split('/').pop() || file.file_type}
                    </h3>
                    <p className="text-xs text-ray-gray-400 mt-1">
                      {formatBytes(file.file_size)} • Downloaded {file.download_count || 0} times
                    </p>
                    {file.file_path?.includes('index-llms.txt') && (
                      <span className="badge-ray blue mt-2 inline-block">Index File</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(showPreview === file.id ? null : file.id)}
                      className="btn-ray-secondary text-xs"
                    >
                      {showPreview === file.id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(file.content, file.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                        copiedFile === file.id
                          ? 'bg-ray-green/20 text-ray-green border border-ray-green/30'
                          : 'btn-ray-secondary'
                      }`}
                    >
                      {copiedFile === file.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadFile(file)}
                      className="btn-ray text-xs"
                    >
                      Download
                    </button>
                  </div>
                </div>
                
                {showPreview === file.id && (
                  <div className="mt-4 p-4 bg-ray-gray-900 rounded border border-ray-gray-800 overflow-x-auto">
                    <pre className="text-xs text-ray-gray-300 font-mono whitespace-pre-wrap">
                      {file.content.substring(0, 1000)}
                      {file.content.length > 1000 && '\n\n... (truncated)'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="ray-card p-12 text-center">
                <p className="text-ray-gray-500">No files generated yet. Files will appear here once the job is complete.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="ray-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ray-gray-800">
                <thead className="bg-ray-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ray-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ray-gray-800">
                  {urls.map((url, index) => (
                    <tr key={index} className="hover:bg-ray-gray-900 transition-colors">
                      <td className="px-4 py-3 text-sm text-ray-gray-100">
                        <a 
                          href={url.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-ray-red hover:text-ray-red/80 transition-colors"
                        >
                          {url.url.replace(/^https?:\/\//, '').substring(0, 50)}
                          {url.url.length > 50 && '...'}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-ray-gray-300">
                        {url.title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`badge-ray ${
                          url.status === 'completed' ? 'green' :
                          url.status === 'failed' ? 'red' :
                          'yellow'
                        }`}>
                          {url.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-ray-gray-400">
                        {url.content_size ? formatBytes(url.content_size) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {urls.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-ray-gray-500">No URLs crawled yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}