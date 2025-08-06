# Supabase Configuration Guide

## Quick Fix for "Supabase not configured" Error

The error occurs because the Supabase environment variables are not set in your Vercel deployment. Follow these steps:

## Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project or select your existing project
3. Go to **Settings** → **API** in your Supabase dashboard
4. You'll need these values:
   - **Project URL**: Copy the URL (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key**: Copy the `anon` public key
   - **Service Role Key**: Copy the `service_role` key (keep this secret!)

## Step 2: Set Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **sidetool-llmstxt-generator**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key | Production, Preview, Development |
| `FIRECRAWL_API_KEY` | Your Firecrawl API key | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview, Development |

## Step 3: Redeploy Your Application

After adding the environment variables:
1. Go to **Deployments** in Vercel
2. Click the **...** menu on your latest deployment
3. Select **Redeploy**
4. Wait for the deployment to complete

## Step 4: Set Up Supabase Database (First Time Only)

If this is a new Supabase project, you need to run the database migrations:

1. Go to your Supabase Dashboard
2. Click on **SQL Editor**
3. Copy and run each migration file from `/supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_add_rls_policies.sql`
   - `003_add_indexes.sql`
   - `004_user_facing_app_schema.sql`

## Step 5: Enable Authentication

In your Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - Enable email confirmations (optional)
   - Set redirect URLs to include your Vercel app URL

## Testing

After completing these steps:
1. Visit your app at the Vercel URL
2. Try signing up with an email
3. The error should be resolved

## Local Development

For local development, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FIRECRAWL_API_KEY=your-firecrawl-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Troubleshooting

If you still see the error after following these steps:

1. **Check Environment Variables**: In Vercel, go to Settings → Functions and verify the environment variables are listed
2. **Clear Browser Cache**: Sometimes old deployments are cached
3. **Check Supabase Status**: Ensure your Supabase project is active and not paused
4. **Verify Keys**: Make sure you copied the correct keys (especially the difference between anon and service role keys)

## Security Notes

- **Never expose** the `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- The `NEXT_PUBLIC_` prefix makes variables available to the browser (safe for anon key)
- Keep your service role key secret and only use it in server-side API routes

## Need More Help?

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)