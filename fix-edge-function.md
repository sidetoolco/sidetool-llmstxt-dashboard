# Fix Edge Function Deployment

The Edge Function is not properly deployed or configured. Follow these steps:

## 1. Deploy the Edge Function

```bash
cd /Users/edescobar/Code/sidetool-llmstxt-generator

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref gytlhmhrthpackunppjd

# Deploy the Edge Function with proper flags
supabase functions deploy generate-llms-daily --no-verify-jwt

# Check deployment status
supabase functions list
```

## 2. Set Required Secrets

```bash
# Set the required environment variables for the Edge Function
supabase secrets set OPENAI_API_KEY=<your-openai-api-key>
supabase secrets set VERCEL_APP_URL=https://sidetool-llmstxt-dashboard.vercel.app
supabase secrets set SUPABASE_URL=https://gytlhmhrthpackunppjd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# List secrets to verify (won't show values)
supabase secrets list
```

## 3. Test the Function Locally First

```bash
# Create a test payload
cat > test-payload.json << EOF
{
  "trigger": "manual",
  "source": "cli-test",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Test locally (requires Docker)
supabase functions serve generate-llms-daily --env-file supabase/.env.local

# In another terminal, test the local function
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-llms-daily' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json' \
  --data @test-payload.json
```

## 4. After Deployment, Test Remote Function

```bash
# Test the deployed function
supabase functions invoke generate-llms-daily --body @test-payload.json

# Or use curl with your service role key
curl -i --location --request POST \
  'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily' \
  --header 'Authorization: Bearer <your-service-role-key>' \
  --header 'Content-Type: application/json' \
  --data '{"trigger":"manual","source":"curl-test"}'
```

## 5. Check Function Logs

```bash
# View recent logs
supabase functions logs generate-llms-daily --tail 20

# Or check in the dashboard
# https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions/generate-llms-daily/logs
```

## 6. Common Issues and Fixes

### Issue: Function not found (404)
**Fix**: Deploy the function using the commands above

### Issue: Authentication error (401/403)
**Fix**: Use the service role key, not the anon key

### Issue: Function timeout or error
**Fix**: Check logs for specific errors, usually missing environment variables

### Issue: CORS errors
**Fix**: The function already includes CORS headers, but ensure you're using the correct URL

## 7. Alternative: Use Direct Database Insert

If the Edge Function continues to fail, create a temporary API route that generates files directly:

```typescript
// In your Vercel app, create /api/generate-direct/route.ts
import { createClient } from '@supabase/supabase-js'
// ... implement direct generation logic
```

## 8. Verify in SQL

After successful deployment, this query should work:

```sql
SELECT
  net.http_post(
    url := 'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <your-service-role-key>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'manual-sql',
      'timestamp', NOW()::text
    )
  ) as response;
```

The response should be a JSON object with success status, not just a number.