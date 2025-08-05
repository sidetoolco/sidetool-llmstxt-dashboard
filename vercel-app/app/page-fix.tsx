'use client'

import { useEffect, useState, useCallback } from 'react'

// Temporary inline interfaces until imports are fixed
interface FileWithStatus {
  id: string
  name: string
  size: number
  content?: string
  category: string
  description?: string
  generated_at?: string
  published_at?: string | null
  published_url?: string | null
  public_url?: string | null
  notes?: string | null
}

interface DailyFiles {
  date: string
  files: FileWithStatus[]
  totalSize: number
  source?: string
}

export default function Dashboard() {
  const [dailyFiles, setDailyFiles] = useState<DailyFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadDailyFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supabase-files')
      
      if (!response.ok) {
        throw new Error('Failed to load files')
      }
      
      const data = await response.json()
      setDailyFiles(data)
    } catch (error: any) {
      console.error('Error loading files:', error)
      
      // Load fallback data
      try {
        const fallbackResponse = await fetch('/api/files')
        const fallbackData = await fallbackResponse.json()
        setDailyFiles(fallbackData)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDailyFiles()
  }, [loadDailyFiles])

  const triggerGeneration = async () => {
    setGenerating(true)
    
    try {
      const response = await fetch('/api/generate-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trigger: 'manual' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Files generated successfully!')
        setTimeout(() => {
          loadDailyFiles()
        }, 2000)
      } else {
        alert('Generation failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error triggering generation:', error)
      alert('Failed to trigger generation')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LLMs.txt Generator</h1>
              <p className="text-sm text-gray-600">AI-optimized content for Sidetool</p>
            </div>
            
            <button
              onClick={triggerGeneration}
              disabled={generating}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                generating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {generating ? 'Generating...' : 'Generate Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {dailyFiles && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Total Files</h3>
              <p className="text-2xl font-bold text-gray-900">{dailyFiles.files.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Total Size</h3>
              <p className="text-2xl font-bold text-gray-900">{(dailyFiles.totalSize / 1024).toFixed(1)} KB</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Generated</h3>
              <p className="text-2xl font-bold text-gray-900">{new Date(dailyFiles.date).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Files */}
        {dailyFiles && dailyFiles.files.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Generated Files</h2>
            </div>
            <div className="divide-y">
              {dailyFiles.files.map(file => (
                <div key={file.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-600">{file.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB • {file.category}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (file.content) {
                          navigator.clipboard.writeText(file.content)
                          alert('Copied to clipboard!')
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No files generated yet. Click "Generate Now" to create files.</p>
          </div>
        )}
        
        {/* Debug Info */}
        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Check environment: <a href="/api/debug-env" className="text-blue-600 hover:underline">/api/debug-env</a></p>
        </div>
      </main>
    </div>
  )
}