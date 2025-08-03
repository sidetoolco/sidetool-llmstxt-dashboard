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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [preview, setPreview] = useState('')
  const [history, setHistory] = useState<GenerationLog[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const generateFiles = async () => {
    setLoading(true)
    setStatus('idle')
    setStatusMessage('Generating files... This may take 30-60 seconds')
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStatus('success')
        setStatusMessage('Files generated successfully!')
        setSelectedDate(new Date().toISOString().split('T')[0])
        await loadHistory()
      } else {
        setStatus('error')
        setStatusMessage(`Error: ${data.error || 'Unknown error occurred'}`)
      }
    } catch (error: any) {
      setStatus('error')
      setStatusMessage(`Error: ${error.message}`)
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
    try {
      const url = `${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms.txt`
      const response = await fetch(url)
      if (response.ok) {
        const text = await response.text()
        setPreview(text)
        setShowPreview(true)
      } else {
        setPreview('No file found for this date')
        setShowPreview(true)
      }
    } catch (error: any) {
      setPreview(`Error loading preview: ${error.message}`)
      setShowPreview(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sidetool LLMs.txt Generator</h1>
        <p className="text-gray-600">Generate and manage LLMs.txt files for sidetool.co</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Generation Control */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Files</h2>
          
          {/* Generate Button */}
          <button 
            onClick={generateFiles}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate LLMs.txt Files'
            )}
          </button>

          {/* Status Messages */}
          {statusMessage && (
            <div className="mt-4">
              <div 
                className={`p-3 rounded-md text-sm ${
                  status === 'success' ? 'bg-green-100 text-green-800' :
                  status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                {statusMessage}
              </div>
            </div>
          )}

          {/* Latest Generation Info */}
          {history.length > 0 && history[0] && !history[0].error_message && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Latest Generation:</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Date:</span> {formatDate(history[0].generated_at)}</p>
                <p><span className="font-medium">URLs Processed:</span> {history[0].urls_processed}</p>
                <p><span className="font-medium">Successful:</span> {history[0].urls_successful}</p>
              </div>
            </div>
          )}
        </div>

        {/* Files Viewer */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Files</h2>
          
          {/* Date Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Links */}
          <div className="space-y-3">
            <a 
              href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-md transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">llms.txt</p>
                  <p className="text-sm text-gray-500">Index file with summaries</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>

            <a 
              href={`${supabaseUrl}/storage/v1/object/public/llms-files/sidetool/${selectedDate}/llms-full.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-md transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">llms-full.txt</p>
                  <p className="text-sm text-gray-500">Complete content file</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          </div>

          {/* Preview Section */}
          <div className="mt-6">
            <button 
              onClick={loadPreview}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Load Preview
            </button>
            
            {showPreview && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Preview (llms.txt):</h3>
                <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {preview}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation History */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Generation History</h2>
            <button 
              onClick={loadHistory}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
          
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URLs Processed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.generated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.urls_processed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.urls_successful}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`text-sm font-medium ${
                            item.error_message ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {item.error_message ? 'Error' : 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No generation history yet</p>
          )}
        </div>
      </div>
    </div>
  )
}