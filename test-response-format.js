// Test Response Format - Validate API responses match expected structure

const testResponseFormat = async () => {
  console.log('🧪 Testing API response format...\n');

  try {
    const response = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteData: {
          url: 'https://simple-test.com',
          themes: ['adventure'],
          contentType: 'Video',
          title: 'Simple Test'
        },
        userPreferences: {
          budget: '$1500-2500',
          duration: '5 days'
        }
      })
    });

    const data = await response.json();
    
    console.log('✅ Response received successfully');
    console.log(`Status: ${response.status}`);
    console.log(`Recommendations count: ${data.recommendations?.length || 0}`);
    
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\n📊 Validating response structure...\n');
      
      const rec = data.recommendations[0];
      const checks = [
        { field: 'destination', value: rec.destination, required: true },
        { field: 'country', value: rec.country, required: true },
        { field: 'matchScore', value: rec.matchScore, required: true },
        { field: 'highlights', value: rec.highlights?.length, required: true },
        { field: 'budget.range', value: rec.budget?.range, required: true },
        { field: 'creators/creatorDetails', value: (rec.creators || rec.creatorDetails)?.totalActiveCreators, required: true },
        { field: 'engagement', value: rec.engagement?.potential, required: true }
      ];
      
      let passed = 0;
      let total = checks.length;
      
      checks.forEach(check => {
        const exists = check.value !== undefined && check.value !== null;
        const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
        
        if (check.field === 'creators/creatorDetails' && exists) {
          const count = check.value;
          if (count === 0) {
            console.log(`❌ ${check.field}: ${count} (ZERO CREATORS - FAIL!)`);
          } else if (count < 15) {
            console.log(`⚠️ ${check.field}: ${count} (Low but acceptable)`);
            passed++;
          } else {
            console.log(`✅ ${check.field}: ${count} (Good)`);
            passed++;
          }
        } else {
          console.log(`${status} ${check.field}: ${exists ? 'Present' : 'Missing'}${exists && typeof check.value === 'number' ? ` (${check.value})` : ''}`);
          if (exists) passed++;
        }
      });
      
      console.log(`\n📈 Validation Result: ${passed}/${total} checks passed`);
      
      if (passed === total) {
        console.log('✅ ALL VALIDATIONS PASSED - Response format is correct');
        return true;
      } else {
        console.log('❌ Some validations failed');
        return false;
      }
    } else {
      console.log('❌ No recommendations returned');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
};

testResponseFormat().then(success => {
  console.log(success ? '\n🎉 TEST PASSED' : '\n💥 TEST FAILED');
  process.exit(success ? 0 : 1);
});