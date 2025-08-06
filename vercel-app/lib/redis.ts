import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter for API calls
// Allow 10 requests per 10 seconds per user
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@sidegso/ratelimit',
})

// Create rate limiter for Firecrawl API
// Allow 5 requests per minute to avoid overloading
export const firecrawlRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@sidegso/firecrawl',
})

// Job queue functions
export async function addJobToQueue(jobId: string, urls: string[]) {
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
  const queueKey = `queue:${jobId}`
  const url = await redis.lpop(queueKey)
  return url as string | null
}

export async function getQueueLength(jobId: string): Promise<number> {
  const queueKey = `queue:${jobId}`
  const length = await redis.llen(queueKey)
  return length || 0
}

export async function setJobStatus(jobId: string, status: any) {
  const statusKey = `status:${jobId}`
  await redis.set(statusKey, JSON.stringify(status))
  await redis.expire(statusKey, 86400) // 24 hours
}

export async function getJobStatus(jobId: string) {
  const statusKey = `status:${jobId}`
  const status = await redis.get(statusKey)
  return status ? JSON.parse(status as string) : null
}