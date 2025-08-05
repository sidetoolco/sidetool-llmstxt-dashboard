# GitHub Workflows Disabled

The GitHub workflows for LLMs.txt generation have been disabled and moved to `.github/workflows-disabled/`.

## Why Disabled?

The project has migrated to Supabase for cron job scheduling and file generation because:

1. **No GitHub Actions minutes consumption** - Supabase handles all processing
2. **Better storage** - Files stored in Supabase Storage with CDN instead of Git repo
3. **Database tracking** - Full history and metadata in PostgreSQL
4. **Unlimited executions** - No monthly limits like GitHub Actions
5. **Real-time updates** - Dashboard connects directly to Supabase

## Current System

LLMs.txt files are now generated via:
- **Supabase Edge Function**: `generate-llms-daily`
- **Cron Schedule**: Daily at 3 AM UTC via pg_cron
- **Storage**: Supabase Storage bucket `llms-files`
- **Dashboard**: https://sidetool-llmstxt-dashboard.vercel.app/

## Re-enabling GitHub Workflows

If you ever need to re-enable the GitHub workflows:
```bash
mv .github/workflows-disabled/*.yml .github/workflows/
```

But this is not recommended since Supabase provides a superior solution.