// Dynamic Recommendation Service - Comprehensive PRD Implementation
// Uses Gemini LLM as primary engine with fallbacks for external APIs

interface UserProfile {
  url: string;
  themes: string[];
  hints: string[];
  contentType: string;
  socialLinks: { platform: string; url: string }[];
  title: string;
  description: string;
  keywords?: string[];
  audienceLocation?: string;
}

interface TasteProfile {
  tasteVector: Record<string, number>;
  confidence?: number;
  culturalAffinities?: string[];
  personalityTraits?: string[];
}

interface UserPreferences {
  budget?: string;
  duration?: string;
  style?: string;
  contentFocus?: string;
  climate?: string | string[];
}

interface DynamicRecommendation {
  id: number;
  destination: string;
  country: string;
  matchScore: number;
  image: string;
  highlights: string[];
  budget: {
    range: string;
    breakdown: string;
    costEfficiency: string;
  };
  engagement: {
    potential: string;
    reason: string;
  };
  creators: {
    totalActiveCreators: number;
    topCreators: Array<{
      name: string;
      followers: string;
      niche: string;
      collaboration: string;
    }>;
    collaborationOpportunities: string[];
  };
  brands: {
    partnerships: string[];
    monetizationPotential: string;
    seasonalOpportunities: string[];
  };
  content: {
    videoIdeas: string[];
    photoSpots: string[];
    storytellingAngles: string[];
    bestTimeToVisit: string[];
  };
  practical: {
    visa: string;
    language: string;
    safetyTips: string[];
    culturalTips: string[];
  };
  confidence: number;
  reasoning: string;
}

