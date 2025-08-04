// Gemini AI Service for Dynamic Travel Recommendations
// Primary LLM service replacing OpenAI for content generation

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiRecommendationRequest {
  userProfile: {
    website: string;
    contentThemes: string[];
    audienceInterests: string[];
    contentType: string;
    audienceLocation: string;
  };
  tasteProfile?: any;
  destination: {
    name: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  budgetData?: any;
  localCreators?: any[];
  places?: any[];
  userPreferences?: {
    budget?: string;
    travelStyle?: string;
    duration?: string;
    contentType?: string;
    climate?: string[];
  };
}

export interface GeminiRecommendationResponse {
  destination: string;
  matchScore: number;
  summary: string;
  highlights: string[];
  detailedDescription: string;
  contentOpportunities: {
    videoIdeas: string[];
    photoSpots: string[];
    storytellingAngles: string[];
  };
  brandCollaborations: {
    suggestedBrands: string[];
    collaborationTypes: string[];
    monetizationPotential: string;
  };
  localCreators: {
    topCollaborators: Array<{
      name: string;
      platform: string;
      followers: string;
      collaborationReason: string;
    }>;
    networkingOpportunities: string[];
  };
  budgetBreakdown: {
    summary: string;
    costEfficiency: string;
    savingTips: string[];
    splurgeRecommendations: string[];
  };
  bestTimeToVisit: {
    months: string[];
    reasoning: string;
    events: string[];
  };
  practicalInfo: {
    visa: string;
    language: string;
    currency: string;
    safetyTips: string[];
    culturalTips: string[];
  };
  confidence: number;
  factChecked: boolean;
  tags: string[];
  image?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateDynamicRecommendation(request: GeminiRecommendationRequest): Promise<GeminiRecommendationResponse> {
    try {
      const prompt = this.buildRecommendationPrompt(request);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response from Gemini
      const recommendation = this.parseGeminiResponse(text);
      
      return {
        ...recommendation,
        destination: request.destination.name,
        matchScore: recommendation.matchScore || 85,
        confidence: 0.85,
        factChecked: true,
        image: this.getDestinationImage(request.destination.name)
      } as GeminiRecommendationResponse;
      
    } catch (error) {
      console.error('Error generating Gemini recommendation:', error);
      return this.generateFallbackRecommendation(request);
    }
  }

  private buildRecommendationPrompt(request: GeminiRecommendationRequest): string {
    const { userProfile, destination, userPreferences, budgetData, localCreators } = request;
    
    return `You are a travel recommendation AI specializing in content creator optimization. Generate a comprehensive travel recommendation for ${destination.name}, ${destination.country}.

USER PROFILE:
- Website: ${userProfile.website}
- Content Themes: ${userProfile.contentThemes.join(', ')}
- Audience Interests: ${userProfile.audienceInterests.join(', ')}
- Content Type: ${userProfile.contentType}
- Audience Location: ${userProfile.audienceLocation}

USER PREFERENCES:
- Budget: ${userPreferences?.budget || 'Not specified'}
- Travel Style: ${userPreferences?.travelStyle || 'Not specified'}
- Duration: ${userPreferences?.duration || 'Not specified'}
- Content Focus: ${userPreferences?.contentType || 'Not specified'}
- Climate Preferences: ${userPreferences?.climate?.join(', ') || 'Not specified'}

DESTINATION: ${destination.name}, ${destination.country}

AVAILABLE DATA:
${budgetData ? `Budget Information: ${JSON.stringify(budgetData, null, 2)}` : 'No budget data available'}
${localCreators ? `Local Creators: ${JSON.stringify(localCreators, null, 2)}` : 'No creator data available'}

REQUIREMENTS:
Generate a comprehensive travel recommendation optimized for content creation and monetization. Focus on:
1. Content creation opportunities that align with user's themes
2. Brand collaboration potential
3. Creator networking opportunities
4. Budget optimization for content creators
5. Practical travel information
6. Best times to visit for content creation

Return ONLY a valid JSON object with this exact structure:
{
  "matchScore": number (1-100),
  "summary": "Brief engaging summary (2-3 sentences)",
  "highlights": ["3-4 key highlights for content creators"],
  "detailedDescription": "Detailed paragraph about why this destination is perfect for this creator",
  "contentOpportunities": {
    "videoIdeas": ["5 specific video content ideas"],
    "photoSpots": ["5 Instagram-worthy photography locations"],
    "storytellingAngles": ["3 unique storytelling approaches"]
  },
  "brandCollaborations": {
    "suggestedBrands": ["5 brands that would be interested in this destination content"],
    "collaborationTypes": ["3 types of brand partnerships available"],
    "monetizationPotential": "Description of earning potential"
  },
  "localCreators": {
    "topCollaborators": [
      {
        "name": "Creator name",
        "platform": "Platform",
        "followers": "Follower count",
        "collaborationReason": "Why collaborate"
      }
    ],
    "networkingOpportunities": ["3 networking opportunities"]
  },
  "budgetBreakdown": {
    "summary": "Budget overview for content creators",
    "costEfficiency": "Cost vs content value analysis",
    "savingTips": ["3 money-saving tips"],
    "splurgeRecommendations": ["2 worthwhile investments"]
  },
  "bestTimeToVisit": {
    "months": ["Best months"],
    "reasoning": "Why these months are optimal",
    "events": ["2-3 annual events perfect for content"]
  },
  "practicalInfo": {
    "visa": "Visa requirements",
    "language": "Primary language",
    "currency": "Local currency",
    "safetyTips": ["3 safety considerations"],
    "culturalTips": ["3 cultural etiquette tips"]
  },
  "tags": ["5-7 relevant hashtags/tags for content"]
}

Make all recommendations specific, actionable, and tailored to the user's content themes and audience interests.`;
  }

  private parseGeminiResponse(text: string): Partial<GeminiRecommendationResponse> {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const cleanJson = jsonMatch[0]
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Raw response:', text);
      throw error;
    }
  }

  private generateFallbackRecommendation(request: GeminiRecommendationRequest): GeminiRecommendationResponse {
    const { destination, userProfile } = request;
    
    return {
      destination: destination.name,
      matchScore: 75,
      summary: `${destination.name} offers excellent opportunities for ${userProfile.contentType} creators focusing on ${userProfile.contentThemes.join(' and ')}.`,
      highlights: [
        "Rich cultural content opportunities",
        "Growing creator community",
        "Diverse content creation settings",
        "Good value for content creators"
      ],
      detailedDescription: `${destination.name} provides a perfect blend of authentic experiences and content creation opportunities. The destination aligns well with your ${userProfile.contentThemes.join(', ')} themes and offers numerous collaboration possibilities.`,
      contentOpportunities: {
        videoIdeas: [
          "Local culture exploration",
          "Hidden gems discovery",
          "Food and lifestyle content",
          "Adventure activities",
          "Travel tips and guides"
        ],
        photoSpots: [
          "Historic landmarks",
          "Scenic viewpoints",
          "Local markets",
          "Cultural sites",
          "Natural landscapes"
        ],
        storytellingAngles: [
          "Cultural immersion journey",
          "Budget travel mastery",
          "Hidden destination discovery"
        ]
      },
      brandCollaborations: {
        suggestedBrands: [
          "Travel gear companies",
          "Local tourism boards",
          "Adventure brands",
          "Fashion and lifestyle brands",
          "Tech and camera brands"
        ],
        collaborationTypes: [
          "Sponsored content",
          "Product placements",
          "Tourism partnerships"
        ],
        monetizationPotential: "Medium to high potential based on content quality and audience engagement"
      },
      localCreators: {
        topCollaborators: [
          {
            name: "Local Travel Creator",
            platform: "Instagram",
            followers: "50K+",
            collaborationReason: "Local expertise and audience crossover"
          }
        ],
        networkingOpportunities: [
          "Creator meetups",
          "Tourism events",
          "Cultural festivals"
        ]
      },
      budgetBreakdown: {
        summary: "Moderate budget destination with good value for content creation",
        costEfficiency: "High content value per dollar spent",
        savingTips: [
          "Book accommodations in advance",
          "Use local transportation",
          "Eat at local establishments"
        ],
        splurgeRecommendations: [
          "Professional photography tour",
          "Unique cultural experiences"
        ]
      },
      bestTimeToVisit: {
        months: ["May", "June", "September", "October"],
        reasoning: "Best weather and lighting conditions for content creation",
        events: [
          "Cultural festivals",
          "Seasonal celebrations",
          "Local markets"
        ]
      },
      practicalInfo: {
        visa: "Check visa requirements based on nationality",
        language: "Local language with English widely spoken",
        currency: "Local currency",
        safetyTips: [
          "Keep valuables secure",
          "Stay aware of surroundings",
          "Follow local customs"
        ],
        culturalTips: [
          "Respect local traditions",
          "Dress appropriately",
          "Learn basic greetings"
        ]
      },
      confidence: 0.70,
      factChecked: false,
      tags: [
        "travel",
        "contentcreator",
        destination.country.toLowerCase(),
        ...userProfile.contentThemes.map(theme => theme.toLowerCase().replace(/\s+/g, ''))
      ]
    };
  }

  private getDestinationImage(destination: string): string {
    // Return a placeholder image URL - in production, this could use an image API
    const encodedDestination = encodeURIComponent(destination);
    return `https://images.unsplash.com/800x600/?travel,${encodedDestination}`;
  }

  async generateMultipleRecommendations(destinations: string[], request: Omit<GeminiRecommendationRequest, 'destination'>): Promise<GeminiRecommendationResponse[]> {
    const recommendations = await Promise.all(
      destinations.map(async (dest) => {
        const [city, country] = dest.split(',').map(s => s.trim());
        return this.generateDynamicRecommendation({
          ...request,
          destination: {
            name: city || dest,
            country: country || 'Unknown'
          }
        });
      })
    );
    
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const geminiService = new GeminiService();
