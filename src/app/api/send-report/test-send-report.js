// Simple test script to send a PDF report using your API
fetch('/api/send-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'recipient@example.com',
    recommendations: [
      {
        destination: 'Bali',
        highlights: ['Beach', 'Culture'],
        budget: { range: '$1200 - $1800' },
        bestMonths: ['April', 'May'],
        engagement: { potential: 'High' },
        tags: ['Adventure', 'Food']
      }
    ],
    userProfile: { name: 'Test User', interests: 'Travel, Food' },
    websiteData: {
      url: 'https://example.com',
      themes: ['Travel', 'Food'],
      hints: ['Try Bali'],
      contentType: 'blog',
      socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/test' }],
      title: 'Test Travel Blog',
      description: 'A blog about travel and food.'
    }
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
