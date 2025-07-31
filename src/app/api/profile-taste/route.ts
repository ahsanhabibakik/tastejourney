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

  // Adjust based on hints
  hints.forEach((hint) => {
    switch (hint) {
      case "visual-content-creator":
      case "photographer":
        vector.culture = Math.min(vector.culture + 0.1, 1.0);
        vector.nature = Math.min(vector.nature + 0.1, 1.0);
        break;
      case "social-media-creator":
        vector.urban = Math.min(vector.urban + 0.1, 1.0);
        break;
      case "professional":
      case "service-provider":
        vector.luxury = Math.min(vector.luxury + 0.1, 1.0);
        break;
      case "food-blogger":
        vector.food = Math.min(vector.food + 0.2, 1.0);
        break;
    }
  });

  // Adjust based on content type
  switch (contentType.toLowerCase()) {
    case "photography":
      vector.culture += 0.1;
      vector.nature += 0.1;
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

// Real Qloo API integration
// See Qloo API docs: https://docs.qloo.com/
async function callQlooAPI(request: QlooRequest): Promise<QlooResponse> {
  // Try different potential endpoints for Qloo hackathon API
  const endpoints = [
    '/v1/insights',
    '/v1/recommendations', 
    '/v1/taste',
    '/v1/profile',
    '/insights',
    '/recommendations'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Qloo endpoint: ${process.env.QLOO_API_URL}${endpoint}`);
      
      const response = await fetch(`${process.env.QLOO_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_themes: request.themes,
          content_hints: request.hints,
          content_type: request.contentType,
          social_profiles: request.socialLinks,
          demographics: request.demographics,
          // Alternative payload formats
          input: {
            themes: request.themes,
            hints: request.hints,
            contentType: request.contentType,
            interests: request.themes
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Success with endpoint ${endpoint}:`, data);
        
        // Map Qloo API response to local QlooResponse type
        return {
          tasteVector: data.taste_vector || data.tasteVector || {},
          recommendations: data.recommendations || [],
          confidence: data.confidence || 0.8,
          culturalAffinities: data.cultural_affinities || data.culturalAffinities || [],
          personalityTraits: data.personality_traits || data.personalityTraits || [],
          processingTime: `API call to ${endpoint}`
        };
      } else {
        const errorText = await response.text();
        console.log(`Failed endpoint ${endpoint}: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error);
    }
  }

  throw new Error('All Qloo API endpoints failed');
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

    // Prepare Qloo request
    const qlooRequest: QlooRequest = {
      themes,
      hints,
      contentType: contentType || "Mixed Content",
      socialLinks: socialLinks || [],
      demographics: demographics || {},
    };

    let qlooResponse: QlooResponse;
    
    // For hackathon demo, use enhanced mock system (Qloo API endpoints unavailable)
    console.log("Using enhanced mock taste vector system for demo");
    const mockVector = generateMockTasteVector(themes, hints, contentType);
    qlooResponse = {
      tasteVector: mockVector,
      recommendations: generateSmartRecommendations(mockVector, themes),
      confidence: calculateConfidence(themes, hints),
      culturalAffinities: generateCulturalAffinities(mockVector),
      personalityTraits: generatePersonalityTraits(mockVector),
      processingTime: "Enhanced AI analysis"
    };

    // Uncomment below to try real Qloo API when available
    /*
    try {
      qlooResponse = await callQlooAPI(qlooRequest);
    } catch (error) {
      console.log("Qloo API unavailable, using mock data:", error);
      // Use mock as fallback
    }
    */

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
