'use client'

import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  type?: 'text' | 'card' | 'avatar' | 'button' | 'input'
  animate?: boolean
}

export default function LoadingSkeleton({ 
  className,
  lines = 1,
  type = 'text',
  animate = true
}: LoadingSkeletonProps) {
  const baseClass = cn(
    'bg-gray-200 rounded',
    animate && 'animate-pulse',
    className
  )

  if (type === 'avatar') {
    return (
      <div className={cn(baseClass, 'w-10 h-10 rounded-full', className)} />
    )
  }

  if (type === 'button') {
    return (
      <div className={cn(baseClass, 'h-10 w-24', className)} />
    )
  }

  if (type === 'input') {
    return (
      <div className={cn(baseClass, 'h-12 w-full', className)} />
    )
  }

  if (type === 'card') {
    return (
      <div className={cn('p-4 border border-gray-200 rounded-lg', className)}>
        <div className={cn(baseClass, 'h-4 w-3/4 mb-3')} />
        <div className={cn(baseClass, 'h-3 w-full mb-2')} />
        <div className={cn(baseClass, 'h-3 w-5/6')} />
      </div>
    )
  }

  // Text skeleton with multiple lines
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClass,
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// Composite skeleton for complex layouts
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LoadingSkeleton type="avatar" />
            <LoadingSkeleton className="h-6 w-32" />
          </div>
          <LoadingSkeleton type="button" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Input section */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <LoadingSkeleton className="h-6 w-48 mb-4" />
          <LoadingSkeleton type="input" className="mb-4" />
          <div className="flex gap-4">
            <LoadingSkeleton type="button" className="w-32" />
            <LoadingSkeleton type="button" className="w-32" />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <LoadingSkeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <LoadingSkeleton className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}