-- ============================================
-- CHECK DATA AND TEST EDGE FUNCTION
-- ============================================

-- 1. Check if there's any generation data at all
SELECT COUNT(*) as total_generations FROM llms_generations;

-- 2. Check latest generation
SELECT 
  generation_id,
  generated_at,
  file_count,
  total_size,
  status
FROM llms_generations 
ORDER BY generated_at DESC 
LIMIT 5;

-- 3. Check if there are any files
SELECT COUNT(*) as total_files FROM llms_files;

-- 4. Check latest files
SELECT 
  file_name,
  category,
  generated_at,
  size
FROM llms_files 
ORDER BY generated_at DESC 
LIMIT 5;

-- 5. Check generation logs (if any)
SELECT 
  site_url,
  urls_processed,
  generated_at,
  error_message
FROM llms_generation_logs 
ORDER BY generated_at DESC 
LIMIT 5;

-- 6. Test the Edge Function
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- Get it from: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual-sql-test',
      'source', 'sql-editor',
      'timestamp', NOW()::text
    )
  ) as edge_function_response;