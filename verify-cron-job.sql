-- ============================================
-- VERIFY CRON JOB AND RECENT RUNS
-- ============================================

-- 1. Check if the cron job exists
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname LIKE '%llms%' OR jobname LIKE '%generate%';

-- 2. If no results above, check ALL cron jobs
SELECT * FROM cron.job;

-- 3. Check today's generation details
SELECT 
  generation_id,
  generated_at,
  file_count,
  total_size,
  status
FROM llms_generations
WHERE DATE(generated_at) = CURRENT_DATE
ORDER BY generated_at DESC;

-- 4. Check when the last successful generation was
SELECT 
  generation_id,
  generated_at,
  file_count,
  total_size,
  status
FROM llms_generations
WHERE status = 'completed'
ORDER BY generated_at DESC
LIMIT 5;

-- 5. Check if Edge Function was called today
SELECT 
  file_name,
  category,
  generated_at
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE
ORDER BY generated_at DESC
LIMIT 10;