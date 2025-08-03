# Environment Variables Setup

## Required Environment Variables for Production

Add these to your Vercel Dashboard under Settings → Environment Variables:

### 1. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Resend Email Service (NEW)
```bash
RESEND_API_KEY=re_Legh7Pba_FyLYUgYuVBN4Lpit5C4Tb1fS
```

### 3. Optional Variables
```bash
VERCEL_APP_URL=https://sidetool-llmstxt-dashboard.vercel.app
```

## Adding to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com)
2. Select your project: `sidetool-llmstxt-dashboard`
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `RESEND_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save** for each variable

## Local Development

For local development, create a `.env.local` file:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

Then edit `.env.local` with your values.

## Verifying Email Setup

After adding the Resend API key:

1. **Test locally** (if running locally):
   ```bash
   npm run dev
   # Then visit: http://localhost:3000/api/test-email (POST request)
   ```

2. **Test in production**:
   ```bash
   curl -X POST https://sidetool-llmstxt-dashboard.vercel.app/api/test-email
   ```

3. **Check email**: You should receive a test email at `ed@sidetool.co`

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit API keys to version control
- The `.env.local` file is gitignored
- Use `.env.local.example` as a template only
- Rotate API keys regularly
- Use different keys for dev/staging/production if possible

## Resend Configuration

Your Resend account is configured with:
- **API Key**: `re_Legh7Pba_FyLYUgYuVBN4Lpit5C4Tb1fS`
- **Default From**: `noreply@sidetool.co` (requires domain verification)
- **Recipient**: `ed@sidetool.co`

### Domain Verification (Recommended)

To send from `@sidetool.co` addresses:

1. Log into [Resend Dashboard](https://resend.com)
2. Go to **Domains** → **Add Domain**
3. Enter `sidetool.co`
4. Add the DNS records provided:
   - SPF record
   - DKIM records
   - Optional: DMARC record
5. Verify domain

This improves deliverability and allows custom "from" addresses.

## Environment Variables by Feature

| Feature | Required Variables |
|---------|-------------------|
| Database | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Email Notifications | `RESEND_API_KEY` |
| File Generation | `SUPABASE_SERVICE_ROLE_KEY` |
| Dashboard UI | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Troubleshooting

### Emails not sending?
1. Check Resend API key is correctly set in Vercel
2. Verify no typos in the key
3. Check Vercel function logs for errors
4. Ensure Resend account is active

### Dashboard not loading data?
1. Verify Supabase URLs are correct
2. Check service role key has proper permissions
3. Ensure Supabase Edge Functions are deployed

### Build failures?
1. Environment variables don't need to be set for build
2. They're only required at runtime
3. Check build logs for specific errors