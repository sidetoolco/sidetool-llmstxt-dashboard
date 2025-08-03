# 🚀 Quick Deployment Steps for Your Supabase Project

Your Supabase project is ready at: **https://gytlhmhrthpackunppjd.supabase.co**

## ⚠️ IMPORTANT: Get Your Service Role Key First

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/api)
2. Navigate to **Settings > API**
3. Copy the **Service Role Key** (under "Project API keys")
4. Update `.env.local` with this key

## 📦 Step 1: Install Dependencies

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase

# Install project dependencies
npm install

# IMPORTANT: Install and start Docker Desktop (required for functions)
# Download from: https://www.docker.com/products/docker-desktop/
# Or via Homebrew:
brew install --cask docker
open /Applications/Docker.app
```

## 🔗 Step 2: Link Your Project

```bash
supabase link --project-ref gytlhmhrthpackunppjd
```

## 🗄️ Step 3: Deploy Database Schema

```bash
# Push the database migrations
supabase db push
```

This creates:
- Storage bucket `llms-files`
- Table `llms_generation_logs`
- Views and RLS policies

## 🔑 Step 4: Set Environment Variables

Go to your [Supabase Dashboard Environment Variables](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/settings/functions) and add:

```
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

## 🚀 Step 5: Deploy Edge Functions

```bash
# Deploy the main generation function
supabase functions deploy generate-llmstxt --no-verify-jwt

# Deploy the cron trigger function  
supabase functions deploy cron-trigger --no-verify-jwt
```

## ⏰ Step 6: Set Up Daily Cron Job

1. Go to [SQL Editor](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/sql/new)
2. Run this SQL to enable pg_cron:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

3. Then run this to create the daily job (replace YOUR_SERVICE_ROLE_KEY):

```sql
SELECT cron.schedule(
  'generate-llmstxt-daily',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/cron-trigger',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('trigger', 'scheduled')
    );
  $$
);
```

## 🧪 Step 7: Test Your Setup

### Test the function manually:
```bash
# Make sure to update .env.local with your service role key first
source .env.local

curl -X POST https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Check function logs:
```bash
supabase functions logs generate-llmstxt
```

## 📂 Step 8: Access Your Generated Files

Your files will be available at:

- **llms.txt**: https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[YYYY-MM-DD]/llms.txt
- **llms-full.txt**: https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/[YYYY-MM-DD]/llms-full.txt

Example for today's date:
- https://gytlhmhrthpackunppjd.supabase.co/storage/v1/object/public/llms-files/sidetool/2025-01-03/llms.txt

## 📊 Monitor Your Generation History

Go to [Table Editor](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/editor) and view:
- `llms_generation_logs` - All generation attempts
- `latest_llms_generation` - Most recent successful generation

## 🔧 Troubleshooting

### If the function fails:
1. Check logs: `supabase functions logs generate-llmstxt`
2. Verify environment variables are set in dashboard
3. Check API key quotas (OpenAI/Firecrawl)
4. Ensure service role key is correct

### If files aren't accessible:
1. Check Storage bucket exists and is public
2. Verify the generation completed successfully in logs

## 🎉 Success!

Your automated llms.txt generator is now running on Supabase! It will:
- Generate fresh files daily at 2 AM UTC
- Store them with date-based organization
- Keep a complete history of all generations
- Provide public URLs for easy access