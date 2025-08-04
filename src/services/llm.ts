// LLM-powered Recommendation Generation Service
// Based on PRD requirements for GPT-powered dynamic recommendations

import { QlooTasteProfile } from './qloo';
import { BudgetBreakdown } from './budget';
import { CreatorProfile } from './creator';
import { PlaceDetails } from './places';
import { LocationFactCheck } from './factcheck';
import { ScoringResult } from './scoring';

export interface LLMRecommendationRequest {
  userProfile: {
    website: string;
    contentThemes: string[];
    audienceInterests: string[];
    contentType: string;
    audienceLocation: string;
  };
  tasteProfile: QlooTasteProfile;
  destination: {
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  budgetData: BudgetBreakdown;
  localCreators: CreatorProfile[];
  places: PlaceDetails[];
  factCheck: LocationFactCheck;
  scoringResult: ScoringResult;
  userPreferences?: {
    budget?: number;
    travelStyle?: 'budget' | 'mid-range' | 'luxury';
    duration?: number;
    contentType?: string;
  };
}

export interface LLMRecommendationResponse {
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
      followers: number;
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
}

class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-4';
  }

  async generateRecommendation(request: LLMRecommendationRequest): Promise<LLMRecommendationResponse> {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not found, using fallback recommendation generation');
        return this.generateFallbackRecommendation(request);
      }

      const prompt = this.buildRecommendationPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      const parsedResponse = JSON.parse(content);
      return this.formatLLMResponse(parsedResponse, request);
    } catch (error) {
      console.error('Error generating LLM recommendation:', error);
      return this.generateFallbackRecommendation(request);
    }
  }

  private getSystemPrompt(): string {
    return `You are a travel recommendation expert specializing in content creator travel planning. Your role is to analyze user profiles, taste preferences, and destination data to create personalized travel recommendations that maximize:

1. Audience engagement potential
2. Brand collaboration opportunities  
3. Content creation opportunities
4. Budget efficiency
5. Local creator networking

Always provide responses in valid JSON format with the exact structure requested. Be specific, actionable, and focus on opportunities for content creators to grow their audience and monetize their travel.

Consider cultural sensitivity, safety, and factual accuracy in all recommendations. If any information seems uncertain, indicate lower confidence levels.`;
  }

  private buildRecommendationPrompt(request: LLMRecommendationRequest): string {
    return `Create a comprehensive travel recommendation for a content creator with the following profile:

**Creator Profile:**
- Website: ${request.userProfile.website}
- Content Themes: ${request.userProfile.contentThemes.join(', ')}
- Audience Interests: ${request.userProfile.audienceInterests.join(', ')}
- Content Type: ${request.userProfile.contentType}
- Audience Location: ${request.userProfile.audienceLocation}

**Taste Profile:**
- Cultural Affinities: ${request.tasteProfile.culturalAffinities.join(', ')}
- Personality Traits: ${request.tasteProfile.personalityTraits.join(', ')}
- Confidence: ${request.tasteProfile.confidence}

**Destination:** ${request.destination.name}, ${request.destination.country}

**Budget Information:**
- Flight Cost: $${request.budgetData.flights.price}
- Accommodation: $${request.budgetData.accommodation.pricePerNight}/night
- Daily Living: $${request.budgetData.livingExpenses.dailyBudget}
- Total Estimate: $${request.budgetData.totalEstimate.min}-${request.budgetData.totalEstimate.max}

**Local Creators Available:** ${request.localCreators.length} creators found
Top Creators: ${request.localCreators.slice(0, 3).map(c => `${c.displayName} (${c.platform}, ${c.followerCount} followers)`).join(', ')}

**Key Attractions:** ${request.places.slice(0, 5).map(p => p.name).join(', ')}

**Match Score:** ${request.scoringResult.totalScore}/100
- Qloo Affinity: ${Math.round(request.scoringResult.breakdown.qlooAffinity.score * 100)}%
- Community Engagement: ${Math.round(request.scoringResult.breakdown.communityEngagement.score * 100)}%
- Brand Collaboration: ${Math.round(request.scoringResult.breakdown.brandCollaborationFit.score * 100)}%

**Fact Check Status:** Overall Confidence: ${Math.round(request.factCheck.overallConfidence * 100)}%

**User Preferences:**
${request.userPreferences ? `
- Budget: $${request.userPreferences.budget || 'Not specified'}
- Travel Style: ${request.userPreferences.travelStyle || 'Not specified'}
- Duration: ${request.userPreferences.duration || 'Not specified'} days
- Content Type: ${request.userPreferences.contentType || 'Not specified'}
` : 'No specific preferences provided'}

Please provide a comprehensive recommendation in the following JSON structure:
{
  "destination": "destination name",
  "matchScore": number,
  "summary": "brief engaging summary",
  "highlights": ["3-5 key highlights"],
  "detailedDescription": "comprehensive description",
  "contentOpportunities": {
    "videoIdeas": ["5 specific video content ideas"],
    "photoSpots": ["5 Instagram-worthy locations"],
    "storytellingAngles": ["3 unique narrative approaches"]
  },
  "brandCollaborations": {
    "suggestedBrands": ["5 relevant brand types"],
    "collaborationTypes": ["3 collaboration formats"],
    "monetizationPotential": "assessment of earning potential"
  },
  "localCreators": {
    "topCollaborators": [{"name": "creator name", "platform": "platform", "followers": number, "collaborationReason": "why collaborate"}],
    "networkingOpportunities": ["networking strategies"]
  },
  "budgetBreakdown": {
    "summary": "budget assessment",
    "costEfficiency": "value analysis",
    "savingTips": ["money-saving suggestions"],
    "splurgeRecommendations": ["worth the extra cost"]
  },
  "bestTimeToVisit": {
    "months": ["optimal months"],
    "reasoning": "seasonal explanation",
    "events": ["local events/festivals"]
  },
  "practicalInfo": {
    "visa": "visa requirements",
    "language": "language info",
    "currency": "currency info",
    "safetyTips": ["safety recommendations"],
    "culturalTips": ["cultural etiquette"]
  },
  "confidence": number_between_0_and_1,
  "factChecked": boolean
}`;
  }

  private formatLLMResponse(parsedResponse: Record<string, unknown>, request: LLMRecommendationRequest): LLMRecommendationResponse {
    return {
      destination: (parsedResponse.destination as string) || request.destination.name,
      matchScore: (parsedResponse.matchScore as number) || request.scoringResult.totalScore,
      summary: (parsedResponse.summary as string) || 'AI-generated recommendation summary',
      highlights: (parsedResponse.highlights as string[]) || [],
      detailedDescription: (parsedResponse.detailedDescription as string) || '',
      contentOpportunities: {
        videoIdeas: (parsedResponse.contentOpportunities as any)?.videoIdeas || [],
        photoSpots: (parsedResponse.contentOpportunities as any)?.photoSpots || [],
        storytellingAngles: (parsedResponse.contentOpportunities as any)?.storytellingAngles || []
      },
      brandCollaborations: {
        suggestedBrands: (parsedResponse.brandCollaborations as any)?.suggestedBrands || [],
        collaborationTypes: (parsedResponse.brandCollaborations as any)?.collaborationTypes || [],
        monetizationPotential: (parsedResponse.brandCollaborations as any)?.monetizationPotential || 'Moderate potential'
      },
      localCreators: {
        topCollaborators: (parsedResponse.localCreators as any)?.topCollaborators || [],
        networkingOpportunities: (parsedResponse.localCreators as any)?.networkingOpportunities || []
      },
      budgetBreakdown: {
        summary: (parsedResponse.budgetBreakdown as any)?.summary || 'Budget analysis unavailable',
        costEfficiency: (parsedResponse.budgetBreakdown as any)?.costEfficiency || 'Good value',
        savingTips: (parsedResponse.budgetBreakdown as any)?.savingTips || [],
        splurgeRecommendations: (parsedResponse.budgetBreakdown as any)?.splurgeRecommendations || []
      },
      bestTimeToVisit: {
        months: (parsedResponse.bestTimeToVisit as any)?.months || ['Year-round'],
        reasoning: (parsedResponse.bestTimeToVisit as any)?.reasoning || 'Weather and tourist seasons considered',
        events: (parsedResponse.bestTimeToVisit as any)?.events || []
      },
      practicalInfo: {
        visa: (parsedResponse.practicalInfo as any)?.visa || 'Check visa requirements',
        language: (parsedResponse.practicalInfo as any)?.language || 'Local language info',
        currency: (parsedResponse.practicalInfo as any)?.currency || 'Local currency',
        safetyTips: (parsedResponse.practicalInfo as any)?.safetyTips || [],
        culturalTips: (parsedResponse.practicalInfo as any)?.culturalTips || []
      },
      confidence: (parsedResponse.confidence as number) || 0.7,
      factChecked: (parsedResponse.factChecked as boolean) || false
    };
  }

  private generateFallbackRecommendation(request: LLMRecommendationRequest): LLMRecommendationResponse {
    const destination = request.destination.name;
    const country = request.destination.country;
    
    return {
      destination: `${destination}, ${country}`,
      matchScore: request.scoringResult.totalScore,
      summary: `${destination} offers great potential for content creators with your profile, scoring ${Math.round(request.scoringResult.totalScore)} out of 100 based on audience alignment and collaboration opportunities.`,
      highlights: [
        `Strong match with your ${request.userProfile.contentThemes.join(' and ')} content style`,
        `${request.localCreators.length} local creators available for collaboration`,
        `Budget-friendly destination with estimated costs of $${request.budgetData.totalEstimate.min}-${request.budgetData.totalEstimate.max}`,
        `${request.places.length} notable attractions and photo opportunities`,
        'Good potential for brand partnerships and audience engagement'
      ],
      detailedDescription: `${destination} presents an excellent opportunity for content creators focusing on ${request.userProfile.contentThemes.join(', ')}. With a match score of ${Math.round(request.scoringResult.totalScore)}/100, this destination aligns well with your audience interests in ${request.userProfile.audienceInterests.join(', ')}. The local creator community of ${request.localCreators.length} creators provides networking opportunities, while the diverse attractions offer varied content possibilities.`,
      contentOpportunities: {
        videoIdeas: [
          `Local culture and traditions in ${destination}`,
          `Budget travel guide to ${destination}`,
          `Creator collaboration vlog in ${destination}`,
          `Hidden gems and local experiences`,
          `${destination} food and lifestyle tour`
        ],
        photoSpots: request.places.slice(0, 5).map(p => p.name),
        storytellingAngles: [
          'Cultural immersion and learning experience',
          'Creator community and collaboration focus',
          'Budget-conscious travel strategies'
        ]
      },
      brandCollaborations: {
        suggestedBrands: [
          'Travel gear and luggage brands',
          'Local food and beverage companies',
          'Cultural experience providers',
          'Photography equipment brands',
          'Sustainable travel companies'
        ],
        collaborationTypes: [
          'Sponsored content creation',
          'Product placement and reviews',
          'Brand ambassador programs'
        ],
        monetizationPotential: 'Good potential based on audience alignment and local brand presence'
      },
      localCreators: {
        topCollaborators: request.localCreators.slice(0, 3).map(creator => ({
          name: creator.displayName,
          platform: creator.platform,
          followers: creator.followerCount,
          collaborationReason: `Strong local presence and ${Math.round(creator.collaborationPotential * 100)}% collaboration potential`
        })),
        networkingOpportunities: [
          'Join local creator meetups and events',
          'Participate in collaborative content projects',
          'Engage with local influencer communities'
        ]
      },
      budgetBreakdown: {
        summary: `Estimated total cost: $${request.budgetData.totalEstimate.min}-${request.budgetData.totalEstimate.max}`,
        costEfficiency: 'Good value destination with reasonable costs for content creation',
        savingTips: [
          'Book flights in advance for better rates',
          'Consider local accommodations over international chains',
          'Eat at local restaurants for authentic experiences',
          'Use public transportation when available'
        ],
        splurgeRecommendations: [
          'Professional photography session at iconic locations',
          'Unique local experiences for premium content',
          'High-quality accommodation for better video backgrounds'
        ]
      },
      bestTimeToVisit: {
        months: ['Year-round'],
        reasoning: 'Optimal timing depends on weather patterns and local events',
        events: ['Check local festival calendar for content opportunities']
      },
      practicalInfo: {
        visa: `Check visa requirements for ${country}`,
        language: `Local language considerations for ${country}`,
        currency: request.budgetData.totalEstimate.currency,
        safetyTips: [
          'Research current safety conditions',
          'Keep copies of important documents',
          'Stay connected with local emergency contacts'
        ],
        culturalTips: [
          'Research local customs and etiquette',
          'Learn basic phrases in the local language',
          'Respect cultural norms in content creation'
        ]
      },
      confidence: Math.min(request.scoringResult.confidence, request.factCheck.overallConfidence),
      factChecked: request.factCheck.overallConfidence > 0.7
    };
  }

  // Utility method to generate multiple recommendations
  async generateMultipleRecommendations(requests: LLMRecommendationRequest[]): Promise<LLMRecommendationResponse[]> {
    const recommendations = await Promise.all(
      requests.map(request => this.generateRecommendation(request))
    );

    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const llmService = new LLMService();