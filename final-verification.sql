-- ============================================
-- FINAL VERIFICATION - EVERYTHING IS WORKING!
-- ============================================

-- 1. Check the cron job that triggered at ~3 AM UTC
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE schedule = '0 3 * * *' 
   OR schedule LIKE '%3%*%*%*%';

-- 2. Check successful runs from around 3 AM UTC today
SELECT 
  j.jobname,
  d.status,
  d.start_time,
  d.end_time,
  d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE DATE(d.start_time) = CURRENT_DATE
  AND EXTRACT(HOUR FROM d.start_time) BETWEEN 2 AND 4
ORDER BY d.start_time DESC;

-- 3. Summary of today's generation
SELECT 
  'Total Files' as metric,
  COUNT(*)::text as value
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE
UNION ALL
SELECT 
  'Total Size (KB)' as metric,
  ROUND(SUM(size)/1024.0, 2)::text as value
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE
UNION ALL
SELECT 
  'Generation Time' as metric,
  MIN(generated_at)::text as value
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE;

-- 4. Files by category
SELECT 
  category,
  COUNT(*) as file_count,
  ROUND(SUM(size)/1024.0, 2) as size_kb
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE
GROUP BY category
ORDER BY category;