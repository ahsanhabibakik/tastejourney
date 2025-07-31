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

// Real Qloo API integration
// See Qloo API docs: https://docs.qloo.com/
async function callQlooAPI(request: QlooRequest): Promise<QlooResponse> {
  // Qloo Insights API integration (see https://docs.qloo.com/reference/insights-api-deep-dive)
  const response = await fetch(`${process.env.QLOO_API_URL}/v1/taste/profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.QLOO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content_themes: request.themes,
      content_hints: request.hints,
      content_type: request.contentType,
      social_profiles: request.socialLinks,
      demographics: request.demographics
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qloo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // Map Qloo API response to local QlooResponse type
  return {
    tasteVector: data.taste_vector || {},
    recommendations: data.recommendations || [],
    confidence: data.confidence || 0,
    culturalAffinities: data.cultural_affinities || [],
    personalityTraits: data.personality_traits || [],
    processingTime: data.processing_time || "API call"
  };
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
    
    try {
      // Try Qloo API first
      qlooResponse = await callQlooAPI(qlooRequest);
    } catch (error) {
      console.log("Qloo API unavailable, using mock data:", error);
      // Fallback to mock data
      const mockVector = generateMockTasteVector(themes, hints, contentType);
      qlooResponse = {
        tasteVector: mockVector,
        recommendations: [],
        confidence: 0.8,
        culturalAffinities: generateCulturalAffinities(mockVector),
        personalityTraits: generatePersonalityTraits(mockVector),
        processingTime: "Mock generation"
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
