import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Performance monitoring utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  budgetMs: number = 50
): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  if (duration > budgetMs) {
    console.warn(`Performance budget exceeded: ${name} took ${duration.toFixed(2)}ms (budget: ${budgetMs}ms)`)
  }
  
  // Send to analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'timing_complete', {
      name,
      value: Math.round(duration),
      event_category: 'Performance'
    })
  }
  
  return result
}

// Debounce for performance
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Throttle for performance
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Format bytes with performance consideration
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Local storage with performance optimization
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  }
}

// Optimistic update helper
export function optimisticUpdate<T>(
  currentData: T[],
  update: Partial<T>,
  idKey: keyof T = 'id' as keyof T
): T[] {
  return currentData.map(item =>
    item[idKey] === update[idKey] ? { ...item, ...update } : item
  )
}

// Prefetch helper for performance
export function prefetch(url: string): void {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  document.head.appendChild(link)
}

// Intersection observer for lazy loading
export function lazyLoad(
  selector: string,
  callback: (element: Element) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined') return null
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, options)
  
  document.querySelectorAll(selector).forEach(el => {
    observer.observe(el)
  })
  
  return observer
}