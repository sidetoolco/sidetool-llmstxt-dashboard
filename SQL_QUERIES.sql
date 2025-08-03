-- ============================================
-- SUPABASE SQL QUERIES FOR LLMS.TXT GENERATOR
-- ============================================
-- Run these queries in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new
-- ============================================

-- 1. CREATE STORAGE BUCKET FOR FILES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('llms-files', 'llms-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE DATABASE TABLE FOR LOGS
-- ============================================
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

-- 3. CREATE INDEXES FOR FASTER QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_site_url 
ON public.llms_generation_logs(site_url);

CREATE INDEX IF NOT EXISTS idx_llms_generation_logs_generated_at 
ON public.llms_generation_logs(generated_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.llms_generation_logs ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- ============================================
-- Allow public read access to logs
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

-- 6. CREATE VIEW FOR LATEST GENERATION
-- ============================================
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

-- Grant permissions on the view
GRANT SELECT ON public.latest_llms_generation TO public;

-- 7. CREATE STORAGE POLICIES
-- ============================================
-- Allow public read access to files
CREATE POLICY "Public read access for llms files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'llms-files');

-- Allow service role to upload files
CREATE POLICY "Service role can upload llms files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'llms-files');

-- Allow service role to update files
CREATE POLICY "Service role can update llms files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'llms-files')
WITH CHECK (bucket_id = 'llms-files');

-- Allow service role to delete files
CREATE POLICY "Service role can delete llms files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'llms-files');

-- ============================================
-- OPTIONAL: CRON JOB SETUP (Run these separately)
-- ============================================

-- 8. ENABLE PG_CRON EXTENSION (Run this first)
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- 9. ENABLE PG_NET EXTENSION (Required for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 10. CREATE CRON JOB FOR DAILY GENERATION
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- Get it from: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api
/*
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
*/

-- ============================================
-- USEFUL QUERIES TO CHECK YOUR SETUP
-- ============================================

-- Check if storage bucket was created:
SELECT * FROM storage.buckets WHERE id = 'llms-files';

-- Check if table was created:
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'llms_generation_logs';

-- View all generation logs:
SELECT * FROM llms_generation_logs ORDER BY generated_at DESC;

-- View latest successful generation:
SELECT * FROM latest_llms_generation WHERE error_message IS NULL;

-- Check scheduled cron jobs (after setting up cron):
-- SELECT * FROM cron.job;

-- Check cron job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;