-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Schedule daily LLMs generation at 3 AM UTC
select cron.schedule(
  'generate-llms-daily',
  '0 3 * * *', -- 3 AM UTC daily
  $$select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-llms-daily',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb
  )$$
);

-- Schedule cleanup of old generations every week at 2 AM UTC on Sundays
select cron.schedule(
  'cleanup-old-generations',
  '0 2 * * 0', -- 2 AM UTC on Sundays
  'select cleanup_old_generations();'
);

-- Check scheduled jobs
select * from cron.job;