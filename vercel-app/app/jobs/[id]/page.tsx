'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { supabase } from '@/components/Auth/AuthProvider'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{job.domain}</h1>
                <p className="text-xs text-gray-500">Job ID: {job.id.substring(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900 capitalize">{job.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">URLs Processed</p>
              <p className="font-medium text-gray-900">{job.urls_processed} / {job.total_urls}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Size</p>
              <p className="font-medium text-gray-900">{formatBytes(job.total_content_size || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="font-medium text-gray-900">
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In Progress'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generated Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'urls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div key={file.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {file.file_path?.split('/').pop() || file.file_type}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatBytes(file.file_size)} • Downloaded {file.download_count || 0} times
                    </p>
                    {file.file_path?.includes('index-llms.txt') && (
                      <p className="text-xs text-blue-600 mt-1">Index file with links to all pages</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(showPreview === file.id ? null : file.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showPreview === file.id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(file.content, file.id)}
                      className={`px-3 py-1 text-sm font-medium rounded border transition-colors ${
                        copiedFile === file.id
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {copiedFile === file.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadFile(file)}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                </div>
                
                {showPreview === file.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                      {file.content.substring(0, 1000)}
                      {file.content.length > 1000 && '\n\n... (truncated)'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No files generated yet. Files will appear here once the job is complete.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {urls.map((url, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <a 
                          href={url.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {url.url.replace(/^https?:\/\//, '').substring(0, 50)}
                          {url.url.length > 50 && '...'}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {url.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          url.status === 'completed' ? 'bg-green-100 text-green-800' :
                          url.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {url.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {url.content_size ? formatBytes(url.content_size) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {urls.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No URLs crawled yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}