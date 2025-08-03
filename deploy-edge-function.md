# Deploy Edge Function to Supabase

## Option 1: CLI Deployment (Recommended)

### Step 1: Get your Supabase Access Token
1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Copy the token

### Step 2: Deploy using CLI
```bash
# Set your access token (replace with your actual token)
export SUPABASE_ACCESS_TOKEN=your-access-token-here

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gytlhmhrthpackunppjd

# Deploy the Edge Function
supabase functions deploy generate-llms-daily

# Set environment variables for the function
supabase secrets set OPENAI_API_KEY=your-openai-key-here
```

## Option 2: Manual Dashboard Deployment

### Step 1: Create Function in Dashboard
1. Go to https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions
2. Click "Create a new function"
3. Name: `generate-llms-daily`

### Step 2: Copy Function Code
Copy the entire content from `supabase/functions/generate-llms-daily/index.ts` and paste it into the function editor.

### Step 3: Set Environment Variables
In the function settings, add:
- `OPENAI_API_KEY`: Your OpenAI API key (if needed)

## Option 3: Using Docker (Alternative)

```bash
# Build and deploy using Docker
docker run --rm -v $(pwd):/app -w /app supabase/edge-runtime:v1.41.2 \
  supabase functions deploy generate-llms-daily \
  --project-ref gytlhmhrthpackunppjd
```

## Verify Deployment

After deployment, test the function:

```bash
# Test the function manually
curl -X POST 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4' \
  -H 'Content-Type: application/json'
```

## Update Cron Job

Once deployed, update your cron job (jobid 2) to use the correct URL:

```sql
-- Update the cron job command
SELECT cron.alter_job(
  2,
  command := 'select net.http_post(
    url := ''https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4"}''::jsonb
  )'
);
```

## Clean Up Duplicate Jobs

You have duplicate cron jobs. Clean them up:

```sql
-- Remove the duplicate job (keep the one at 3 AM UTC)
SELECT cron.unschedule('generate-llmstxt-daily'); -- This will remove jobid 1

-- Keep jobid 2 (3 AM UTC) and jobid 3 (cleanup)
-- Your final active jobs should be:
-- jobid 2: Daily generation at 3 AM UTC
-- jobid 3: Weekly cleanup at 2 AM UTC on Sundays
```

## Verify Everything Works

1. **Check function logs**: Supabase Dashboard → Edge Functions → generate-llms-daily → Logs
2. **Test generation**: Visit your dashboard and trigger manual generation
3. **Check database**: Verify files are created in `llms_generations` and `llms_files` tables
4. **Check storage**: Verify files appear in Storage → llms-files bucket

Your cron job will automatically run tomorrow at 3 AM UTC!