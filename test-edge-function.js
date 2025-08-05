// Test script to verify the Edge Function is working
// Run with: node test-edge-function.js

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gytlhmhrthpackunppjd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function...');
  console.log(`URL: ${SUPABASE_URL}/functions/v1/generate-llms-daily`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-llms-daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger: 'manual-test',
        source: 'test-script',
        timestamp: new Date().toISOString()
      })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    try {
      const data = JSON.parse(responseText);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Edge Function test successful!');
        console.log(`Generated ${data.file_count} files`);
        console.log(`Generation ID: ${data.generation_id}`);
      } else {
        console.log('❌ Edge Function returned error:', data.error);
      }
    } catch (e) {
      console.log('Response Text:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Failed to call Edge Function:', error);
  }
}

// Also test if we can reach Supabase
async function testSupabaseConnection() {
  console.log('\n🧪 Testing Supabase connection...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log(`Supabase API Status: ${response.status}`);
    if (response.ok) {
      console.log('✅ Supabase connection successful');
    } else {
      console.log('❌ Supabase connection failed');
    }
  } catch (error) {
    console.error('❌ Cannot reach Supabase:', error.message);
  }
}

// Run tests
(async () => {
  await testSupabaseConnection();
  await testEdgeFunction();
})();