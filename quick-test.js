// Quick Test - Just check if recommendations endpoint returns data with non-zero creators

const quickTest = async () => {
  console.log('🧪 Quick Test: Testing recommendations endpoint...');
  
  const testData = {
    websiteData: {
      url: 'https://test-blog.com',
      themes: ['adventure', 'culture'],
      contentType: 'Video',
      title: 'Test Travel Blog'
    },
    userPreferences: {
      budget: '$2000-3000',
      duration: '7 days'
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      return;
    }

    const result = await response.json();
    console.log(`✅ API Response received: ${result.recommendations?.length || 0} recommendations`);
    
    // Check creator data
    if (result.recommendations && result.recommendations.length > 0) {
      result.recommendations.forEach((rec, i) => {
        const creators = rec.creatorDetails || rec.creators;
        const count = creators?.totalActiveCreators || 0;
        console.log(`${i + 1}. ${rec.destination}: ${count} creators ${count > 0 ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

quickTest();