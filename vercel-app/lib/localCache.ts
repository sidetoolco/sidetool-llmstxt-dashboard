// Local-first data caching with IndexedDB
import { storage } from './utils'

const DB_NAME = 'SideGSOCache'
const DB_VERSION = 1
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
}

class LocalCache {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.dbPromise) return this.dbPromise
    
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores for different data types
        if (!db.objectStoreNames.contains('jobs')) {
          db.createObjectStore('jobs', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' })
          filesStore.createIndex('job_id', 'job_id', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('urls')) {
          const urlsStore = db.createObjectStore('urls', { keyPath: 'id' })
          urlsStore.createIndex('job_id', 'job_id', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
    
    return this.dbPromise
  }
  
  async get<T>(store: string, key: string): Promise<T | null> {
    const db = await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.get(key)
      
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        
        if (!entry) {
          resolve(null)
          return
        }
        
        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_DURATION) {
          this.delete(store, key)
          resolve(null)
          return
        }
        
        resolve(entry.data)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async set<T>(store: string, key: string, data: T): Promise<void> {
    const db = await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
      }
      
      const request = objectStore.put({ ...entry.data, id: key })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async delete(store: string, key: string): Promise<void> {
    const db = await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getByIndex<T>(store: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const index = objectStore.index(indexName)
      const request = index.getAll(value)
      
      request.onsuccess = () => {
        const results = request.result as CacheEntry<T>[]
        const validResults = results.filter(entry => 
          Date.now() - entry.timestamp <= CACHE_DURATION
        )
        resolve(validResults.map(entry => entry.data))
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async clear(): Promise<void> {
    const db = await this.init()
    const stores = ['jobs', 'files', 'urls', 'metadata']
    
    for (const store of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([store], 'readwrite')
        const objectStore = transaction.objectStore(store)
        const request = objectStore.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }
  
  // Sync with remote data
  async sync<T>(
    store: string,
    key: string,
    fetcher: () => Promise<T>,
    options: { forceRefresh?: boolean } = {}
  ): Promise<T> {
    if (!options.forceRefresh) {
      const cached = await this.get<T>(store, key)
      if (cached) return cached
    }
    
    const data = await fetcher()
    await this.set(store, key, data)
    return data
  }
}

// Singleton instance
export const localCache = new LocalCache()

// React hooks for local-first data
import { useEffect, useState } from 'react'

export function useLocalFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { 
    store?: string
    dependencies?: any[]
    staleTime?: number 
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)
  
  const store = options.store || 'metadata'
  const deps = options.dependencies || []
  
  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Try to get from cache first
        const cached = await localCache.get<T>(store, key)
        
        if (cached && !cancelled) {
          setData(cached)
          setLoading(false)
          
          // Check if data is stale
          if (options.staleTime) {
            const metadata = await localCache.get<{ timestamp: number }>('metadata', `${key}_meta`)
            if (metadata && Date.now() - metadata.timestamp > options.staleTime) {
              setIsStale(true)
            }
          }
        }
        
        // Fetch fresh data
        const fresh = await fetcher()
        
        if (!cancelled) {
          setData(fresh)
          await localCache.set(store, key, fresh)
          await localCache.set('metadata', `${key}_meta`, { timestamp: Date.now() })
          setIsStale(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
          
          // If fetch fails, try to use cached data
          const cached = await localCache.get<T>(store, key)
          if (cached) {
            setData(cached)
            setIsStale(true)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [key, store, ...deps])
  
  const refresh = async () => {
    setLoading(true)
    try {
      const fresh = await fetcher()
      setData(fresh)
      await localCache.set(store, key, fresh)
      await localCache.set('metadata', `${key}_meta`, { timestamp: Date.now() })
      setIsStale(false)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, error, isStale, refresh }
}

// Optimistic updates with rollback
export function useOptimisticUpdate<T>(
  key: string,
  store: string = 'metadata'
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  
  const update = async (
    newData: T,
    serverUpdate: () => Promise<T>,
    options: { rollbackOnError?: boolean } = { rollbackOnError: true }
  ) => {
    // Save current state for rollback
    const previousData = await localCache.get<T>(store, key)
    
    // Apply optimistic update
    setOptimisticData(newData)
    await localCache.set(store, key, newData)
    
    try {
      // Perform server update
      const serverData = await serverUpdate()
      
      // Update with server response
      setOptimisticData(serverData)
      await localCache.set(store, key, serverData)
      
      return serverData
    } catch (error) {
      if (options.rollbackOnError && previousData) {
        // Rollback on error
        setOptimisticData(previousData)
        await localCache.set(store, key, previousData)
      }
      throw error
    }
  }
  
  return { optimisticData, update }
}