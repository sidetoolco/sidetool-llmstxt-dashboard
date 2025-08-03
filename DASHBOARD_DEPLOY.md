# Deploy Functions via Supabase Dashboard

Since the CLI deployment is having issues, here's how to deploy directly through the dashboard:

## Step 1: Create generate-llmstxt Function

1. Go to [Functions in Dashboard](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions)
2. Click **"New Function"**
3. Name: `generate-llmstxt`
4. Click **"Create Function"**
5. Replace the default code with the contents from `supabase/functions/generate-llmstxt/index.ts`
6. Click **"Deploy"**

## Step 2: Create cron-trigger Function

1. Click **"New Function"** again
2. Name: `cron-trigger`
3. Click **"Create Function"**
4. Replace the default code with the contents from `supabase/functions/cron-trigger/index.ts`
5. Click **"Deploy"**

## Step 3: Set Environment Variables

1. Go to [Edge Functions Settings](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/functions)
2. Add these environment variables:
   ```
   FIRECRAWL_API_KEY=your-firecrawl-api-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   ```

## Step 4: Create Database Tables

1. Go to [SQL Editor](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new)
2. Copy and run the contents of `supabase/migrations/001_create_llms_tables.sql`
3. This creates:
   - Storage bucket for files
   - Database tables for logs
   - Necessary policies

## Step 5: Set Up Cron Job

1. Still in SQL Editor, run:
   ```sql
   -- Enable pg_cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. Get your service role key from [API Settings](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api)

3. Run this SQL (replace YOUR_SERVICE_ROLE_KEY):
   ```sql
   SELECT cron.schedule(
     'generate-llmstxt-daily',
     '0 2 * * *',
     $$
     SELECT
       net.http_post(
         url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/cron-trigger',
         headers := jsonb_build_object(
           'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
           'Content-Type', 'application/json'
         ),
         body := jsonb_build_object('trigger', 'scheduled')
       );
     $$
   );
   ```

## Step 6: Test Your Setup

Test the function manually using your service role key:

```bash
curl -X POST https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Check Function Logs

Go to [Functions Logs](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions) to monitor execution.

## Access Generated Files

Your files will be at:
- https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[YYYY-MM-DD]/llms.txt
- https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[YYYY-MM-DD]/llms-full.txt