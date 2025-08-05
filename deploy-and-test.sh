#!/bin/bash

echo "🚀 Deploying and Testing Edge Function for Generate Now Button"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "supabase/functions/generate-llms-daily/index.ts" ]; then
    echo "❌ Error: Not in the correct directory. Run this from the project root."
    exit 1
fi

# Link to Supabase project
echo "📎 Linking to Supabase project..."
supabase link --project-ref gytlhmhrthpackunppjd

# List current functions
echo -e "\n📋 Current Edge Functions:"
supabase functions list

# Deploy the function
echo -e "\n🚀 Deploying generate-llms-daily function..."
supabase functions deploy generate-llms-daily --no-verify-jwt

# Set secrets if needed
echo -e "\n🔐 Setting function secrets..."
echo "Note: You'll need to enter your OpenAI API key when prompted"
supabase secrets set OPENAI_API_KEY
supabase secrets set VERCEL_APP_URL=https://sidetool-llmstxt-dashboard.vercel.app

# Test the function
echo -e "\n🧪 Testing the function..."
echo '{"trigger": "manual-test", "source": "deploy-script"}' > test-payload.json
supabase functions invoke generate-llms-daily --body @test-payload.json

# Check logs
echo -e "\n📊 Recent function logs:"
supabase functions logs generate-llms-daily --tail 10

# Cleanup
rm -f test-payload.json

echo -e "\n✅ Deployment complete!"
echo "Test the Generate Now button in your dashboard: https://sidetool-llmstxt-dashboard.vercel.app/"