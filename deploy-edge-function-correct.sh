#!/bin/bash

echo "🚀 Deploying Edge Function (Correct Method)"
echo "=========================================="

# Deploy the function
echo "📦 Deploying generate-llms-daily function..."
supabase functions deploy generate-llms-daily --no-verify-jwt

# Set environment variables
echo -e "\n🔐 Setting function environment variables..."
echo "You'll need to enter your OpenAI API key when prompted"

# Set secrets one by one
supabase secrets set OPENAI_API_KEY
supabase secrets set VERCEL_APP_URL=https://sidetool-llmstxt-dashboard.vercel.app

# List functions to verify deployment
echo -e "\n✅ Checking deployment..."
supabase functions list

# Test using curl instead of invoke
echo -e "\n🧪 Testing the function with curl..."
echo "Replace YOUR_SERVICE_ROLE_KEY with your actual key:"

cat << 'EOF'
curl -i --location --request POST \
  'https://gytlhmhrthpackunppjd.supabase.co/functions/v1/generate-llms-daily' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "trigger": "manual",
    "source": "curl-test",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
EOF

echo -e "\n📌 Next Steps:"
echo "1. Copy the curl command above"
echo "2. Replace YOUR_SERVICE_ROLE_KEY with your service role key"
echo "3. Run it to test the Edge Function"
echo "4. Check logs at: https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions/generate-llms-daily/logs"
echo ""
echo "5. Once working, update page.tsx to use /api/trigger-generation instead of /api/generate-direct"