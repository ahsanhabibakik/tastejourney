// API service functions for TasteJourney

export interface WebsiteAnalysisRequest {
  url: string;
}

export interface WebsiteAnalysisResponse {
  url: string;
  contentThemes: string[];
  audienceInterests: string[];
  postingFrequency: string;
  topPerformingContent: string;
  audienceLocation: string;
  preferredDestinations: string[];
}

export interface RecommendationRequest {
  websiteData: WebsiteAnalysisResponse;
  preferences?: {
    budget?: string;
    travelStyle?: string;
    contentType?: string;
  };
}

export interface Recommendation {
  id: number;
  destination: string;
  matchScore: number;
  image: string;
  highlights: string[];
  budget: {
    range: string;
    breakdown: string;
  };
  engagement: {
    potential: string;
    reason: string;
  };
  collaborations: string[];
  creators: number;
  bestMonths: string[];
  extended?: {
    detailedDescription?: string;
    contentOpportunities?: {
      videoIdeas?: string[];
      photoSpots?: string[];
      storytellingAngles?: string[];
    };
    localCreators?: {
      topCollaborators?: Array<{
        name: string;
        platform: string;
        followers: number;
        collaborationReason: string;
      }>;
      networkingOpportunities?: string[];
    };
    budgetBreakdown?: {
      summary?: string;
      costEfficiency?: string;
      savingTips?: string[];
      splurgeRecommendations?: string[];
    };
    practicalInfo?: {
      visa?: string;
      language?: string;
      currency?: string;
      safetyTips?: string[];
      culturalTips?: string[];
    };
    confidence?: number;
    factChecked?: boolean;
    scoringBreakdown?: Record<string, unknown>;
  };
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  totalCount: number;
  metadata?: {
    tasteProfile?: {
      culturalAffinities: string[];
      confidence: number;
    };
    processedAt?: string;
    apiVersion?: string;
    fallback?: boolean;
  };
}

// API Base URL - you can change this to your actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Website Analysis API
export async function analyzeWebsite(
  data: WebsiteAnalysisRequest
): Promise<WebsiteAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing website:", error);
    // Return mock data for development
    return {
      url: data.url,
      contentThemes: [
        "Travel Photography",
        "Food & Culture",
        "Adventure Sports",
      ],
      audienceInterests: [
        "Photography",
        "Food",
        "Adventure Travel",
        "Cultural Experiences",
      ],
      postingFrequency: "3-4 posts per week",
      topPerformingContent: "Video content (65% engagement)",
      audienceLocation: "North America (45%), Europe (30%), Asia (25%)",
      preferredDestinations: [
        "Mountain regions",
        "Coastal areas",
        "Urban destinations",
      ],
    };
  }
}

// Get Travel Recommendations API - Now supports dynamic recommendations
export async function getRecommendations(
  data: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        websiteData: data.websiteData,
        preferences: data.preferences
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Handle both new dynamic format and legacy format
    if (result.metadata?.apiVersion === 'dynamic-v1') {
      console.log('Received dynamic recommendations with metadata:', result.metadata);
      return {
        recommendations: result.recommendations,
        totalCount: result.totalCount,
        metadata: result.metadata
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    // Minimal fallback - main fallback logic is in route.ts
    return {
      recommendations: [],
      totalCount: 0,
      metadata: {
        fallback: true,
        processedAt: new Date().toISOString(),
        apiVersion: 'api-fallback-v2'
      } as any
    };
  }
}

// Get Additional Recommendations API
export async function getAdditionalRecommendations(
  criteria: string,
  websiteData: WebsiteAnalysisResponse
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/additional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ criteria, websiteData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting additional recommendations:", error);
    throw error;
  }
}

// Get Budget Planning API
export async function getBudgetPlanning(
  destination: string,
  preferences: Record<string, unknown>
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/budget-planning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ destination, preferences }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting budget planning:", error);
    throw error;
  }
}

// Get Brand Collaborations API
export async function getBrandCollaborations(
  destination: string,
  contentType: string
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/brand-collaborations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ destination, contentType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting brand collaborations:", error);
    throw error;
  }
}
