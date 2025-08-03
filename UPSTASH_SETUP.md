# Setting Up Upstash Redis for LLMs.txt Generator

Using Upstash Redis provides intelligent caching and rate limiting for the Firecrawl API, making the system much more efficient.

## Benefits of Using Redis

1. **Content Caching**: Scraped content is cached for 7 days, avoiding unnecessary API calls
2. **Summary Caching**: Generated summaries are cached for 30 days
3. **Rate Limiting**: Proper tracking of API requests per minute
4. **Cost Savings**: Fewer Firecrawl API calls = lower costs
5. **Faster Generation**: Cached content loads instantly

## Setup Steps

### 1. Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up for a free account (10,000 commands/day free)

### 2. Create Redis Database

1. Click **"Create Database"**
2. Choose:
   - **Name**: `sidetool-llmstxt`
   - **Region**: Select closest to `us-east-1` (where your Supabase is)
   - **Type**: Regional (not Global)
3. Click **"Create"**

### 3. Get Your Credentials

After creation, you'll see:
- **UPSTASH_REDIS_REST_URL**: Something like `https://us1-xxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: A long token string

Copy both values.

### 4. Add to Supabase Environment Variables

Go to [Edge Functions Settings](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/functions) and add:

```
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token
```

Keep your existing variables:
```
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### 5. Update Your Edge Function

1. Go to [Functions Dashboard](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions)
2. Click on `generate-llmstxt`
3. Click **"Edit"**
4. Replace code with contents from `index-redis.ts`
5. Click **"Deploy"**

### 6. Test the Updated Function

```bash
curl -X POST https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4" \
  -H "Content-Type: application/json"
```

## How It Works

### First Run
1. Scrapes all URLs from Firecrawl
2. Caches content in Redis for 7 days
3. Generates summaries with OpenAI
4. Caches summaries for 30 days
5. Creates llms.txt files

### Subsequent Runs
1. Checks Redis cache first
2. Only scrapes new/expired content
3. Uses cached summaries when available
4. Much faster and uses fewer API credits

## Redis Key Structure

```
sidetool:urls              - List of URLs to process
content:[url]              - Cached page content (7 days)
summary:[url]              - Cached summary (30 days)
firecrawl:rate:minute      - Rate limit counter
sidetool:generation:count  - Total generations
sidetool:generation:latest - Last generation time
```

## Monitoring

### View Redis Data
In Upstash Console, use the Data Browser to see:
- Cached content
- Rate limit counters
- Generation statistics

### Check Cache Hit Rate
The function response includes `cached_content` count showing how many URLs were served from cache.

## Cost Analysis

### Without Redis (Daily)
- 20 URLs × 30 days = 600 Firecrawl API calls/month
- Risk of rate limiting
- Slower generation

### With Redis (Daily)
- First run: 20 API calls
- Subsequent runs: 0-5 API calls (only new content)
- Total: ~50-100 API calls/month
- 80-90% reduction in API usage

## Troubleshooting

### Redis Connection Failed
- Verify UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are set correctly
- Check Upstash dashboard for connection issues

### Cache Not Working
- Check Redis memory usage in Upstash console
- Verify keys are being created with Data Browser

### Rate Limiting Still Occurring
- Redis tracks rate limits but doesn't prevent them
- Adjust delays or reduce URLs if needed

## Alternative: Use Supabase for Caching

If you prefer not to use Upstash, you can modify the function to use Supabase tables for caching:

```sql
CREATE TABLE IF NOT EXISTS public.content_cache (
  url TEXT PRIMARY KEY,
  content TEXT,
  title TEXT,
  description TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_content_cache_expires ON public.content_cache(expires_at);
```

But Redis is recommended for better performance and automatic expiration.