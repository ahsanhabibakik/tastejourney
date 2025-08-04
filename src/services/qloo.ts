// Qloo Taste AI™ API Integration Service
// Based on PRD requirements for taste vector generation

export interface QlooTasteProfile {
  culturalAffinities: string[];
  personalityTraits: string[];
  tasteVector: Record<string, number>;
  confidence: number;
}

export interface QlooRecommendationRequest {
  tasteProfile: QlooTasteProfile;
  category?: string;
  location?: string;
  filters?: Record<string, string | number | boolean>;
}

export interface QlooRecommendation {
  id: string;
  name: string;
  category: string;
  affinityScore: number;
  attributes: Record<string, number>;
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
}

class QlooService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.QLOO_API_KEY || '';
    this.baseURL = process.env.QLOO_API_URL || 'https://api.qloo.com/v1';
  }

  async generateTasteProfile(websiteData: {
    themes: string[];
    hints: string[];
    contentType: string;
    socialLinks: Array<{ platform: string; url: string }>;
  }): Promise<QlooTasteProfile> {
    try {
      if (!this.apiKey) {
        console.warn('Qloo API key not found, using fallback taste profile generation');
        return this.generateFallbackTasteProfile(websiteData);
      }

      // Try different authentication methods for hackathon API
      const authMethods = [
        { headers: { 'Authorization': `Bearer ${this.apiKey}` } },
        { headers: { 'x-api-key': this.apiKey } },
        { headers: { 'Authorization': `API-Key ${this.apiKey}` } }
      ];

      const endpoints = [
        `${this.baseURL}/taste/profile`,
        `${this.baseURL}/v1/taste/profile`,
        `${this.baseURL}/recommendations/taste-profile`
      ];

      for (const endpoint of endpoints) {
        for (const auth of authMethods) {
          try {
            console.log(`Trying Qloo endpoint: ${endpoint}`);
            
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...auth.headers
              } as any,
              body: JSON.stringify({
                userInterests: websiteData.themes,
                contentHints: websiteData.hints,
                contentType: websiteData.contentType,
                socialProfiles: websiteData.socialLinks,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Qloo API success with:', endpoint);
              return this.formatTasteProfile(data);
            } else {
              console.log(`${endpoint} returned status:`, response.status);
            }
          } catch (authError) {
            console.log(`Auth method failed for ${endpoint}:`, authError);
          }
        }
      }

      throw new Error('All Qloo API attempts failed');
    } catch (error) {
      console.error('Error generating Qloo taste profile:', error);
      return this.generateFallbackTasteProfile(websiteData);
    }
  }

  async getDestinationRecommendations(
    tasteProfile: QlooTasteProfile,
    filters?: {
      budget?: string;
      climate?: string[];
      duration?: string;
      style?: string;
    }
  ): Promise<QlooRecommendation[]> {
    try {
      if (!this.apiKey) {
        console.warn('Qloo API key not found, using fallback recommendations');
        return this.generateFallbackRecommendations(tasteProfile, filters as any);
      }

      const response = await fetch(`${this.baseURL}/recommendations/destinations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasteVector: tasteProfile.tasteVector,
          culturalAffinities: tasteProfile.culturalAffinities,
          filters: filters,
          limit: 10
        }),
      });

      if (!response.ok) {
        throw new Error(`Qloo API error: ${response.status}`);
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting Qloo destination recommendations:', error);
      return this.generateFallbackRecommendations(tasteProfile, filters as any);
    }
  }

  private formatTasteProfile(qlooData: { culturalAffinities?: string[]; personalityTraits?: string[]; tasteVector?: Record<string, number>; confidence?: number }): QlooTasteProfile {
    return {
      culturalAffinities: qlooData.culturalAffinities || [],
      personalityTraits: qlooData.personalityTraits || [],
      tasteVector: qlooData.tasteVector || {},
      confidence: qlooData.confidence || 0.85,
    };
  }

  private generateFallbackTasteProfile(websiteData: {
    themes: string[];
    hints: string[];
    contentType: string;
  }): QlooTasteProfile {
    // Generate taste vector based on website themes
    const tasteVector: Record<string, number> = {
      adventure: 0,
      culture: 0,
      luxury: 0,
      food: 0,
      nature: 0,
      urban: 0,
      budget: 0,
      relaxation: 0,
      photography: 0,
      social: 0,
    };

    // Analyze themes and assign scores
    websiteData.themes.forEach(theme => {
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

    // Normalize scores
    const maxScore = Math.max(...Object.values(tasteVector));
    if (maxScore > 0) {
      Object.keys(tasteVector).forEach(key => {
        tasteVector[key] = Math.min(tasteVector[key] / maxScore, 1);
      });
    }

    return {
      culturalAffinities: this.inferCulturalAffinities(websiteData.themes),
      personalityTraits: this.inferPersonalityTraits(websiteData.hints),
      tasteVector,
      confidence: 0.75, // Lower confidence for fallback
    };
  }

  private generateFallbackRecommendations(
    tasteProfile: QlooTasteProfile,
    _filters?: Record<string, string | number | boolean>
  ): QlooRecommendation[] {
    // Fallback destination database
    const destinations = [
      {
        id: 'bali',
        name: 'Bali, Indonesia',
        category: 'tropical-adventure',
        attributes: { adventure: 0.9, culture: 0.8, food: 0.9, nature: 0.9, budget: 0.7 },
        location: { lat: -8.3405, lng: 115.0920, city: 'Denpasar', country: 'Indonesia' }
      },
      {
        id: 'santorini',
        name: 'Santorini, Greece',
        category: 'luxury-culture',
        attributes: { luxury: 0.9, culture: 0.8, photography: 0.9, relaxation: 0.8, budget: 0.3 },
        location: { lat: 36.3932, lng: 25.4615, city: 'Santorini', country: 'Greece' }
      },
      {
        id: 'kyoto',
        name: 'Kyoto, Japan',
        category: 'cultural-heritage',
        attributes: { culture: 0.95, photography: 0.9, food: 0.8, urban: 0.7, luxury: 0.6 },
        location: { lat: 35.0116, lng: 135.7681, city: 'Kyoto', country: 'Japan' }
      },
      {
        id: 'iceland',
        name: 'Reykjavik, Iceland',
        category: 'nature-adventure',
        attributes: { nature: 0.95, adventure: 0.9, photography: 0.9, luxury: 0.4, budget: 0.4 },
        location: { lat: 64.1466, lng: -21.9426, city: 'Reykjavik', country: 'Iceland' }
      },
      {
        id: 'morocco',
        name: 'Marrakech, Morocco',
        category: 'cultural-adventure',
        attributes: { culture: 0.9, adventure: 0.7, food: 0.8, photography: 0.8, budget: 0.8 },
        location: { lat: 31.6295, lng: -7.9811, city: 'Marrakech', country: 'Morocco' }
      }
    ];

    // @ts-ignore
    return destinations
      .map(dest => ({
        ...dest,
        affinityScore: this.calculateAffinityScore(tasteProfile.tasteVector, dest.attributes as any)
      }))
      .sort((a, b) => b.affinityScore - a.affinityScore)
      .slice(0, 5);
  }

  private calculateAffinityScore(tasteVector: Record<string, number>, attributes: Record<string, number>): number {
    let score = 0;
    let totalWeight = 0;

    Object.keys(tasteVector).forEach(key => {
      if (attributes[key] !== undefined) {
        const weight = tasteVector[key];
        score += weight * attributes[key];
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private inferCulturalAffinities(themes: string[]): string[] {
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
    if (themeStr.includes('african') || themeStr.includes('middle eastern')) {
      affinities.push('African & Middle Eastern Culture');
    }
    if (themeStr.includes('modern') || themeStr.includes('contemporary')) {
      affinities.push('Contemporary Arts');
    }

    return affinities.length > 0 ? affinities : ['Global Culture'];
  }

  private inferPersonalityTraits(hints: string[]): string[] {
    const traits = [];
    const hintStr = hints.join(' ').toLowerCase();

    if (hintStr.includes('adventure') || hintStr.includes('outdoor')) {
      traits.push('Adventurous');
    }
    if (hintStr.includes('creative') || hintStr.includes('artist')) {
      traits.push('Creative');
    }
    if (hintStr.includes('social') || hintStr.includes('community')) {
      traits.push('Social');
    }
    if (hintStr.includes('analytical') || hintStr.includes('detailed')) {
      traits.push('Analytical');
    }
    if (hintStr.includes('cultural') || hintStr.includes('educational')) {
      traits.push('Culturally Curious');
    }

    return traits.length > 0 ? traits : ['Explorer'];
  }
}

export const qlooService = new QlooService();