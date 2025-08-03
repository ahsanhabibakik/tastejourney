import { NextRequest, NextResponse } from "next/server";

interface TasteVector {
  adventure: number;
  culture: number;
  luxury: number;
  food: number;
  nature: number;
  urban: number;
  budget: number;
}

interface QlooRequest {
  themes: string[];
  hints: string[];
  contentType: string;
  socialLinks: { platform: string; url: string }[];
  demographics?: {
    age?: string;
    location?: string;
    interests?: string[];
  };
}

interface QlooResponse {
  tasteVector: TasteVector;
  recommendations: string[];
  confidence: number;
  culturalAffinities: string[];
  personalityTraits: string[];
  processingTime: string;
}

// Mock Qloo API response generator
function generateMockTasteVector(
  themes: string[],
  hints: string[],
  contentType: string
): TasteVector {
  // Initialize base vector
  const vector: TasteVector = {
    adventure: 0.3,
    culture: 0.3,
    luxury: 0.3,
    food: 0.3,
    nature: 0.3,
    urban: 0.3,
    budget: 0.5,
  };

  // Adjust based on themes
  themes.forEach((theme) => {
    switch (theme.toLowerCase()) {
      case "adventure":
      case "hiking":
      case "outdoor":
        vector.adventure = Math.min(vector.adventure + 0.2, 1.0);
        vector.nature = Math.min(vector.nature + 0.15, 1.0);
        break;
      case "culture":
      case "art":
      case "history":
      case "traditional":
        vector.culture = Math.min(vector.culture + 0.25, 1.0);
        break;
      case "luxury":
      case "premium":
      case "high-end":
        vector.luxury = Math.min(vector.luxury + 0.3, 1.0);
        vector.budget = Math.max(vector.budget - 0.2, 0.1);
        break;
      case "food":
      case "culinary":
      case "restaurant":
      case "cooking":
        vector.food = Math.min(vector.food + 0.25, 1.0);
        break;
      case "nature":
      case "wildlife":
      case "landscape":
      case "beach":
        vector.nature = Math.min(vector.nature + 0.2, 1.0);
        break;
      case "urban":
      case "city":
      case "metropolitan":
        vector.urban = Math.min(vector.urban + 0.2, 1.0);
        break;
      case "budget":
      case "backpack":
      case "cheap":
        vector.budget = Math.min(vector.budget + 0.3, 1.0);
        vector.luxury = Math.max(vector.luxury - 0.2, 0.1);
        break;
    }
  });

  // Ali Abdaal logic takes precedence over photography
  const aliAbdaalKeywords = ["ali abdaal", "ali-abdaal", "aliabdal.com"];
  const isAliAbdaal = aliAbdaalKeywords.includes(contentType.toLowerCase()) ||
    themes.some(t => aliAbdaalKeywords.includes(t.toLowerCase())) ||
    hints.some(h => aliAbdaalKeywords.includes(h.toLowerCase()));

  if (isAliAbdaal) {
    // Personalization for Ali Abdaal and similar creators
    vector.culture += 0.18;
    vector.urban += 0.18;
    vector.luxury += 0.12;
    vector.budget += 0.07;
    // Do NOT boost photography traits
  }
  // Always run switch for other content types, but skip photography boost if Ali Abdaal
  switch (contentType.toLowerCase()) {
    case "photography":
      if (!isAliAbdaal) {
        vector.culture += 0.1;
        vector.nature += 0.1;
      }
      break;
    case "food & culinary":
      vector.food += 0.2;
      vector.culture += 0.1;
      break;
    case "luxury lifestyle":
      vector.luxury += 0.2;
      vector.urban += 0.1;
      break;
    case "travel & adventure":
      vector.adventure += 0.2;
      vector.nature += 0.1;
      break;
    case "productivity":
    case "educational":
    case "lifestyle":
      if (!isAliAbdaal) {
        vector.culture += 0.18;
        vector.urban += 0.18;
        vector.luxury += 0.12;
        vector.budget += 0.07;
      }
      break;
  }

  // Normalize values to ensure they're between 0 and 1
  Object.keys(vector).forEach((key) => {
    const k = key as keyof TasteVector;
    vector[k] = Math.max(0, Math.min(1, vector[k]));
  });

  return vector;
}

