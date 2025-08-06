import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Check if Redis is configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Initialize Redis client only if configured
export const redis = isRedisConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null

// Create rate limiter for API calls
// Allow 10 requests per 10 seconds per user
export const rateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@sidegso/ratelimit',
}) : {
  limit: async () => ({ success: true, limit: 10, remaining: 10, reset: Date.now() })
}

// Create rate limiter for Firecrawl API
// Allow 5 requests per minute to avoid overloading
export const firecrawlRateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@sidegso/firecrawl',
}) : {
  limit: async () => ({ success: true, limit: 5, remaining: 5, reset: Date.now() })
}

// Job queue functions
export async function addJobToQueue(jobId: string, urls: string[]) {
  if (!redis) {
    console.warn('Redis not configured - skipping queue')
    return 0
  }
  
  const queueKey = `queue:${jobId}`
  
  // Add all URLs to the queue
  for (const url of urls) {
    await redis.rpush(queueKey, url)
  }
  
  // Set expiry for 24 hours
  await redis.expire(queueKey, 86400)
  
  return urls.length
}

export async function getNextUrlFromQueue(jobId: string): Promise<string | null> {
  if (!redis) return null
  
  const queueKey = `queue:${jobId}`
  const url = await redis.lpop(queueKey)
  return url as string | null
}

export async function getQueueLength(jobId: string): Promise<number> {
  if (!redis) return 0
  
  const queueKey = `queue:${jobId}`
  const length = await redis.llen(queueKey)
  return length || 0
}

export async function setJobStatus(jobId: string, status: any) {
  if (!redis) return
  
  const statusKey = `status:${jobId}`
  await redis.set(statusKey, JSON.stringify(status))
  await redis.expire(statusKey, 86400) // 24 hours
}

export async function getJobStatus(jobId: string) {
  if (!redis) return null
  
  const statusKey = `status:${jobId}`
  const status = await redis.get(statusKey)
  return status ? JSON.parse(status as string) : null
}