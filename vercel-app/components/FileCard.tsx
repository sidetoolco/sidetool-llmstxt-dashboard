'use client'

import { useState } from 'react'
import type { FileWithStatus } from '@/app/page'

interface FileCardProps {
  file: FileWithStatus
  onTogglePublish: (fileId: string, currentStatus: boolean, fileName: string) => Promise<void>
  onCopyToClipboard: (text: string, label: string) => void
  isPublishing: boolean
}

export const FileCard = ({ file, onTogglePublish, onCopyToClipboard, isPublishing }: FileCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
    collection: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    topic: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    individual: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    demo: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  }

  const colors = categoryColors[file.category] || categoryColors.demo

  return (
    <div
      className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${
        isHovered ? 'border-blue-200' : 'border-gray-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
            {file.name}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            {file.category}
          </span>
        </div>

        {/* Description */}
        {file.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{file.description}</p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {(file.size / 1024).toFixed(1)} KB
          </span>
          {file.published_at && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Published
            </span>
          )}
        </div>
      </div>

      {/* Content Preview - Expandable */}
      {file.content && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span>Preview Content</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="px-4 pb-3">
              <pre className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                {file.content.substring(0, 500)}
                {file.content.length > 500 && '...'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => onCopyToClipboard(file.content || '', file.name)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            title="Copy content to clipboard"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          <button
            onClick={() => onTogglePublish(file.id, !!file.published_at, file.name)}
            disabled={isPublishing}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              file.published_at
                ? 'text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100'
                : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
            } ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPublishing ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : file.published_at ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Unpublish
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Publish
              </>
            )}
          </button>
        </div>

        {/* Published URL */}
        {file.published_url && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={file.published_url}
              readOnly
              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded font-mono text-gray-600"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => onCopyToClipboard(file.published_url!, 'URL')}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Copy URL"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}