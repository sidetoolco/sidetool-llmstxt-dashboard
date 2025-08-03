# Fix Vercel Deployment - Quick Guide

## The Problem
The deployment at https://sidetool-llmstxt-dashboard.vercel.app/ is not showing the latest UI improvements.

## Solution Steps

### 1. Check Vercel Dashboard Settings

Go to your Vercel dashboard: https://vercel.com/dashboard

Find the `sidetool-llmstxt-dashboard` project and click on it.

### 2. Verify Project Settings

Click on "Settings" tab and check:

#### Root Directory
**MUST be set to:** `vercel-app`

If it's not set:
1. Go to Settings → General
2. Find "Root Directory"
3. Enter: `vercel-app`
4. Click Save

#### Framework Preset
- Should be: **Next.js** (auto-detected)

#### Build & Output Settings
- Build Command: `npm run build` (or leave default)
- Output Directory: `.next` (or leave default)
- Install Command: `npm install` (or leave default)

### 3. Add Environment Variables

Go to Settings → Environment Variables and add:

```
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4

SUPABASE_FUNCTION_URL = https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt
```

### 4. Trigger a New Deployment

After fixing settings:

Option A - Redeploy from Dashboard:
1. Go to "Deployments" tab
2. Find the latest deployment
3. Click the "..." menu
4. Select "Redeploy"

Option B - Push a small change:
```bash
cd /Users/edescobar/Code/sidetool-llmstxt-generator
git add .
git commit -m "Trigger Vercel rebuild"
git push origin main
```

### 5. Verify the Deployment

1. Check the build logs in Vercel dashboard
2. Look for any errors
3. Make sure it says "Building vercel-app"
4. Wait for deployment to complete (2-3 minutes)

## Expected Result

After successful deployment, you should see:
- Modern UI with gradient backgrounds
- Three tabs: Overview, Generated Pages, History
- Dark mode toggle in top-right corner
- Statistics cards showing pages indexed
- List of all generated pages from sidetool.co

## If Still Not Working

### Option 1: Re-import the Project

1. Delete the current project in Vercel
2. Go to https://vercel.com/new
3. Import `sidetoolco/sidetool-llmstxt-dashboard` again
4. **IMPORTANT**: Set Root Directory to `vercel-app`
5. Add environment variables
6. Deploy

### Option 2: Check Build Output

In Vercel dashboard, go to the deployment and check:
- Functions tab - should show `/api/generate`
- Build logs - look for "Compiled successfully"
- Make sure it's building from `vercel-app` directory

## Quick Test

After deployment, test these URLs:
- Main page: https://sidetool-llmstxt-dashboard.vercel.app/
- API endpoint: https://sidetool-llmstxt-dashboard.vercel.app/api/generate

The main page should show the new UI with tabs and dark mode toggle.