# Deploy to Vercel - Quick Guide

## Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/new
   - Sign in with your GitHub account

2. **Import GitHub Repository**
   - Click "Import Git Repository"
   - Select `sidetoolco/sidetool-llmstxt-dashboard`
   - Choose the repository from the list

3. **Configure Project**
   - **Root Directory**: Set to `vercel-app` (IMPORTANT!)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Settings**: Leave as default

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4
   
   SUPABASE_FUNCTION_URL = https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)

## Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```
   Choose your preferred login method (GitHub recommended)

3. **Deploy from vercel-app directory**
   ```bash
   cd /Users/edescobar/Code/sidetool-llmstxt-generator/vercel-app
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - Project name? `sidetool-llmstxt`
   - Directory? `./` (current directory)
   - Override settings? `N`

5. **Set environment variables**
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGxobWhydGhwYWNrdW5wcGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5MDkyMywiZXhwIjoyMDY5NzY2OTIzfQ.Bea_Yg4D0LEiz-XywVRVAX4r6cc0oLtzzP1QAoks5-4
   
   vercel env add SUPABASE_FUNCTION_URL
   # Paste: https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llmstxt
   ```

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Your App URLs

Once deployed, your app will be available at:
- **Production**: `https://sidetool-llmstxt.vercel.app` (or your custom domain)
- **Preview**: Each git push creates a preview URL

## Features Available

After deployment, you can:
1. **Generate LLMs.txt files** - Click "Generate Now" button
2. **View generated files** - Browse by date
3. **Download files** - Direct download links
4. **See generation history** - Track all generations

## Troubleshooting

If the deployment fails:
1. Check that environment variables are set correctly
2. Verify the Supabase Edge Function is deployed and working
3. Check Vercel build logs for specific errors

## Next Steps

1. Visit your deployed app URL
2. Click "Generate Now" to test file generation
3. Set up a custom domain if desired (in Vercel dashboard)
4. Monitor usage in Vercel Analytics