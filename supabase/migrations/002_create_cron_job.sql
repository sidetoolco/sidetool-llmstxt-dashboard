-- Create a cron job to run daily at 2 AM UTC
-- This uses pg_cron extension which needs to be enabled in Supabase

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on pg_cron to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job
-- Note: In Supabase, you'll need to configure this through the Dashboard
-- Go to Database > Extensions and enable pg_cron
-- Then go to SQL Editor and run:

SELECT cron.schedule(
  'generate-llmstxt-daily', -- Job name
  '0 2 * * *', -- Cron expression: Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-trigger',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'trigger', 'scheduled',
        'time', now()
      )
    );
  $$
);

-- To view scheduled jobs
-- SELECT * FROM cron.job;

-- To remove the job (if needed)
-- SELECT cron.unschedule('generate-llmstxt-daily');

-- Alternative: Create a function that can be called manually or by cron
CREATE OR REPLACE FUNCTION public.trigger_llms_generation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  supabase_url text;
  service_key text;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Make HTTP request to edge function
  SELECT content::jsonb INTO result
  FROM http((
    'POST',
    supabase_url || '/functions/v1/generate-llmstxt',
    ARRAY[http_header('Authorization', 'Bearer ' || service_key)],
    'application/json',
    '{}'::jsonb
  )::http_request);
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (optional)
GRANT EXECUTE ON FUNCTION public.trigger_llms_generation() TO authenticated;

-- Create a simpler cron job that calls the function
-- This is an alternative approach that doesn't require net.http_post
SELECT cron.schedule(
  'generate-llmstxt-daily-simple',
  '0 2 * * *',
  'SELECT public.trigger_llms_generation();'
);