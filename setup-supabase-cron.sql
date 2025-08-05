-- ============================================
-- SETUP SUPABASE CRON JOB FOR LLMS GENERATION
-- ============================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new
-- ============================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- 2. Remove any existing cron jobs for LLMs generation
SELECT cron.unschedule('generate-llms-daily') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-llms-daily'
);

-- 3. Create the cron job to call the Edge Function
-- IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY' with your actual service role key
-- Get it from: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api
SELECT cron.schedule(
  'generate-llms-daily',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'trigger', 'scheduled',
        'source', 'pg_cron'
      )
    );
  $$
);

-- 4. Verify the cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'generate-llms-daily';

-- 5. Optional: Test the Edge Function manually
-- You can run this to test if the function works:
/*
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual',
      'source', 'sql_test'
    )
  );
*/

-- 6. View recent cron job executions (after it runs)
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-llms-daily')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- Check if extensions are enabled:
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- Check all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- Check recent job runs for all jobs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Check if the Edge Function exists and is deployed:
-- The function should be visible at:
-- https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions