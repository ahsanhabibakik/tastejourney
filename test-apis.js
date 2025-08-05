/**
 * API Testing Script for TasteJourney
 * 
 * This script tests all API endpoints to ensure they're working correctly.
 * Run this after setting up your API keys in .env.local
 * 
 * Usage: node test-apis.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  destination: 'Tokyo',
  location: 'Tokyo, Japan',
  cityCode: 'TYO',
  origin: 'NYC',
  departureDate: '2025-09-01',
  checkInDate: '2025-09-01',
  checkOutDate: '2025-09-05',
  keyword: 'travel vlog',
  place: 'Tokyo, Japan',
  city: 'Tokyo'
};

async function testAPI(endpoint, params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    console.log(`🧪 Testing: ${endpoint}`);
    console.log(`📍 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${endpoint} - SUCCESS`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...\n');
      return { success: true, data };
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`🚨 Error:`, data.error || 'Unknown error');
      console.log(`📊 Response:`, data, '\n');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`💥 ${endpoint} - NETWORK ERROR`);
    console.log(`🚨 Error:`, error.message, '\n');
    return { success: false, error: error.message };
  }
}

async function testPostAPI(endpoint, body) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    
    console.log(`🧪 Testing POST: ${endpoint}`);
    console.log(`📍 URL: ${url}`);
    console.log(`📝 Body:`, body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${endpoint} - SUCCESS`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...\n');
      return { success: true, data };
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`🚨 Error:`, data.error || 'Unknown error');
      console.log(`📊 Response:`, data, '\n');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`💥 ${endpoint} - NETWORK ERROR`);
    console.log(`🚨 Error:`, error.message, '\n');
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting TasteJourney API Tests\n');
  console.log('=' .repeat(50));
  
  const results = {};
  
  // Test GET APIs
  const getTests = [
    {
      name: 'YouTube Creators',
      endpoint: '/creators/youtube',
      params: { location: testData.location, keyword: testData.keyword }
    },
    {
      name: 'Flights',
      endpoint: '/flights',
      params: { 
        origin: testData.origin, 
        destination: testData.cityCode, 
        departureDate: testData.departureDate 
      }
    },
    {
      name: 'Hotels',
      endpoint: '/hotels',
      params: {
        cityCode: testData.cityCode,
        checkInDate: testData.checkInDate,
        checkOutDate: testData.checkOutDate
      }
    },
    {
      name: 'Location Details',
      endpoint: '/location-details',
      params: { place: testData.place }
    },
    {
      name: 'Cost of Living',
      endpoint: '/cost-of-living',
      params: { city: testData.city }
    }
  ];
  
  // Test POST APIs
  const postTests = [
    {
      name: 'Website Analysis',
      endpoint: '/analyze',
      body: { url: 'https://example.com' }
    },
    {
      name: 'Taste Profile',
      endpoint: '/profile-taste',
      body: { 
        userProfile: { 
          themes: ['travel', 'lifestyle'],
          contentType: 'video',
          audience: 'millennials'
        }
      }
    },
    {
      name: 'Recommendations',
      endpoint: '/recommendations',
      body: {
        userProfile: { 
          themes: ['travel'],
          contentType: 'video'
        },
        tasteProfile: {
          culturalAffinities: ['Japanese Culture'],
          personalityTraits: ['Adventurous']
        },
        userPreferences: {
          budget: '2000-3000',
          duration: '7 days',
          region: 'Asia'
        }
      }
    }
  ];
  
  // Run GET tests
  for (const test of getTests) {
    results[test.name] = await testAPI(test.endpoint, test.params);
  }
  
  // Run POST tests
  for (const test of postTests) {
    results[test.name] = await testPostAPI(test.endpoint, test.body);
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const successful = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}\n`);
  
  // Detailed results
  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✅' : '❌';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${name}${error}`);
  });
  
  console.log('\n🔑 Missing API Keys:');
  Object.entries(results).forEach(([name, result]) => {
    if (!result.success && result.error?.includes('not configured')) {
      console.log(`🚨 ${name}: Need to set up API key`);
    }
  });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Get missing API keys from the API_INTEGRATION_GUIDE.md');
  console.log('2. Add them to your .env.local file');
  console.log('3. Restart your Next.js server');
  console.log('4. Run this test again');
  
  return results;
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { testAPI, testPostAPI, runAllTests };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
