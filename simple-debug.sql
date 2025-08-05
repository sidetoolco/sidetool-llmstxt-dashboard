-- ============================================
-- SIMPLE DEBUG QUERIES
-- ============================================

-- 1. Check latest generation (if any)
SELECT * FROM llms_generations 
ORDER BY generated_at DESC 
LIMIT 5;

-- 2. Check latest files
SELECT file_name, category, generated_at, size 
FROM llms_files 
ORDER BY generated_at DESC 
LIMIT 10;

-- 3. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'llms%';

-- 4. Test Edge Function with your service role key
-- Replace YOUR_SERVICE_ROLE_KEY with your actual key
/*
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual-test',
      'timestamp', NOW()::text
    )
  );
*/