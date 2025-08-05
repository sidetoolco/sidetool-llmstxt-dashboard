# Deployment Checklist for Sidetool GSO Dashboard

## Pre-Deployment Verification

### 1. Environment Variables Configuration
Visit https://gso.sidetool.co/api/debug-env to verify all environment variables are configured:

Required variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY` (optional, for email notifications)

### 2. Dashboard Features Implemented
- [x] Sidetool GSO branding (logo and naming)
- [x] Display ALL database files (not demo data)
- [x] File grouping by category (collection, topic, individual)
- [x] Collapsible content preview
- [x] Copy and download functionality
- [x] Status bar with file count, size, update time
- [x] Generate Now button
- [x] Live status indicator
- [x] Minimal, authentic design

### 3. Data Loading Fixed
- [x] Convert files object to array in page.tsx
- [x] Handle both object and array formats from API
- [x] Show all files from database
- [x] Group files by category

### 4. API Endpoints
- [x] `/api/supabase-files` - Load files from database
- [x] `/api/generate-direct` - Trigger manual generation
- [x] `/api/debug-env` - Check environment configuration
- [x] `/api/send-email-notification` - Send email notifications

### 5. Supabase Configuration
- [ ] Edge Function deployed: `generate-llms-daily`
- [ ] Cron job scheduled for 3 AM UTC daily
- [ ] Database tables created: `llms_generations`, `llms_files`
- [ ] Storage bucket configured: `llms-files`

## Deployment Steps

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Fix: Add complete file card rendering to display actual files"
   git push origin main
   ```

2. **Verify Deployment**
   - Check https://gso.sidetool.co/ 
   - Verify files are displayed
   - Test Generate Now button
   - Check environment variables

3. **Test File Generation**
   - Click "Generate Now" button
   - Wait for generation to complete
   - Verify new files appear in dashboard

## Post-Deployment Monitoring

1. **Check Logs**
   - Vercel function logs
   - Supabase Edge Function logs
   - Browser console for any errors

2. **Verify Cron Job**
   - Check if files are generated daily at 3 AM UTC
   - Monitor email notifications

3. **User Experience**
   - Files load properly
   - UI is responsive
   - All features work as expected

## Troubleshooting

### If files don't appear:
1. Check `/api/debug-env` for environment variables
2. Check browser console for errors
3. Verify Supabase connection
4. Check API response in Network tab

### If Generate Now fails:
1. Check Supabase Edge Function deployment
2. Verify service role key is configured
3. Check function logs in Supabase dashboard

### If UI looks broken:
1. Clear browser cache
2. Check for JavaScript errors
3. Verify Tailwind CSS is loading

## Success Criteria

- [ ] Dashboard loads at https://gso.sidetool.co/
- [ ] All database files are displayed
- [ ] Files are grouped by category
- [ ] Generate Now button works
- [ ] Sidetool branding is visible
- [ ] Design looks authentic and professional