// Generate cultural affinities based on taste vector
function generateCulturalAffinities(vector: TasteVector): string[] {
  const affinities: string[] = [];

  if (vector.adventure > 0.6)
    affinities.push("Adventure Sports", "Outdoor Activities");
  if (vector.culture > 0.6)
    affinities.push("Museums", "Historical Sites", "Local Traditions");
  if (vector.luxury > 0.6)
    affinities.push("Fine Dining", "Luxury Hotels", "Premium Experiences");
  if (vector.food > 0.6)
    affinities.push("Street Food", "Cooking Classes", "Food Markets");
  if (vector.nature > 0.6)
    affinities.push("National Parks", "Wildlife", "Scenic Landscapes");
  if (vector.urban > 0.6)
    affinities.push("City Life", "Architecture", "Nightlife");
  if (vector.budget > 0.6)
    affinities.push("Budget Travel", "Hostels", "Local Transportation");

  return affinities.slice(0, 6); // Limit to top 6
}

// Generate personality traits based on taste vector
function generatePersonalityTraits(vector: TasteVector): string[] {
  const traits: string[] = [];

  if (vector.adventure > 0.7) traits.push("Thrill Seeker");
  if (vector.culture > 0.7) traits.push("Culture Enthusiast");
  if (vector.luxury > 0.7) traits.push("Luxury Lover");
  if (vector.food > 0.7) traits.push("Foodie");
  if (vector.nature > 0.7) traits.push("Nature Lover");
  if (vector.urban > 0.7) traits.push("City Explorer");
  if (vector.budget > 0.7) traits.push("Budget Conscious");

  // Add combination traits
  if (vector.adventure > 0.5 && vector.nature > 0.5)
    traits.push("Outdoor Adventurer");
  if (vector.culture > 0.5 && vector.food > 0.5) traits.push("Cultural Foodie");
  if (vector.luxury > 0.5 && vector.urban > 0.5)
    traits.push("Urban Sophisticate");

  return traits.slice(0, 5); // Limit to top 5
}

// Generate smart recommendations based on taste vector
function generateSmartRecommendations(vector: TasteVector, themes: string[]): string[] {
  const recommendations: string[] = [];

  // Adventure-based recommendations
  if (vector.adventure > 0.6) {
    recommendations.push("Costa Rica", "New Zealand", "Nepal", "Patagonia");
  }

  // Culture-focused recommendations
  if (vector.culture > 0.6) {
    recommendations.push("Kyoto", "Rome", "Istanbul", "Marrakech", "Cusco");
  }

  // Luxury travel recommendations
  if (vector.luxury > 0.6) {
    recommendations.push("Maldives", "Dubai", "Monaco", "Santorini", "Aspen");
  }

  // Food-focused recommendations
  if (vector.food > 0.6) {
    recommendations.push("Tokyo", "Paris", "Bangkok", "Lima", "Mumbai");
  }

  // Nature-based recommendations
  if (vector.nature > 0.6) {
    recommendations.push("Iceland", "Norwegian Fjords", "Amazon Rainforest", "Yellowstone", "Banff");
  }

  // Urban exploration recommendations
  if (vector.urban > 0.6) {
    recommendations.push("New York", "London", "Singapore", "Barcelona", "Berlin");
  }

  // Budget-friendly recommendations
  if (vector.budget > 0.6) {
    recommendations.push("Vietnam", "Portugal", "Czech Republic", "Guatemala", "India");
  }

  // Theme-based recommendations
  themes.forEach(theme => {
    switch (theme.toLowerCase()) {
      case 'photography':
      case 'visual':
        recommendations.push("Morocco", "India", "Myanmar", "Ethiopia");
        break;
      case 'wellness':
      case 'health':
        recommendations.push("Bali", "Rishikesh", "Tulum", "Costa Rica");
        break;
      case 'business':
      case 'professional':
        recommendations.push("Singapore", "Switzerland", "Japan", "Germany");
        break;
    }
  });

  // Remove duplicates and return top recommendations
  const uniqueRecs = [...new Set(recommendations)];
  return uniqueRecs.slice(0, 8);
}

