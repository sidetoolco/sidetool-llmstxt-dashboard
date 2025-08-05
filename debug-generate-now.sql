-- ============================================
-- DEBUG GENERATE NOW BUTTON ISSUE
-- ============================================
-- Run these queries to diagnose the problem

-- 1. Check if any generation happened in the last hour
SELECT 
  generation_id,
  generated_at,
  file_count,
  total_size,
  status
FROM llms_generations
WHERE generated_at > NOW() - INTERVAL '1 hour'
ORDER BY generated_at DESC;

-- 2. Check if Edge Function was called recently
SELECT 
  j.jobname,
  d.status,
  d.return_message,
  d.start_time,
  d.end_time
FROM cron.job_run_details d
LEFT JOIN cron.job j ON j.jobid = d.jobid
WHERE d.start_time > NOW() - INTERVAL '1 hour'
ORDER BY d.start_time DESC
LIMIT 10;

-- 3. Check if files were created today after the cron job
SELECT 
  file_name,
  category,
  generated_at,
  size
FROM llms_files
WHERE generated_at > CURRENT_DATE + INTERVAL '3 hours'
ORDER BY generated_at DESC
LIMIT 10;

-- 4. Test the Edge Function directly (replace YOUR_SERVICE_ROLE_KEY)
/*
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual-debug',
      'source', 'sql_debug',
      'timestamp', NOW()::text
    )
  );
*/

-- 5. Check if the storage bucket has proper permissions
SELECT 
  name,
  id,
  public,
  created_at
FROM storage.buckets
WHERE name = 'llms-files';

-- 6. Check storage policies
SELECT 
  name,
  action,
  definition
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';