class DynamicRecommendationService {
  private geminiApiKey: string;
  private geminiApiUrl: string;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY!;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateDynamicRecommendations(
    userProfile: UserProfile,
    tasteProfile: TasteProfile | null,
    preferences: UserPreferences
  ): Promise<{ recommendations: DynamicRecommendation[]; metadata: any }> {
    
    console.log('🚀 Starting dynamic recommendation generation...');
    
    // Step 1: Create comprehensive user analysis prompt
    const analysisPrompt = this.createUserAnalysisPrompt(userProfile, tasteProfile, preferences);
    
    // Step 2: Get AI-powered destination recommendations
    const destinationRecommendations = await this.getAIDestinationRecommendations(analysisPrompt);
    
    // Step 3: Enrich each recommendation with detailed analysis
    const enrichedRecommendations = await Promise.all(
      destinationRecommendations.map((dest, index) => 
        this.enrichRecommendation(dest, userProfile, preferences, index + 1)
      )
    );

    // Step 4: Apply final scoring and ranking
    const finalRecommendations = this.applyFinalScoring(enrichedRecommendations, preferences);

    return {
      recommendations: finalRecommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        userProfile: {
          themes: userProfile.themes,
          contentType: userProfile.contentType,
          audienceLocation: userProfile.audienceLocation
        },
        preferences,
        tasteProfile: tasteProfile ? {
          confidence: tasteProfile.confidence,
          culturalAffinities: tasteProfile.culturalAffinities
        } : null,
        apiVersion: 'dynamic-gemini-v1',
        totalProcessingSteps: 4
      }
    };
  }

  private createUserAnalysisPrompt(
    userProfile: UserProfile,
    tasteProfile: TasteProfile | null,
    preferences: UserPreferences
  ): string {
    return `
You are a world-class travel and content creation strategist. Analyze this content creator's profile and generate personalized travel destination recommendations.

CREATOR PROFILE:
Website: ${userProfile.url}
Content Themes: ${userProfile.themes.join(', ')}
Content Type: ${userProfile.contentType}
Audience Hints: ${userProfile.hints.join(', ')}
Audience Location: ${userProfile.audienceLocation || 'Global'}

TASTE PROFILE:
${tasteProfile ? `
Cultural Affinities: ${tasteProfile.culturalAffinities?.join(', ') || 'Not specified'}
Confidence Score: ${tasteProfile.confidence || 'Not available'}
Taste Vector Analysis: ${JSON.stringify(tasteProfile.tasteVector)}
` : 'Using content analysis for taste profiling'}

USER PREFERENCES:
Budget: ${preferences.budget || 'Flexible'}
Duration: ${preferences.duration || 'Flexible'}
Travel Style: ${preferences.style || 'Mixed'}
Content Focus: ${preferences.contentFocus || 'General'}
Climate Preference: ${Array.isArray(preferences.climate) ? preferences.climate.join(', ') : preferences.climate || 'Any'}

TASK: Generate exactly 3 unique travel destinations that would be perfect for this content creator. Consider:
1. Audience engagement potential based on their content themes
2. Brand collaboration opportunities in that location
3. Creator community and networking potential
4. Budget optimization and ROI
5. Content creation opportunities (photo/video spots)
6. Cultural alignment with their audience interests

Return ONLY a JSON array with this exact structure:
[
  {
    "destination": "City, Country",
    "country": "Country Name",
    "region": "Geographic Region",
    "matchReason": "Why this destination matches the creator's profile",
    "contentOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
    "audienceAlignment": "How this appeals to their audience",
    "budgetCategory": "budget-friendly|mid-range|luxury",
    "bestSeasons": ["season1", "season2"],
    "culturalFactors": ["factor1", "factor2", "factor3"]
  }
]

Focus on destinations that offer real value for content creators, not just popular tourist spots.
`;
  }

  private async getAIDestinationRecommendations(prompt: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
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
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      // Return fallback destinations
      return this.getFallbackDestinations();
    }
  }

  private async enrichRecommendation(
    baseRecommendation: any,
    userProfile: UserProfile,
    preferences: UserPreferences,
    id: number
  ): Promise<DynamicRecommendation> {
    
    const enrichmentPrompt = `
As a travel industry expert, provide detailed analysis for ${baseRecommendation.destination} for a content creator.

Creator Profile: ${userProfile.contentType} creator focusing on ${userProfile.themes.join(', ')}
Destination: ${baseRecommendation.destination}
Budget Category: ${baseRecommendation.budgetCategory}

Provide comprehensive details:

1. BUDGET ANALYSIS:
- Estimated budget range for ${preferences.duration || '7'} days
- Cost breakdown (flights, accommodation, food, activities)
- Money-saving tips specific to this destination

2. CREATOR COMMUNITY:
- Local content creators and influencers in this destination
- Collaboration opportunities and networking events
- Creator-friendly locations and communities

3. BRAND PARTNERSHIPS:
- Types of brands that sponsor content in this location
- Seasonal marketing campaigns and opportunities
- Local brand collaboration potential

4. CONTENT CREATION:
- 5 specific video content ideas
- 5 Instagram-worthy photo spots
- 3 unique storytelling angles
- Best times of day/year for content

5. PRACTICAL INFO:
- Visa requirements and process
- Primary language and communication tips
- 3 safety tips for content creators
- 3 cultural etiquette tips

6. ENGAGEMENT POTENTIAL:
- Why this destination will engage their audience
- Seasonal trends and optimal posting times
- Unique selling points for their content

Return as valid JSON with this structure:
{
  "budget": {
    "range": "$X - $Y",
    "breakdown": "detailed breakdown",
    "costEfficiency": "assessment"
  },
  "creators": {
    "totalActiveCreators": number,
    "topCreators": [{"name": "...", "followers": "...", "niche": "...", "collaboration": "..."}],
    "collaborationOpportunities": ["..."]
  },
  "brands": {
    "partnerships": ["..."],
    "monetizationPotential": "assessment",
    "seasonalOpportunities": ["..."]
  },
  "content": {
    "videoIdeas": ["..."],
    "photoSpots": ["..."],
    "storytellingAngles": ["..."],
    "bestTimeToVisit": ["..."]
  },
  "practical": {
    "visa": "requirement",
    "language": "primary language",
    "safetyTips": ["..."],
    "culturalTips": ["..."]
  },
  "engagementAnalysis": "detailed analysis",
  "confidenceScore": 0.85
}
`;

    try {
      if (!this.geminiApiKey) {
        console.warn('Gemini API key not found, using fallback enrichment');
        const enrichmentData = this.getFallbackEnrichment();
        const matchScore = this.calculateMatchScore(baseRecommendation, userProfile, preferences, enrichmentData);
        return this.buildRecommendationResponse(baseRecommendation, enrichmentData, matchScore, id);
      }

      const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: enrichmentPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini enrichment error: ${response.status}, using fallback`);
        const enrichmentData = this.getFallbackEnrichment();
        const matchScore = this.calculateMatchScore(baseRecommendation, userProfile, preferences, enrichmentData);
        return this.buildRecommendationResponse(baseRecommendation, enrichmentData, matchScore, id);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No AI enrichment response received');
      }
      
      // Extract JSON from AI response with better error handling
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      let enrichmentData;
      
      if (jsonMatch) {
        try {
          enrichmentData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('Failed to parse enrichment JSON:', parseError);
          enrichmentData = this.getFallbackEnrichment();
        }
      } else {
        console.warn('No valid JSON found in enrichment response');
        enrichmentData = this.getFallbackEnrichment();
      }

      // Calculate match score and build response
      const matchScore = this.calculateMatchScore(baseRecommendation, userProfile, preferences, enrichmentData);
      return this.buildRecommendationResponse(baseRecommendation, enrichmentData, matchScore, id);

    } catch (error) {
      console.error(`Error enriching recommendation for ${baseRecommendation.destination}:`, error);
      return this.getFallbackRecommendationStructure(baseRecommendation, id);
    }
  }

  private buildRecommendationResponse(
    baseRecommendation: any,
    enrichmentData: any,
    matchScore: number,
    id: number
  ): DynamicRecommendation {
    return {
      id,
      destination: baseRecommendation.destination,
      country: baseRecommendation.country,
      matchScore,
      image: this.getDestinationImage(baseRecommendation.destination),
      highlights: [
        baseRecommendation.matchReason,
        ...baseRecommendation.contentOpportunities.slice(0, 2)
      ],
      budget: enrichmentData.budget,
      engagement: {
        potential: this.getEngagementLevel(matchScore),
        reason: enrichmentData.engagementAnalysis || baseRecommendation.audienceAlignment
      },
      creators: enrichmentData.creators,
      brands: enrichmentData.brands,
      content: enrichmentData.content,
      practical: enrichmentData.practical,
      confidence: enrichmentData.confidenceScore || 0.8,
      reasoning: baseRecommendation.matchReason
    };
  }

  private calculateMatchScore(
    baseRec: any,
    userProfile: UserProfile,
    preferences: UserPreferences,
    enrichment: any
  ): number {
    let score = 70; // Base score

    // Content theme alignment
    const themeAlignment = userProfile.themes.some(theme => 
      baseRec.matchReason.toLowerCase().includes(theme.toLowerCase())
    );
    if (themeAlignment) score += 10;

    // Budget alignment
    const budgetMatch = this.getBudgetAlignment(preferences.budget, baseRec.budgetCategory);
    score += budgetMatch;

    // Content opportunity richness
    if (enrichment.content?.videoIdeas?.length >= 5) score += 5;
    if (enrichment.creators?.totalActiveCreators > 50) score += 5;

    // Confidence boost
    if (enrichment.confidenceScore) {
      score = score * enrichment.confidenceScore;
    }

    return Math.min(95, Math.max(65, Math.round(score)));
  }

  private getBudgetAlignment(userBudget: string | undefined, destCategory: string): number {
    const budgetMap: Record<string, number> = {
      'budget-friendly': 8,
      'mid-range': 10,
      'luxury': 6
    };

    if (!userBudget) return budgetMap[destCategory] || 8;

    const userBudgetNum = parseInt(userBudget.replace(/\D/g, '')) || 2000;
    
    if (userBudgetNum < 1500 && destCategory === 'budget-friendly') return 10;
    if (userBudgetNum >= 1500 && userBudgetNum <= 3000 && destCategory === 'mid-range') return 10;
    if (userBudgetNum > 3000 && destCategory === 'luxury') return 10;
    
    return 6;
  }

  private getEngagementLevel(score: number): string {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Very High';
    if (score >= 70) return 'High';
    return 'Good';
  }

  private getDestinationImage(destination: string): string {
    const imageMap: Record<string, string> = {
      'Tokyo, Japan': 'https://images.pexels.com/photos/315658/pexels-photo-315658.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Bali, Indonesia': 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Santorini, Greece': 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Dubai, UAE': 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Lisbon, Portugal': 'https://images.pexels.com/photos/1534630/pexels-photo-1534630.jpeg?auto=compress&cs=tinysrgb&w=400',
    };

    return imageMap[destination] || 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  private applyFinalScoring(recommendations: DynamicRecommendation[], preferences: UserPreferences): DynamicRecommendation[] {
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((rec, index) => ({
        ...rec,
        id: index + 1
      }));
  }

  private getFallbackDestinations(): any[] {
    return [
      {
        destination: "Bali, Indonesia",
        country: "Indonesia",
        region: "Southeast Asia",
        matchReason: "Perfect blend of culture, adventure, and content creation opportunities",
        contentOpportunities: ["Temple photography", "Beach lifestyle content", "Local food experiences"],
        audienceAlignment: "Appeals to adventure and culture enthusiasts",
        budgetCategory: "mid-range",
        bestSeasons: ["April-May", "September-October"],
        culturalFactors: ["Hindu temples", "Traditional arts", "Beach culture"]
      },
      {
        destination: "Lisbon, Portugal",
        country: "Portugal",
        region: "Southern Europe",
        matchReason: "Emerging creative hub with excellent value for content creators",
        contentOpportunities: ["Historic architecture", "Street art scene", "Coastal adventures"],
        audienceAlignment: "Great for European travel content and cultural exploration",
        budgetCategory: "budget-friendly",
        bestSeasons: ["May-June", "September-October"],
        culturalFactors: ["Historic neighborhoods", "Fado music", "Atlantic coast culture"]
      },
      {
        destination: "Dubai, UAE",
        country: "United Arab Emirates",
        region: "Middle East",
        matchReason: "Ultimate destination for luxury lifestyle and modern content",
        contentOpportunities: ["Futuristic architecture", "Desert adventures", "Luxury experiences"],
        audienceAlignment: "Perfect for aspirational and luxury travel content",
        budgetCategory: "luxury",
        bestSeasons: ["November-March"],
        culturalFactors: ["Modern Islamic culture", "International fusion", "Desert traditions"]
      }
    ];
  }

  private getFallbackEnrichment(): any {
    return {
      budget: {
        range: "$1,200 - $2,000",
        breakdown: "7 days including flights, accommodation & activities",
        costEfficiency: "Good value for content creation opportunities"
      },
      creators: {
        totalActiveCreators: 85,
        topCreators: [
          { name: "Local Travel Creator", followers: "50K", niche: "Travel & Lifestyle", collaboration: "Content partnerships available" }
        ],
        collaborationOpportunities: ["Local brand partnerships", "Creator meetups", "Content exchanges"]
      },
      brands: {
        partnerships: ["Tourism boards", "Local businesses", "International brands"],
        monetizationPotential: "High - growing creator economy",
        seasonalOpportunities: ["Holiday campaigns", "Summer promotions", "Cultural events"]
      },
      content: {
        videoIdeas: ["Local culture exploration", "Food tours", "Adventure activities", "Behind-the-scenes", "Travel tips"],
        photoSpots: ["Historic landmarks", "Scenic viewpoints", "Local markets", "Cultural sites", "Nature spots"],
        storytellingAngles: ["Cultural immersion", "Adventure seeking", "Local discoveries"],
        bestTimeToVisit: ["Spring months", "Fall season", "Off-peak periods"]
      },
      practical: {
        visa: "Check current requirements",
        language: "Local language with English widely spoken",
        safetyTips: ["Stay aware of surroundings", "Secure valuables", "Use official transportation"],
        culturalTips: ["Respect local customs", "Dress appropriately", "Learn basic phrases"]
      },
      engagementAnalysis: "Strong potential for audience engagement based on content themes",
      confidenceScore: 0.75
    };
  }

  private getFallbackRecommendationStructure(baseRec: any, id: number): DynamicRecommendation {
    const fallbackEnrichment = this.getFallbackEnrichment();
    
    return {
      id,
      destination: baseRec.destination,
      country: baseRec.country,
      matchScore: 75,
      image: this.getDestinationImage(baseRec.destination),
      highlights: [
        baseRec.matchReason,
        ...baseRec.contentOpportunities.slice(0, 2)
      ],
      budget: fallbackEnrichment.budget,
      engagement: {
        potential: "High",
        reason: baseRec.audienceAlignment
      },
      creators: fallbackEnrichment.creators,
      brands: fallbackEnrichment.brands,
      content: fallbackEnrichment.content,
      practical: fallbackEnrichment.practical,
      confidence: 0.75,
      reasoning: baseRec.matchReason
    };
  }
}

class DynamicRecommendationServiceExtended extends DynamicRecommendationService {
  generateTasteVectorFromProfile(userProfile: UserProfile): Record<string, number> {
    const tasteVector: Record<string, number> = {
      adventure: 0,
      culture: 0,
      luxury: 0,
      food: 0,
      nature: 0,
      urban: 0,
      budget: 0.5,
      relaxation: 0,
      photography: 0,
      social: 0
    };

    // Analyze themes and assign scores
    userProfile.themes.forEach(theme => {
      const lower = theme.toLowerCase();
      if (lower.includes('adventure') || lower.includes('outdoor')) tasteVector.adventure += 0.3;
      if (lower.includes('culture') || lower.includes('history')) tasteVector.culture += 0.3;
      if (lower.includes('luxury') || lower.includes('premium')) tasteVector.luxury += 0.3;
      if (lower.includes('food') || lower.includes('culinary')) tasteVector.food += 0.3;
      if (lower.includes('nature') || lower.includes('landscape')) tasteVector.nature += 0.3;
      if (lower.includes('urban') || lower.includes('city')) tasteVector.urban += 0.3;
      if (lower.includes('budget') || lower.includes('affordable')) tasteVector.budget += 0.3;
      if (lower.includes('relax') || lower.includes('wellness')) tasteVector.relaxation += 0.3;
      if (lower.includes('photo') || lower.includes('visual')) tasteVector.photography += 0.3;
      if (lower.includes('social') || lower.includes('community')) tasteVector.social += 0.3;
    });

    return tasteVector;
  }

  inferCulturalAffinities(themes: string[]): string[] {
    const affinities = [];
    const themeStr = themes.join(' ').toLowerCase();

    if (themeStr.includes('asia') || themeStr.includes('japanese') || themeStr.includes('korean')) {
      affinities.push('East Asian Culture');
    }
    if (themeStr.includes('european') || themeStr.includes('mediterranean')) {
      affinities.push('European Heritage');
    }
    if (themeStr.includes('latin') || themeStr.includes('south american')) {
      affinities.push('Latin American Culture');
    }
    if (themeStr.includes('modern') || themeStr.includes('contemporary')) {
      affinities.push('Contemporary Arts');
    }

    return affinities.length > 0 ? affinities : ['Global Culture'];
  }
}

export const dynamicRecommendationService = new DynamicRecommendationServiceExtended();