// Calculate confidence based on input quality
function calculateConfidence(themes: string[], hints: string[]): number {
  let confidence = 0.5; // Base confidence

  // More themes = higher confidence
  confidence += Math.min(themes.length * 0.1, 0.3);

  // More hints = higher confidence
  confidence += Math.min(hints.length * 0.05, 0.2);

  // Bonus for specific content types
  const specificHints = ['photographer', 'food-blogger', 'travel-blogger'];
  if (hints.some(hint => specificHints.includes(hint))) {
    confidence += 0.1;
  }

  return Math.min(confidence, 0.95); // Cap at 95%
}

// Helper function to get tag IDs from Qloo /v2/tags endpoint
async function getQlooTagIds(themes: string[]): Promise<string[]> {
  const tagIds: string[] = [];
  
  for (const theme of themes.slice(0, 3)) { // Limit to first 3 themes to avoid too many requests
    try {
      const url = `${process.env.QLOO_API_URL}/v2/tags?filter.query=${encodeURIComponent(theme)}`;
      console.log(`Fetching tags for "${theme}": ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY!,
          'Accept': 'application/json',
          'User-Agent': 'TasteJourney/1.0'
        }
      });
      
      console.log(`Tag lookup for "${theme}": ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Tag data for "${theme}":`, JSON.stringify(data, null, 2));
        
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const tagId = data.results[0].id;
          console.log(`Found tag ID for "${theme}": ${tagId}`);
          tagIds.push(tagId);
        } else {
          console.log(`No tags found for "${theme}"`);
        }
      } else {
        const errorText = await response.text();
        console.warn(`Tag lookup failed for "${theme}": ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.warn(`Failed to get tag ID for "${theme}":`, error);
    }
  }
  
  return tagIds;
}

// Real Qloo API integration with enhanced error handling
// See Qloo API docs: https://docs.qloo.com/
async function callQlooAPI(request: QlooRequest): Promise<QlooResponse> {
  // Validate environment variables
  if (!process.env.QLOO_API_KEY || !process.env.QLOO_API_URL) {
    throw new Error('Missing required Qloo API configuration: QLOO_API_KEY and QLOO_API_URL must be set');
  }

  // First, try to get valid tag IDs for our themes
  console.log('Getting tag IDs for themes:', request.themes);
  const tagIds = await getQlooTagIds(request.themes);
  console.log('Retrieved tag IDs:', tagIds);

  // Try Qloo API endpoints with official URN format filter.type values from hackathon documentation
  const endpoints: Array<{path: string, method: string, filterType?: string}> = [
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:destination' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:place' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:brand' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:movie' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:tv_show' },
  ];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const endpointDesc = endpoint.filterType 
        ? `${endpoint.path} (${endpoint.method}, filter.type=${endpoint.filterType})`
        : `${endpoint.path} (${endpoint.method})`;
      console.log(`Trying Qloo endpoint: ${process.env.QLOO_API_URL}${endpointDesc}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Prepare request configuration
      const requestConfig: RequestInit = {
        method: endpoint.method,
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'TasteJourney/1.0'
        },
        signal: controller.signal
      };

      // Add body and content-type for POST requests
      if (endpoint.method === 'POST') {
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Type': 'application/json'
        };
        requestConfig.body = JSON.stringify({
          content_themes: request.themes,
          content_hints: request.hints,
          content_type: request.contentType,
          social_profiles: request.socialLinks,
          demographics: request.demographics,
          // Alternative payload formats for different API versions
          input: {
            themes: request.themes,
            hints: request.hints,
            contentType: request.contentType,
            interests: request.themes
          },
          // Additional fields that Qloo might expect
          preferences: {
            themes: request.themes,
            hints: request.hints
          }
        });
      }

      // Build URL with query parameters for GET requests
      let url = `${process.env.QLOO_API_URL}${endpoint.path}`;
      
      if (endpoint.method === 'GET') {
        const params = new URLSearchParams();
        
        // REQUIRED: filter.type parameter (official URN format)
        if (endpoint.filterType) {
          params.append('filter.type', endpoint.filterType);
        }
        
        // REQUIRED: At least one valid signal or filter parameter (per hackathon docs)
        // Use actual tag IDs if we got them, otherwise use theme-based approach
        if (tagIds.length > 0) {
          // Use valid tag IDs (this is the preferred approach)
          params.append('signal.interests.tags', tagIds.join(','));
          console.log('Using tag IDs for signal.interests.tags:', tagIds);
        } else {
          console.log('No tag IDs found, using theme-based signals');
          
          // Convert themes to appropriate signal parameters based on successful test
          const themeKeywords = request.themes.join(',');
          params.append('signal.interests.tags', themeKeywords);
          console.log('Added signal.interests.tags:', themeKeywords);
        }
        
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, requestConfig);

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`Success with endpoint ${endpointDesc}:`, JSON.stringify(data, null, 2));
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from Qloo API');
        }
        
        // Parse Qloo API response - handle actual hackathon API format
        const entities = data.results?.entities || [];
        const destinations = entities.map((entity: Record<string, unknown>) => entity.name).slice(0, 8);
        
        // Extract taste vector from entity tags and properties
        const tasteVector = generateTasteVectorFromEntities(entities, request.themes);
        
        // Extract cultural affinities from entity tags
        const culturalAffinities = extractCulturalAffinities(entities);
        
        // Generate personality traits based on destinations and preferences
        const personalityTraits = generatePersonalityFromDestinations(destinations, request.themes);
        
        return {
          tasteVector,
          recommendations: destinations,
          confidence: Math.min(Math.max(0.85, 0), 1), // High confidence for real API data
          culturalAffinities,
          personalityTraits,
          processingTime: `Qloo API via ${endpointDesc}`
        };
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        const errorMsg = `HTTP ${response.status}: ${errorText}`;
        errors.push(`${endpointDesc} - ${errorMsg}`);
        console.warn(`Failed endpoint ${endpointDesc}: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const endpointDesc = endpoint.filterType 
        ? `${endpoint.path} (${endpoint.method}, filter.type=${endpoint.filterType})`
        : `${endpoint.path} (${endpoint.method})`;
      errors.push(`${endpointDesc} - ${errorMsg}`);
      console.warn(`Error with endpoint ${endpointDesc}:`, errorMsg);
    }
  }

  // All endpoints failed
  const finalError = new Error(`All Qloo API endpoints failed. Errors: ${errors.join('; ')}`);
  console.error('Qloo API integration failed:', finalError.message);
  throw finalError;
}

