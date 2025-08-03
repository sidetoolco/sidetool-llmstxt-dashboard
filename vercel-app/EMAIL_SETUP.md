# Email Notification Setup

This system automatically sends email notifications to `ed@sidetool.co` whenever new LLMs.txt files are generated.

## Required Environment Variables

Add these to your Vercel environment variables:

### RESEND_API_KEY
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to Vercel as `RESEND_API_KEY`

### Domain Verification (Optional but Recommended)
1. In Resend dashboard, add `sidetool.co` as a domain
2. Add the DNS records they provide
3. This allows sending from `noreply@sidetool.co`

## How It Works

### Automatic Emails
- **Trigger**: Every time new LLMs.txt files are generated (via cron or manual trigger)
- **Recipient**: ed@sidetool.co
- **Content**: Beautiful HTML email with:
  - Generation summary (total files, size, timestamps)
  - File previews for collection, topic, and individual files
  - Direct links to files and dashboard
  - Clear next steps for deployment

### Email Content Includes
- **Stats**: Total files, size, categories
- **Collection Files**: Main llms.txt and llms-full.txt
- **Topic Collections**: AI Development, No-Code, Automation, etc.
- **Individual Posts**: First 3 individual files + count of remaining
- **File Previews**: First 200 characters of each file
- **Action Buttons**: View Dashboard, View Repository
- **Deployment Instructions**: Clear steps for uploading to website

## Testing

### Manual Test
```bash
curl -X POST https://sidetool-llmstxt-dashboard.vercel.app/api/test-email
```

### From Dashboard
Click "Generate Now" - emails will be sent automatically after generation completes.

## Email Template Features

- **Responsive Design**: Works on desktop and mobile
- **Professional Styling**: Clean, modern design matching your brand
- **File Categorization**: Clear visual separation of different file types
- **Deployment Ready**: Copy-paste ready file contents
- **Metadata Rich**: Generation IDs, timestamps, file sizes
- **Action-Oriented**: Clear next steps and direct links

## Cron Schedule

The system runs automatically via Supabase pg_cron:
- **Schedule**: Daily at 2:00 AM UTC
- **Function**: `generate-llms-daily`
- **Email**: Automatically triggered after successful generation

## Troubleshooting

### Email Not Sending
1. Check RESEND_API_KEY is set in Vercel
2. Verify domain is configured in Resend (if using custom domain)
3. Check Vercel logs for email errors

### Email Going to Spam
1. Set up domain verification in Resend
2. Add SPF, DKIM, and DMARC records
3. Use a verified domain for sending

### Large File Warnings
If files are very large, the email might be truncated. The system:
- Shows only first 200 characters of each file
- Limits individual file previews to first 3 files
- Provides links to full content in dashboard

## File Deployment Workflow

When you receive the email:

1. **Download files** from dashboard or copy from email
2. **Upload to website**:
   - `llms.txt` → `sidetool.co/llms.txt`
   - `llms-full.txt` → `sidetool.co/llms-full.txt`
   - Topic files → `sidetool.co/llms-topic-*.txt`
   - Individual files → `sidetool.co/llms-*.txt`

3. **Verify deployment**: Check that AI systems can discover your content

## Technical Details

- **Email Service**: Resend (reliable, developer-friendly)
- **Template Engine**: Custom HTML generation with inline CSS
- **Retry Logic**: Emails are attempted but don't block file generation
- **Logging**: Full email success/failure logging in Vercel
- **Security**: API key required, domain verification recommended