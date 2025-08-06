'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  animated?: boolean
  indeterminate?: boolean
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
  animated = true,
  indeterminate = false,
  className
}: ProgressBarProps) {
  const [mounted, setMounted] = useState(false)
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const variants = {
    default: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700" id="progress-label">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-500" aria-live="polite">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div 
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden relative',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={label ? 'progress-label' : undefined}
      >
        {indeterminate ? (
          /* Indeterminate progress */
          <div className={cn(
            'absolute inset-0',
            variants[variant],
            'animate-indeterminate'
          )} />
        ) : (
          /* Determinate progress */
          <div
            className={cn(
              'h-full transition-all ease-out',
              variants[variant],
              animated && mounted && 'duration-500',
              !mounted && 'duration-0'
            )}
            style={{ 
              width: mounted ? `${percentage}%` : '0%',
              transform: 'translateZ(0)' // Hardware acceleration
            }}
          >
            {/* Animated shimmer effect */}
            {animated && percentage > 0 && percentage < 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>
        )}
      </div>

      {/* Detailed status for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {indeterminate 
          ? 'Loading in progress' 
          : `Progress: ${Math.round(percentage)}% complete`}
      </div>
    </div>
  )
}