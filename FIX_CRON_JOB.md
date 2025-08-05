# Fix Supabase Cron Job for LLMs.txt Generation

## Issue Summary
The cron job is not triggering properly to generate LLMs.txt files. The system is already set up to use Supabase Edge Functions instead of GitHub Actions, but the cron job needs to be properly configured.

## Solution Steps

### 1. Get Your Service Role Key
1. Go to: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api
2. Copy the `service_role` key (keep it secret!)
3. This key is needed for the cron job to authenticate with the Edge Function

### 2. Deploy the Edge Function (if not already deployed)
```bash
# From the project root directory
cd /Users/edescobar/Code/sidetool-llmstxt-generator

# Deploy the Edge Function
supabase functions deploy generate-llms-daily

# Set the required secrets
supabase secrets set OPENAI_API_KEY=your-openai-key-here
supabase secrets set VERCEL_APP_URL=https://sidetool-llmstxt-dashboard.vercel.app
```

### 3. Configure the Cron Job
1. Open the Supabase SQL Editor: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new
2. Copy the contents of `setup-supabase-cron.sql`
3. Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key
4. Run the SQL script

### 4. Test the Edge Function Manually
To test if everything is working, run this in the SQL editor:
```sql
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual',
      'source', 'sql_test'
    )
  );
```

### 5. Verify the Setup
After running the test, check:
1. **Edge Function Logs**: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions/generate-llms-daily/logs
2. **Database Records**: 
   ```sql
   -- Check latest generation
   SELECT * FROM llms_generations ORDER BY generated_at DESC LIMIT 1;
   
   -- Check generated files
   SELECT * FROM llms_files ORDER BY generated_at DESC LIMIT 10;
   ```
3. **Storage Files**: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/storage/buckets/llms-files

### 6. Monitor Cron Job Execution
The cron job will run daily at 3 AM UTC. To check if it's running:
```sql
-- View cron job details
SELECT * FROM cron.job WHERE jobname = 'generate-llms-daily';

-- Check recent executions (after it runs)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-llms-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

## What the System Does

1. **Daily at 3 AM UTC**: Supabase pg_cron triggers the Edge Function
2. **Edge Function generates**:
   - Main collection files (`llms.txt`, `llms-full.txt`)
   - Topic collection files (AI Development, No-Code, etc.)
   - Individual blog post files
3. **Files are stored** in Supabase Storage with CDN access
4. **Metadata saved** to database for tracking
5. **Email notification** sent via Resend API
6. **Dashboard updates** automatically with new files

## Troubleshooting

### If the cron job doesn't run:
1. Check if pg_cron extension is enabled
2. Verify the service role key is correct
3. Check Edge Function deployment status
4. Look at cron job error logs in `cron.job_run_details`

### If files aren't generated:
1. Check Edge Function logs for errors
2. Verify environment variables are set
3. Check if the function has required permissions
4. Test the function manually first

### If the dashboard doesn't update:
1. Check if files are in Supabase Storage
2. Verify database records were created
3. Check the dashboard API endpoints
4. Look at Vercel function logs

## GitHub Workflows (Disabled)
The GitHub workflows have been disabled and moved to `.github/workflows-disabled/` since we're fully using Supabase now. There's no need to maintain both systems.