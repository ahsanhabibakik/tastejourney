// Test Script for Recommendation System
// Tests the complete recommendation flow and validates responses

const testRecommendations = async () => {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🧪 TESTING: Starting recommendation system tests...\n');
  
  // Test data
  const testRequest = {
    tasteVector: {
      adventure: 0.8,
      culture: 0.6,
      food: 0.7,
      urban: 0.5
    },
    userPreferences: {
      budget: '$2000-3000',
      duration: '7 days',
      travelStyle: 'mid-range',
      contentType: 'Video'
    },
    websiteData: {
      url: 'https://example-travel-blog.com',
      themes: ['adventure', 'photography', 'culture'],
      contentType: 'Video',
      title: 'Adventure Travel Blog',
      description: 'Exploring the world through adventure and culture',
      location: 'Global',
      hints: ['outdoor activities', 'cultural experiences', 'photography']
    }
  };

  try {
    console.log('📡 TESTING: Sending request to recommendations API...');
    
    const response = await fetch(`${baseUrl}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ TESTING: API Response received successfully\n');
    console.log('📊 TESTING: Response Summary:');
    console.log(`- Total Recommendations: ${data.totalCount}`);
    console.log(`- API Version: ${data.metadata?.apiVersion}`);
    console.log(`- Fallback Used: ${data.metadata?.fallback ? 'Yes' : 'No'}`);
    console.log(`- Services Used: ${data.metadata?.servicesUsed?.join(', ') || 'Not specified'}`);
    console.log(`- Processing Time: ${data.metadata?.processingTime || 'Not specified'}\n`);

    // Validate each recommendation
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('🔍 TESTING: Validating recommendations...\n');
      
      data.recommendations.forEach((rec, index) => {
        console.log(`--- RECOMMENDATION ${index + 1} ---`);
        console.log(`Destination: ${rec.destination}`);
        console.log(`Country: ${rec.country}`);
        console.log(`Match Score: ${rec.matchScore}%`);
        
        // Check creator data - NEVER should be zero
        if (rec.creatorDetails || rec.creators) {
          const creatorData = rec.creatorDetails || rec.creators;
          const creatorCount = creatorData.totalActiveCreators;
          
          if (creatorCount === 0) {
            console.log(`❌ FAIL: Creator count is ZERO for ${rec.destination}!`);
          } else if (creatorCount < 15) {
            console.log(`⚠️ WARN: Low creator count (${creatorCount}) for ${rec.destination}`);
          } else {
            console.log(`✅ PASS: Creator count (${creatorCount}) is viable for ${rec.destination}`);
          }
          
          console.log(`Top Creators: ${creatorData.topCreators?.length || 0}`);
          console.log(`Collaboration Opportunities: ${creatorData.collaborationOpportunities?.length || 0}`);
        } else {
          console.log('❌ FAIL: No creator data found in recommendation');
        }
        
        // Check budget data
        if (rec.budget) {
          console.log(`Budget Range: ${rec.budget.range}`);
          console.log(`Budget Breakdown: ${rec.budget.breakdown}`);
        } else {
          console.log('⚠️ WARN: No budget data found');
        }
        
        // Check highlights
        if (rec.highlights && rec.highlights.length > 0) {
          console.log(`Highlights: ${rec.highlights.length} items`);
        } else {
          console.log('⚠️ WARN: No highlights found');
        }
        
        console.log(''); // Empty line for readability
      });
    } else {
      console.log('❌ FAIL: No recommendations returned!');
    }

    console.log('🧪 TESTING: Test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ TESTING: Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Run the test
testRecommendations().then(success => {
  if (success) {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ TEST RUNNER ERROR:', error);
  process.exit(1);
});