# Supabase Migration Guide

The LLMs.txt generator has been migrated from GitHub Actions to Supabase for better performance, persistence, and cost efficiency.

## 🚀 Migration Benefits

### Before (GitHub Actions):
- ❌ Files stored in git (repository bloat)
- ❌ Limited to 2000 minutes/month
- ❌ No persistent storage
- ❌ Complex file serving

### After (Supabase):
- ✅ Files stored in Supabase Storage (CDN)
- ✅ Database tracking with full history
- ✅ Real-time dashboard updates  
- ✅ Unlimited cron execution
- ✅ Better scalability

## 📋 Setup Instructions

### 1. Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login and create project
supabase login
supabase init
supabase link --project-ref your-project-ref
```

### 2. Run Database Migrations
```bash
# Apply the database schema
supabase db push

# Or manually run the migrations
psql -h db.your-project.supabase.co -p 5432 -d postgres -U postgres -f supabase/migrations/001_create_llms_tables.sql
psql -h db.your-project.supabase.co -p 5432 -d postgres -U postgres -f supabase/migrations/002_setup_cron.sql
```

### 3. Deploy Edge Function
```bash
# Deploy the generation function
supabase functions deploy generate-llms-daily

# Set environment variables
supabase secrets set OPENAI_API_KEY=your-key-here
```

### 4. Configure Environment Variables

In your Vercel dashboard, add:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Update Cron Job URLs
In `supabase/migrations/002_setup_cron.sql`, replace:
- `your-project.supabase.co` with your actual Supabase URL
- `your-service-role-key` with your actual service role key

### 6. Enable Required Extensions
In your Supabase dashboard's SQL editor:
```sql
-- Enable cron jobs
create extension if not exists pg_cron;

-- Enable HTTP requests
create extension if not exists http;
```

## 🔧 How It Works

### Daily Generation Flow:
1. **Supabase pg_cron** triggers at 3 AM UTC daily
2. **Edge Function** (`generate-llms-daily`) executes
3. **Files generated** for each blog post and topic collection
4. **Stored in Supabase Storage** with public CDN access
5. **Metadata saved** to `llms_generations` and `llms_files` tables
6. **Dashboard automatically updates** with new files

### File Storage Structure:
```
supabase-storage/llms-files/
├── daily/
│   ├── 2025-01-15/
│   │   ├── llms.txt
│   │   ├── llms-full.txt
│   │   ├── llms-building-better-developer-tools-2025.txt
│   │   └── llms-topic-ai-development.txt
│   └── 2025-01-16/
│       └── ...
```

## 📊 Database Schema

### Tables:
- **`llms_generations`**: Tracks each daily generation run
- **`llms_files`**: Individual file metadata and content
- **`llms_latest_generation`**: View for latest completed generation
- **`llms_file_stats`**: Statistics by file category

### Functions:
- **`get_latest_llms_files()`**: Returns latest files with storage URLs
- **`cleanup_old_generations()`**: Removes files older than 30 days

## 🎯 API Endpoints

### Dashboard APIs:
- **`/api/supabase-files`** (GET): Fetch latest files from Supabase
- **`/api/supabase-files`** (POST): Trigger manual generation
- **`/api/files`** (GET): Local fallback generation
- **`/api/daily-recommendation`** (GET): Original mock data fallback

### Fallback Chain:
1. Supabase database → 
2. Local file generation → 
3. Original mock data

## 🔐 Security Features

- **Row Level Security (RLS)** enabled
- **Public read access** to completed generations only
- **Service role** full access for cron jobs
- **Storage policies** for public file access

## 🧹 Maintenance

### Cleanup Old Files:
```sql
-- Manual cleanup (runs automatically weekly)
select cleanup_old_generations();
```

### Monitor Cron Jobs:
```sql
-- Check scheduled jobs
select * from cron.job;

-- Check job run history
select * from cron.job_run_details 
order by start_time desc limit 10;
```

### View Generation Stats:
```sql
-- Latest generation info
select * from llms_latest_generation;

-- File statistics by category
select * from llms_file_stats;

-- Recent generations
select * from llms_generations 
order by generated_at desc limit 10;
```

## 🚀 Benefits Realized

1. **Cost**: No more GitHub Actions minutes consumption
2. **Storage**: Persistent database + CDN storage
3. **Performance**: Faster file serving via Supabase CDN
4. **Reliability**: Database-backed with automatic backups
5. **Scalability**: Easy to add user accounts, custom schedules
6. **Monitoring**: Full generation history and statistics
7. **Real-time**: Dashboard updates immediately when new files are generated

## 🔄 Rollback Plan

If needed, the GitHub Actions workflow is still available:
- `.github/workflows/daily-multiple-llms-generation.yml`
- Can be re-enabled by updating cron schedule
- Files would revert to git storage

## 📞 Support

Check these if issues occur:
- Supabase function logs: Project Dashboard → Edge Functions
- Database logs: Project Dashboard → Logs
- Cron job status: `select * from cron.job_run_details`
- Storage bucket permissions: Project Dashboard → Storage