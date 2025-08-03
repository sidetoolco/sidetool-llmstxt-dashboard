# Supabase Deployment Guide for Sidetool LLMs.txt Generator

This guide will help you deploy the automated LLMs.txt generator to Supabase, which will run daily and store the generated files.

## Architecture Overview

- **Edge Functions**: Serverless functions that generate the llms.txt files
- **Cron Job**: Automated daily trigger at 2 AM UTC
- **Storage**: Files are stored in Supabase Storage with public access
- **Database**: Logs and metadata are stored for tracking

## Prerequisites

1. A Supabase account (free tier works)
2. Supabase CLI installed locally
3. API keys for Firecrawl and OpenAI

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and service role key

### 2. Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 3. Configure Environment Variables

1. Copy `.env.supabase` to `.env.local`:
```bash
cp .env.supabase .env.local
```

2. Edit `.env.local` and add your values:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

### 4. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 5. Deploy Database Schema

```bash
# Run migrations
supabase db push
```

This will create:
- Storage bucket for llms files
- Database table for generation logs
- Views and policies for data access

### 6. Set Environment Variables in Supabase

Go to your Supabase Dashboard > Settings > Edge Functions and add:

```
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

### 7. Deploy Edge Functions

```bash
# Deploy the main generation function
supabase functions deploy generate-llmstxt --no-verify-jwt

# Deploy the cron trigger function
supabase functions deploy cron-trigger --no-verify-jwt
```

### 8. Configure Cron Job

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to Database > Extensions
2. Enable `pg_cron` extension
3. Go to SQL Editor and run:

```sql
-- Schedule daily generation at 2 AM UTC
SELECT cron.schedule(
  'generate-llmstxt-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/cron-trigger',
      headers := jsonb_build_object(
        'Authorization', 'Bearer your-service-role-key',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('trigger', 'scheduled')
    );
  $$
);
```

#### Option B: Using Database Webhooks

1. Go to Database > Webhooks
2. Create a new webhook that calls your edge function URL daily

### 9. Test the Setup

#### Manual Test
```bash
# Test the generation function directly
curl -X POST https://your-project.supabase.co/functions/v1/generate-llmstxt \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json"
```

#### Check Logs
```bash
# View function logs
supabase functions logs generate-llmstxt
```

## Accessing Generated Files

### Via Supabase Storage

Files are stored in the `llms-files` bucket with the structure:
```
llms-files/
  sidetool/
    2024-01-15/
      llms.txt
      llms-full.txt
    2024-01-16/
      llms.txt
      llms-full.txt
```

### Direct URLs

Files are publicly accessible at:
```
https://your-project.supabase.co/storage/v1/object/public/llms-files/sidetool/[date]/llms.txt
https://your-project.supabase.co/storage/v1/object/public/llms-files/sidetool/[date]/llms-full.txt
```

### Latest Files

To always get the latest files, query the database view:

```sql
SELECT * FROM latest_llms_generation WHERE site_url = 'https://sidetool.co';
```

## Monitoring

### View Generation History

```sql
-- All generation attempts
SELECT * FROM llms_generation_logs 
ORDER BY generated_at DESC;

-- Only successful generations
SELECT * FROM llms_generation_logs 
WHERE error_message IS NULL 
ORDER BY generated_at DESC;

-- Latest generation per site
SELECT * FROM latest_llms_generation;
```

### Check Cron Job Status

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## Troubleshooting

### Function Not Running

1. Check function logs: `supabase functions logs generate-llmstxt`
2. Verify environment variables are set
3. Check API key quotas (OpenAI and Firecrawl)

### Cron Job Not Triggering

1. Ensure pg_cron extension is enabled
2. Verify the cron schedule syntax
3. Check database logs for errors

### Storage Issues

1. Verify storage bucket exists and is public
2. Check storage policies are correctly set
3. Ensure service role key has proper permissions

## Cost Considerations

- **Supabase Free Tier**: Includes 500MB storage, 2GB bandwidth, 500K edge function invocations
- **Daily Generation**: ~30 function invocations per day (well within free tier)
- **Storage**: Each day's files are ~100KB-1MB (minimal storage usage)
- **API Costs**: OpenAI and Firecrawl API usage based on their pricing

## Customization

### Change Generation Frequency

Edit the cron schedule in the SQL:
```sql
-- Every hour
'0 * * * *'

-- Twice daily (2 AM and 2 PM)
'0 2,14 * * *'

-- Weekly on Mondays
'0 2 * * 1'
```

### Add More Sites

Modify the edge function to accept site URL as parameter:
```typescript
const { site_url = 'https://sidetool.co' } = await req.json()
```

### Adjust Max URLs

Change the `maxUrls` variable in the edge function:
```typescript
const maxUrls = 100 // Increase for more comprehensive coverage
```

## Security Notes

- Never commit service role keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor usage to prevent abuse

## Support

For issues or questions:
1. Check Supabase logs and dashboard
2. Review API provider dashboards (OpenAI, Firecrawl)
3. Ensure all migrations have been applied
4. Verify environment variables are correctly set