-- ============================================
-- CHECK CURRENT CRON JOB STATUS
-- ============================================
-- Run these queries to see the current state of your cron jobs

-- 1. Check all existing cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;

-- 2. Check recent cron job execution history (last 20 runs)
SELECT 
  j.jobname,
  d.job_pid,
  d.database,
  d.username,
  d.command,
  d.status,
  d.return_message,
  d.start_time,
  d.end_time,
  d.end_time - d.start_time as duration
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
ORDER BY d.start_time DESC
LIMIT 20;

-- 3. Check if there are any failed jobs in the last 7 days
SELECT 
  j.jobname,
  COUNT(*) as failure_count,
  MAX(d.start_time) as last_failure
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE d.status = 'failed'
  AND d.start_time > NOW() - INTERVAL '7 days'
GROUP BY j.jobname
ORDER BY last_failure DESC;

-- 4. Check the latest generation records in your database
SELECT 
  generation_id,
  generated_at,
  file_count,
  total_size,
  status
FROM llms_generations
ORDER BY generated_at DESC
LIMIT 5;

-- 5. Check if files exist in storage for today
SELECT 
  COUNT(*) as file_count,
  SUM(size) as total_size
FROM llms_files
WHERE DATE(generated_at) = CURRENT_DATE;