'use client'

import { useEffect, useState } from 'react'
import { measurePerformance } from '@/lib/utils'

interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  inp: number // Interaction to Next Paint
}

export function PerformanceMonitor({ showInProduction = false }: { showInProduction?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    inp: 0
  })
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && !showInProduction) {
      return
    }
    
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcp) {
          setMetrics(prev => ({ ...prev, fcp: fcp.startTime }))
        }
      })
      
      try {
        fcpObserver.observe({ type: 'paint', buffered: true })
      } catch (e) {
        // Some browsers don't support this
      }
      
      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
        }
      })
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (e) {
        // Some browsers don't support this
      }
      
      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime
            setMetrics(prev => ({ ...prev, fid: Math.max(prev.fid, fid) }))
          }
        })
      })
      
      try {
        fidObserver.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        // Some browsers don't support this
      }
      
      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            setMetrics(prev => ({ ...prev, cls: clsValue }))
          }
        })
      })
      
      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        // Some browsers don't support this
      }
      
      // TTFB
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart
        setMetrics(prev => ({ ...prev, ttfb }))
      }
      
      return () => {
        fcpObserver.disconnect()
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [showInProduction])
  
  // Keyboard shortcut to toggle display
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShow(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  if (!show) return null
  
  const getScoreColor = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.needs) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Performance Metrics</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getScoreColor(metrics.fcp, { good: 1800, needs: 3000 })}>
            {metrics.fcp.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getScoreColor(metrics.lcp, { good: 2500, needs: 4000 })}>
            {metrics.lcp.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getScoreColor(metrics.fid, { good: 100, needs: 300 })}>
            {metrics.fid.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getScoreColor(metrics.cls * 1000, { good: 100, needs: 250 })}>
            {metrics.cls.toFixed(3)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getScoreColor(metrics.ttfb, { good: 800, needs: 1800 })}>
            {metrics.ttfb.toFixed(0)}ms
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

// Hook to measure component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // More than one frame (60fps = 16.67ms per frame)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`)
      }
      
      // Send to analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'component_render', {
          component: componentName,
          render_time: Math.round(renderTime),
          event_category: 'Performance'
        })
      }
    }
  }, [componentName])
}