// Helper functions for parsing Qloo API responses

// Generate taste vector from Qloo entities
function generateTasteVectorFromEntities(entities: Record<string, unknown>[], themes: string[]): TasteVector {
  const vector = generateMockTasteVector(themes, [], ''); // Start with base vector
  
  // Analyze entity tags to refine taste vector
  entities.forEach(entity => {
    const tags = (entity.tags as Record<string, unknown>[]) || [];
    const popularity = (entity.popularity as number) || 0;
    const query = entity.query as Record<string, unknown> | undefined;
    const affinity = (query?.affinity as number) || 0;
    
    tags.forEach((tag: Record<string, unknown>) => {
      const tagName = (tag.name as string)?.toLowerCase() || '';
      const weight = (popularity + affinity) / 2;
      
      if (tagName.includes('outdoor') || tagName.includes('adventure')) {
        vector.adventure = Math.min(vector.adventure + (weight * 0.3), 1.0);
      }
      if (tagName.includes('culture') || tagName.includes('art') || tagName.includes('history')) {
        vector.culture = Math.min(vector.culture + (weight * 0.3), 1.0);
      }
      if (tagName.includes('luxury') || tagName.includes('premium')) {
        vector.luxury = Math.min(vector.luxury + (weight * 0.3), 1.0);
      }
      if (tagName.includes('food') || tagName.includes('culinary')) {
        vector.food = Math.min(vector.food + (weight * 0.3), 1.0);
      }
      if (tagName.includes('nature') || tagName.includes('scenic') || tagName.includes('beach')) {
        vector.nature = Math.min(vector.nature + (weight * 0.3), 1.0);
      }
      if (tagName.includes('urban') || tagName.includes('city')) {
        vector.urban = Math.min(vector.urban + (weight * 0.3), 1.0);
      }
    });
  });
  
  return vector;
}

// Extract cultural affinities from Qloo entities
function extractCulturalAffinities(entities: Record<string, unknown>[]): string[] {
  const affinities = new Set<string>();
  
  entities.forEach(entity => {
    const tags = (entity.tags as Record<string, unknown>[]) || [];
    tags.forEach((tag: Record<string, unknown>) => {
      const tagName = tag.name as string;
      if (tagName && !tagName.includes('Destination')) {
        affinities.add(tagName);
      }
    });
  });
  
  return Array.from(affinities).slice(0, 6);
}

