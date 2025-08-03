# 🎉 Final Setup Steps - Almost Done!

Your Edge Functions are successfully deployed! Now complete these final steps:

## ✅ Completed
- ✅ Function `generate-llmstxt` deployed
- ✅ Function `cron-trigger` deployed

## 📋 Remaining Steps

### 1. Set Environment Variables
Go to [Edge Functions Settings](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/functions) and add:

```
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Create Database Tables and Storage
Go to [SQL Editor](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new) and run this SQL:

```sql
-- Create storage bucket for llms files
INSERT INTO storage.buckets (id, name, public)
VALUES ('llms-files', 'llms-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for generation logs
CREATE TABLE IF NOT EXISTS public.llms_generation_logs (
  id BIGSERIAL PRIMARY KEY,
  site_url TEXT NOT NULL,
  urls_processed INTEGER NOT NULL DEFAULT 0,
  urls_successful INTEGER NOT NULL DEFAULT 0,
  llms_txt_path TEXT,
  llms_full_txt_path TEXT,
  error_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_site_url 
ON public.llms_generation_logs(site_url);

CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_generated_at 
ON public.llms_generation_logs(generated_at DESC);

-- Enable RLS
ALTER TABLE public.llms_generation_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" 
ON public.llms_generation_logs 
FOR SELECT 
TO public 
USING (true);

-- Allow service role full access
CREATE POLICY "Service role has full access" 
ON public.llms_generation_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create view for latest generation
CREATE OR REPLACE VIEW public.latest_llms_generation AS
SELECT DISTINCT ON (site_url) 
  id,
  site_url,
  urls_processed,
  urls_successful,
  llms_txt_path,
  llms_full_txt_path,
  error_message,
  generated_at,
  created_at
FROM public.llms_generation_logs
ORDER BY site_url, generated_at DESC;

-- Grant permissions
GRANT SELECT ON public.latest_llms_generation TO public;

-- Storage policies
CREATE POLICY "Public read access for llms files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'llms-files');

CREATE POLICY "Service role can upload llms files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'llms-files');

CREATE POLICY "Service role can update llms files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'llms-files')
WITH CHECK (bucket_id = 'llms-files');

CREATE POLICY "Service role can delete llms files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'llms-files');
```

### 3. Set Up Cron Job (Optional - for daily automation)

1. Get your service role key from [API Settings](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api)

2. Enable pg_cron extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
```

3. Create the daily job (replace YOUR_SERVICE_ROLE_KEY):
```sql
SELECT cron.schedule(
  'generate-llmstxt-daily',
  '0 2 * * *', -- Daily at 2 AM UTC
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

### 4. Test Your Setup

Get your service role key and test:

```bash
# Replace YOUR_SERVICE_ROLE_KEY with your actual key
curl -X POST https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## 📂 Access Your Generated Files

After running, your files will be available at:

- **llms.txt**: `https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/2025-01-03/llms.txt`
- **llms-full.txt**: `https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/2025-01-03/llms-full.txt`

## 📊 Monitor Generation History

- View logs: [Functions Dashboard](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions)
- View database: [Table Editor](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/editor)

## 🚀 Success!

Once you complete these steps, your automated llms.txt generator will:
- Generate fresh files for sidetool.co
- Store them in Supabase Storage with public access
- Keep a complete history of all generations
- Run automatically every day at 2 AM UTC (if cron is set up)