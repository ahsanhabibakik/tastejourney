// Enhanced API Service with Gemini Integration
// This service handles API failover and smart fallbacks

import { RecommendationResponse, Recommendation } from './api';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface ApiServiceConfig {
  retryAttempts: number;
  timeoutMs: number;
  enableGeminiEnhancement: boolean;
}

class EnhancedApiService {
  private config: ApiServiceConfig = {
    retryAttempts: 2,
    timeoutMs: 10000,
    enableGeminiEnhancement: true
  };

  async callGeminiAPI(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async enhanceRecommendationsWithAI(
    recommendations: Recommendation[],
    userProfile: any,
    preferences: any
  ): Promise<Recommendation[]> {
    if (!this.config.enableGeminiEnhancement || !GEMINI_API_KEY) {
      return recommendations;
    }

    try {
      const enhancementPrompt = `
You are a travel industry expert. Enhance these travel recommendations with more detailed and personalized insights.

User Profile:
- Content themes: ${userProfile.themes?.join(', ') || 'Mixed'}
- Content type: ${userProfile.contentType || 'General'}
- Budget preference: ${preferences?.budget || 'Flexible'}
- Travel style: ${preferences?.style || 'Mixed'}

Current Recommendations:
${recommendations.map((rec, i) => `${i + 1}. ${rec.destination} (Score: ${rec.matchScore})`).join('\n')}

For each recommendation, provide:
1. Enhanced highlights that specifically appeal to this creator's audience
2. Specific content creation opportunities
3. Brand partnership potential
4. Local creator collaboration prospects

Respond with a JSON array containing enhanced data for each destination:
[
  {
    "destinationIndex": 0,
    "enhancedHighlights": ["...", "...", "..."],
    "contentOpportunities": ["...", "...", "..."],
    "brandPartnerships": ["...", "...", "..."],
    "creatorCollabs": ["...", "...", "..."],
    "uniqueSellingPoints": ["...", "...", "..."]
  }
]
`;

      const aiResponse = await this.callGeminiAPI(enhancementPrompt);
      const enhancements = this.parseJsonFromAI(aiResponse);
      
      if (enhancements && Array.isArray(enhancements)) {
        return recommendations.map((rec, index) => {
          const enhancement = enhancements[index];
          if (enhancement) {
            return {
              ...rec,
              highlights: enhancement.enhancedHighlights || rec.highlights,
              extended: {
                ...rec.extended,
                contentOpportunities: {
                  videoIdeas: enhancement.contentOpportunities?.slice(0, 5) || [],
                  photoSpots: enhancement.contentOpportunities?.slice(5, 10) || [],
                  storytellingAngles: enhancement.uniqueSellingPoints || []
                },
                localCreators: {
                  topCollaborators: enhancement.creatorCollabs?.map((collab: string) => ({
                    name: collab,
                    platform: 'Instagram',
                    followers: Math.floor(Math.random() * 100000) + 10000,
                    collaborationReason: 'AI-identified opportunity'
                  })) || [],
                  networkingOpportunities: enhancement.brandPartnerships || []
                }
              }
            };
          }
          return rec;
        });
      }
    } catch (error) {
      console.warn('Failed to enhance recommendations with AI:', error);
    }

    return recommendations;
  }

  async generateDynamicContent(
    prompt: string,
    maxRetries: number = 2
  ): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const aiResponse = await this.callGeminiAPI(prompt);
        return this.parseJsonFromAI(aiResponse);
      } catch (error) {
        console.warn(`AI generation attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries) {
          throw new Error('Failed to generate dynamic content after retries');
        }
        await this.delay(1000 * (attempt + 1)); // Exponential backoff
      }
    }
  }

  private parseJsonFromAI(aiResponse: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.warn('Failed to parse JSON from AI response:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback data generators for when APIs fail
  generateFallbackRecommendations(userProfile: any, preferences: any): Recommendation[] {
    const budgetMap: Record<string, string> = {
      '$500-1000': '$800 - $1,200',
      '$1000-2500': '$1,200 - $2,000',
      '$2500-5000': '$2,500 - $3,500',
      '$5000+': '$3,500 - $5,000+'
    };

    const styleDestinations: Record<string, string[]> = {
      'Adventure': ['Bali, Indonesia', 'Costa Rica', 'Nepal'],
      'Luxury': ['Dubai, UAE', 'Maldives', 'Monaco'],
      'Cultural': ['Kyoto, Japan', 'Istanbul, Turkey', 'Prague, Czech Republic'],
      'Beach': ['Santorini, Greece', 'Bali, Indonesia', 'Maldives'],
      'Urban': ['Tokyo, Japan', 'New York, USA', 'London, UK']
    };

    const selectedDestinations = styleDestinations[preferences?.style] || 
                               styleDestinations['Cultural'] || 
                               ['Bali, Indonesia', 'Lisbon, Portugal', 'Dubai, UAE'];

    return selectedDestinations.slice(0, 3).map((dest, index) => ({
      id: index + 1,
      destination: dest,
      matchScore: 85 - (index * 3),
      image: this.getDestinationImage(dest),
      highlights: [
        `Perfect for ${userProfile.contentType || 'content creation'}`,
        `Aligns with ${preferences?.style || 'mixed'} travel style`,
        `Budget-friendly within ${preferences?.budget || 'your range'}`
      ],
      budget: {
        range: budgetMap[preferences?.budget] || '$1,200 - $2,000',
        breakdown: `${preferences?.duration || '7'} days including accommodation & activities`
      },
      engagement: {
        potential: index === 0 ? 'Very High' : index === 1 ? 'High' : 'Good',
        reason: `Strong alignment with your ${userProfile.themes?.join(' & ') || 'content'} focus`
      },
      collaborations: ['Local tourism boards', 'Regional brands', 'Experience providers'],
      creators: Math.floor(Math.random() * 100) + 20,
      bestMonths: this.getBestMonths(dest),
      extended: {
        detailedDescription: `AI-generated recommendation for ${dest} based on your profile`,
        confidence: 0.75,
        factChecked: false,
        contentOpportunities: {
          videoIdeas: ['Local experiences', 'Cultural insights', 'Hidden gems', 'Food tours', 'Adventure activities'],
          photoSpots: ['Iconic landmarks', 'Local markets', 'Scenic viewpoints', 'Cultural sites', 'Street scenes'],
          storytellingAngles: ['Cultural immersion', 'Adventure seeking', 'Local discoveries']
        }
      }
    }));
  }

  private getDestinationImage(destination: string): string {
    const imageMap: Record<string, string> = {
      'Bali, Indonesia': 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Dubai, UAE': 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Lisbon, Portugal': 'https://images.pexels.com/photos/1534630/pexels-photo-1534630.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Tokyo, Japan': 'https://images.pexels.com/photos/315658/pexels-photo-315658.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Santorini, Greece': 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400'
    };

    return imageMap[destination] || 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  private getBestMonths(destination: string): string[] {
    const seasonMap: Record<string, string[]> = {
      'Bali, Indonesia': ['April-May', 'September-October'],
      'Dubai, UAE': ['November-March'],
      'Lisbon, Portugal': ['May-June', 'September-October'],
      'Tokyo, Japan': ['March-May', 'September-November'],
      'Santorini, Greece': ['May-June', 'September']
    };

    return seasonMap[destination] || ['Year-round'];
  }
}

export const enhancedApiService = new EnhancedApiService();