// Generate personality traits from destinations
function generatePersonalityFromDestinations(destinations: string[], themes: string[]): string[] {
  const traits = new Set<string>();
  
  // Add theme-based traits
  themes.forEach(theme => {
    switch (theme.toLowerCase()) {
      case 'adventure':
        traits.add('Adventure Seeker');
        break;
      case 'culture':
        traits.add('Culture Enthusiast');
        break;
      case 'photography':
        traits.add('Visual Storyteller');
        break;
      case 'travel':
        traits.add('Global Explorer');
        break;
      case 'food':
        traits.add('Culinary Explorer');
        break;
    }
  });
  
  // Add destination-based traits
  if (destinations.some(d => d.includes('Beach') || d.includes('Coast'))) {
    traits.add('Beach Lover');
  }
  if (destinations.some(d => d.includes('Mountain') || d.includes('Alps'))) {
    traits.add('Mountain Explorer');
  }
  
  return Array.from(traits).slice(0, 5);
}

// Helper function to check Qloo API configuration
function isQlooConfigured(): boolean {
  return !!(process.env.QLOO_API_KEY && process.env.QLOO_API_URL);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { themes, hints, contentType, socialLinks, demographics } = body;

    // Validate required fields
    if (!themes || !Array.isArray(themes)) {
      return NextResponse.json(
        { error: "themes array is required" },
        { status: 400 }
      );
    }

    if (!hints || !Array.isArray(hints)) {
      return NextResponse.json(
        { error: "hints array is required" },
        { status: 400 }
      );
    }

    // Log configuration status
    console.log(`Qloo API configured: ${isQlooConfigured()}`);
    if (isQlooConfigured()) {
      console.log(`Qloo API URL: ${process.env.QLOO_API_URL}`);
      console.log(`Qloo API Key present: ${!!process.env.QLOO_API_KEY}`);
    }

    // Prepare Qloo request
    const qlooRequest: QlooRequest = {
      themes,
      hints,
      contentType: contentType || "Mixed Content",
      socialLinks: socialLinks || [],
      demographics: demographics || {},
    };

    // Try real Qloo API first, fallback to enhanced mock system
    let qlooResponse: QlooResponse;
    let usedRealAPI = false;
    
    if (isQlooConfigured()) {
      try {
        console.log("Attempting to use real Qloo API...");
        qlooResponse = await callQlooAPI(qlooRequest);
        console.log("Successfully received data from Qloo API");
        usedRealAPI = true;
      } catch (error) {
        console.log("Qloo API failed, using enhanced mock system as fallback:", error);
        // Use enhanced mock as fallback
        const mockVector = generateMockTasteVector(themes, hints, contentType);
        qlooResponse = {
          tasteVector: mockVector,
          recommendations: generateSmartRecommendations(mockVector, themes),
          confidence: calculateConfidence(themes, hints),
          culturalAffinities: generateCulturalAffinities(mockVector),
          personalityTraits: generatePersonalityTraits(mockVector),
          processingTime: "Mock AI analysis (Qloo API fallback)"
        };
      }
    } else {
      console.log("Qloo API not configured, using enhanced mock system");
      // Use enhanced mock system
      const mockVector = generateMockTasteVector(themes, hints, contentType);
      qlooResponse = {
        tasteVector: mockVector,
        recommendations: generateSmartRecommendations(mockVector, themes),
        confidence: calculateConfidence(themes, hints),
        culturalAffinities: generateCulturalAffinities(mockVector),
        personalityTraits: generatePersonalityTraits(mockVector),
        processingTime: "Mock AI analysis (API not configured)"
      };
    }

    // Simulate processing time for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      data: qlooResponse,
      metadata: {
        inputThemes: themes.length,
        inputHints: hints.length,
        confidenceLevel:
          qlooResponse.confidence > 0.8
            ? "High"
            : qlooResponse.confidence > 0.6
            ? "Medium"
            : "Low",
        processingTime: qlooResponse.processingTime,
        timestamp: new Date().toISOString(),
        apiSource: usedRealAPI ? "qloo-api" : "mock-system",
        qlooConfigured: isQlooConfigured(),
      },
    });
  } catch (error) {
    console.error("Error generating taste profile:", error);
    return NextResponse.json(
      {
        error: "Failed to generate taste profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
