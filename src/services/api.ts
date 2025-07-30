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
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  totalCount: number;
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

// Get Travel Recommendations API
export async function getRecommendations(
  data: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
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
    console.error("Error getting recommendations:", error);
    // Return mock data for development
    return {
      recommendations: [
        {
          id: 1,
          destination: "Bali, Indonesia",
          matchScore: 94,
          image:
            "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400",
          highlights: [
            "Perfect for adventure & food content",
            "140+ active travel creators",
            "15 brand partnerships available",
          ],
          budget: {
            range: "$1,200 - $1,800",
            breakdown: "7 days including flights, accommodation & activities",
          },
          engagement: {
            potential: "High",
            reason: "Strong alignment with adventure & cultural content",
          },
          collaborations: [
            "AdventureBound Gear",
            "TasteTrek Culinary",
            "WanderStay Boutique Hotels",
          ],
          creators: 142,
          bestMonths: ["April-May", "September-October"],
        },
      ],
      totalCount: 1,
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
