'use client'

import { useState } from 'react'

interface FileCardProps {
  file: {
    id: string
    name: string
    description?: string
    category: string
    content: string
    size: number
    lastModified: Date
    published?: boolean
  }
  onTogglePublish?: (fileId: string, currentStatus: boolean, fileName: string) => Promise<void>
  onCopyToClipboard?: (text: string, label: string) => void
  isPublishing?: boolean
}

export const FileCard = ({ file, onTogglePublish, onCopyToClipboard, isPublishing }: FileCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const categoryBadges: Record<string, string> = {
    collection: 'purple',
    topic: 'blue',
    individual: 'green',
    demo: 'yellow'
  }

  const badgeColor = categoryBadges[file.category] || 'yellow'

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="ray-card p-4 hover:bg-ray-gray-900 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm mb-1">
            {file.name}
          </h3>
          {file.description && (
            <p className="text-xs text-ray-gray-400 line-clamp-2">{file.description}</p>
          )}
        </div>
        <span className={`badge-ray ${badgeColor} flex-shrink-0`}>
          {file.category}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-xs text-ray-gray-500 mb-3">
        <span>{formatSize(file.size)}</span>
        <span>•</span>
        <span>{new Date(file.lastModified).toLocaleDateString()}</span>
        {file.published !== undefined && (
          <>
            <span>•</span>
            <span className={file.published ? 'text-ray-green' : 'text-ray-gray-600'}>
              {file.published ? 'Published' : 'Draft'}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-ray-secondary text-xs"
        >
          {isExpanded ? 'Hide' : 'Preview'}
        </button>
        
        {onCopyToClipboard && (
          <button
            onClick={() => onCopyToClipboard(file.content, file.name)}
            className="btn-ray-secondary text-xs"
          >
            Copy
          </button>
        )}
        
        {onTogglePublish && (
          <button
            onClick={() => onTogglePublish(file.id, file.published || false, file.name)}
            disabled={isPublishing}
            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
              file.published 
                ? 'bg-ray-green/20 text-ray-green border border-ray-green/30'
                : 'btn-ray-secondary'
            } disabled:opacity-50`}
          >
            {isPublishing ? (
              <div className="ray-loading" style={{ width: 12, height: 12 }} />
            ) : (
              file.published ? 'Unpublish' : 'Publish'
            )}
          </button>
        )}
      </div>

      {/* Preview */}
      {isExpanded && (
        <div className="mt-4 p-3 bg-ray-gray-900 rounded border border-ray-gray-800">
          <pre className="text-xs text-ray-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-48">
            {file.content.substring(0, 500)}
            {file.content.length > 500 && '\n\n... (truncated)'}
          </pre>
        </div>
      )}
    </div>
  )
}