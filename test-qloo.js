// Quick script to test Qloo API endpoints
const API_KEY = 'QicUpH0FFi-tiavofPhULOL_SUUqMFw9Qlv7-ze1f8Q';
const BASE_URL = 'https://hackathon.api.qloo.com';

async function testEndpoint(endpoint, payload) {
  try {
    console.log(`\n🔍 Testing: ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ SUCCESS:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`);
  }
  return false;
}

async function main() {
  const testPayload = {
    content_themes: ["travel", "photography"],
    content_hints: ["visual-content-creator"],
    content_type: "Photography"
  };

  const simplePayload = {
    input: {
      interests: ["travel", "photography", "adventure"]
    }
  };

  const endpoints = [
    '/v1/insights',
    '/v1/recommendations', 
    '/v1/taste',
    '/v1/profile',
    '/insights',
    '/recommendations',
    '/taste',
    '/profile'
  ];

  console.log('🚀 Testing Qloo API endpoints...\n');

  for (const endpoint of endpoints) {
    const success1 = await testEndpoint(endpoint, testPayload);
    if (success1) break;
    
    const success2 = await testEndpoint(endpoint, simplePayload);
    if (success2) break;
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit protection
  }
}

main().catch(console.error);