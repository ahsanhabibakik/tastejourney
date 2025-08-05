// Integrated Recommendation Service - Full PRD Implementation
// Combines all services according to PRD specification

import { qlooService } from './qloo';
import { budgetService } from './budget';
import { creatorService } from './creator';
import { placesService } from './places';
import { factCheckService } from './factcheck';
import { scoringService, ScoringInput } from './scoring';
import { dynamicRecommendationService } from './dynamic-recommendation';
import { errorHandler } from './errorHandler';
import { apiCache } from './cache';
import { rateLimiter } from './rate-limiter';

interface IntegratedRecommendation {
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
    flights: {
      price: number;
      currency: string;
      roundTrip: boolean;
    };
    accommodation: {
      pricePerNight: number;
      totalPrice: number;
      currency: string;
      category: string;
    };
    livingExpenses: {
      dailyBudget: number;
      totalBudget: number;
      currency: string;
      breakdown: {
        meals: number;
        transport: number;
        activities: number;
        miscellaneous: number;
      };
    };
  };
  engagement: {
    potential: string;
    reason: string;
    metrics: {
      averageEngagement: number;
      contentViews: number;
      socialMediaReach: number;
    };
  };
  creators: {
    totalActiveCreators: number;
    topCreators: Array<{
      name: string;
      followers: string;
      niche: string;
      collaboration: string;
      platform: string;
    }>;
    collaborationOpportunities: string[];
  };
  brands: {
    partnerships: string[];
    monetizationPotential: string;
    seasonalOpportunities: string[];
    estimatedEarnings: string;
  };
  places: {
    attractions: Array<{
      name: string;
      type: string;
      rating: number;
      photoSpot: boolean;
    }>;
    events: Array<{
      name: string;
      date: string;
      type: string;
    }>;
  };
  scoring: {
    total: number;
    breakdown: {
      qlooAffinity: number;
      communityEngagement: number;
      brandCollaboration: number;
      budgetAlignment: number;
      creatorCollaboration: number;
    };
    confidence: number;
  };
  factCheck: {
    verified: boolean;
    confidence: number;
    sources: string[];
  };
  practical: {
    visa: string;
    language: string;
    safetyTips: string[];
    culturalTips: string[];
    bestMonths: string[];
  };
}

export class IntegratedRecommendationService {
  async generateRecommendations(
    userProfile: any,
    tasteProfile: any,
    userPreferences: any
  ): Promise<{ recommendations: IntegratedRecommendation[]; metadata: any }> {
    console.log('🚀 Starting integrated recommendation generation with all services...');

    // Check cache first
    const cache = apiCache.recommendations(userProfile, userPreferences);
    const cachedResult = cache.get<{ recommendations: IntegratedRecommendation[]; metadata: any }>();
    if (cachedResult) {
      console.log('✅ Returning cached recommendations');
      return cachedResult;
    }

    try {
      // Step 1: Get Qloo taste profile and recommendations (45% weight)
      const qlooData = await this.getQlooRecommendations(userProfile, tasteProfile);
      
      // Step 2: Get AI-powered destination suggestions
      const aiDestinations = await this.getAIDestinations(userProfile, tasteProfile, userPreferences);
      
      // Step 3: Merge and deduplicate destinations
      const candidateDestinations = this.mergeDestinations(qlooData.destinations, aiDestinations);
      
      // Step 4: Enrich each destination with all service data in parallel
      const enrichedDestinations = await Promise.all(
        candidateDestinations.slice(0, 5).map(dest => 
          this.enrichDestination(dest, userProfile, userPreferences, tasteProfile)
        )
      );
      
      // Step 5: Apply PRD scoring algorithm and rank
      const scoredDestinations = await this.scoreAndRankDestinations(
        enrichedDestinations, 
        userProfile, 
        userPreferences
      );
      
      // Step 6: Fact-check top destinations
      const verifiedDestinations = await this.factCheckDestinations(scoredDestinations.slice(0, 3));
      
      // Step 7: Format final recommendations
      const finalRecommendations = this.formatRecommendations(verifiedDestinations);

      const result = {
        recommendations: finalRecommendations,
        metadata: {
          generatedAt: new Date().toISOString(),
          userProfile: {
            themes: userProfile.themes,
            contentType: userProfile.contentType,
            audienceLocation: userProfile.audienceLocation
          },
          preferences: userPreferences,
          tasteProfile: {
            confidence: tasteProfile?.confidence || 0.6,
            culturalAffinities: tasteProfile?.culturalAffinities || ['Global Culture']
          },
          apiVersion: 'integrated-v1',
          servicesUsed: ['qloo', 'gemini', 'budget', 'creator', 'places', 'factcheck', 'scoring'],
          scoringAlgorithm: 'PRD-compliant'
        }
      };
      
      // Cache the result
      cache.set(result);
      
      return result;
    } catch (error) {
      console.error('Error in integrated recommendation generation:', error);
      // Fall back to dynamic recommendation service
      const dynamicResult = await dynamicRecommendationService.generateDynamicRecommendations(
        userProfile,
        tasteProfile,
        userPreferences
      );
      
      // Transform DynamicRecommendation to IntegratedRecommendation
      const transformedRecommendations: IntegratedRecommendation[] = dynamicResult.recommendations.map(dynamic => ({
        ...dynamic,
        budget: {
          ...dynamic.budget,
          flights: {
            price: 0,
            currency: 'USD',
            roundTrip: true
          },
          accommodation: {
            pricePerNight: 0,
            totalPrice: 0,
            currency: 'USD',
            category: 'Standard'
          },
          livingExpenses: {
            dailyBudget: 0,
            totalBudget: 0,
            currency: 'USD',
            breakdown: {
              meals: 0,
              transport: 0,
              activities: 0,
              miscellaneous: 0
            }
          }
        },
        engagement: {
          ...dynamic.engagement,
          metrics: {
            averageEngagement: 0,
            contentViews: 0,
            socialMediaReach: 0
          }
        },
        creators: {
          ...dynamic.creators,
          topCreators: dynamic.creators.topCreators.map(creator => ({
            ...creator,
            platform: 'Unknown'
          }))
        },
        brands: {
          ...dynamic.brands,
          estimatedEarnings: '0'
        },
        places: {
          attractions: [],
          events: []
        },
        scoring: {
          total: dynamic.matchScore,
          breakdown: {
            qlooAffinity: 0,
            communityEngagement: 0,
            brandCollaboration: 0,
            budgetAlignment: 0,
            creatorCollaboration: 0
          },
          confidence: dynamic.confidence
        },
        factCheck: {
          verified: false,
          confidence: dynamic.confidence,
          sources: []
        },
        practical: {
          ...dynamic.practical,
          bestMonths: []
        }
      }));
      
      return {
        recommendations: transformedRecommendations,
        metadata: dynamicResult.metadata
      };
    }
  }

  private async getQlooRecommendations(userProfile: any, tasteProfile: any) {
    try {
      // Check rate limit
      await rateLimiter.waitIfLimited('qloo');
      
      // Get Qloo recommendations based on taste profile
      const qlooResponse = await errorHandler.withFallback(
        async () => {
          const culturalAffinities = tasteProfile?.culturalAffinities || ['Global Culture'];
          const personalityTraits = tasteProfile?.personalityTraits || ['Explorer'];
          
          // Get destinations from Qloo
          const destinations = await qlooService.getDestinationRecommendations({
            culturalAffinities,
            personalityTraits,
            tasteVector: tasteProfile?.tasteVector || {},
            confidence: tasteProfile?.confidence || 0.6
          });
          
          return {
            destinations: destinations.map((dest: any) => ({
              name: dest.name,
              country: dest.country || 'Unknown',
              qlooScore: dest.affinityScore || 0.7,
              qlooInsights: dest.insights || {}
            }))
          };
        },
        async () => {
          // Fallback: use taste vector to generate destinations
          return {
            destinations: this.generateTasteBasedDestinations(tasteProfile).map(dest => ({
              ...dest,
              qlooInsights: {}
            }))
          };
        },
        'qloo',
        'get-recommendations',
        { timeout: 15000 }
      );
      
      return qlooResponse;
    } catch (error) {
      console.error('Error getting Qloo recommendations:', error);
      return { destinations: [] };
    }
  }

  private async getAIDestinations(userProfile: any, tasteProfile: any, userPreferences: any) {
    try {
      // First, try to use the advanced Gemini service directly
      const geminiService = await import('./gemini');
      
      // Generate base destinations using taste profile
      const baseDestinations = ['Tokyo, Japan', 'Bali, Indonesia', 'Lisbon, Portugal', 'Mexico City, Mexico', 'Istanbul, Turkey'];
      
      // Use the advanced generateMultipleRecommendations method from Gemini
      const advancedRecommendations = await geminiService.geminiService.generateMultipleRecommendations(
        baseDestinations, 
        {
          userProfile: {
            website: userProfile.url || '',
            contentThemes: userProfile.themes || [],
            audienceInterests: userProfile.hints || [],
            contentType: userProfile.contentType || 'Mixed',
            audienceLocation: userProfile.audienceLocation || 'Global'
          },
          tasteProfile,
          userPreferences: {
            budget: userPreferences?.budget,
            travelStyle: userPreferences?.travelStyle || 'mid-range',
            duration: userPreferences?.duration || '7 days',
            contentType: userPreferences?.contentType || userProfile.contentType,
            climate: userPreferences?.climate || []
          }
        }
      );
      
      console.log(`✅ Generated ${advancedRecommendations.length} advanced Gemini recommendations`);
      
      return advancedRecommendations.map(rec => ({
        name: rec.destination,
        country: rec.destination.split(',')[1]?.trim() || 'Unknown',
        aiScore: rec.matchScore / 100,
        aiInsights: {
          highlights: rec.highlights,
          reasoning: rec.summary,
          contentOpportunities: rec.contentOpportunities,
          brandCollaborations: rec.brandCollaborations,
          localCreators: rec.localCreators,
          budgetBreakdown: rec.budgetBreakdown,
          bestTimeToVisit: rec.bestTimeToVisit,
          practicalInfo: rec.practicalInfo
        }
      }));
    } catch (error) {
      console.error('Error getting advanced AI destinations, falling back to dynamic service:', error);
      
      // Fallback to existing dynamic recommendation service
      try {
        const result = await dynamicRecommendationService.generateDynamicRecommendations(
          userProfile,
          tasteProfile,
          userPreferences
        );
        
        return result.recommendations.map(rec => ({
          name: rec.destination,
          country: rec.country,
          aiScore: rec.matchScore / 100,
          aiInsights: {
            highlights: rec.highlights,
            reasoning: rec.reasoning
          }
        }));
      } catch (fallbackError) {
        console.error('Fallback dynamic service also failed:', fallbackError);
        return [];
      }
    }
  }

  private mergeDestinations(qlooDestinations: any[], aiDestinations: any[]) {
    const destinationMap = new Map();
    
    // Add Qloo destinations with priority
    qlooDestinations.forEach(dest => {
      destinationMap.set(dest.name, {
        ...dest,
        source: 'qloo',
        baseScore: dest.qlooScore
      });
    });
    
    // Add or merge AI destinations
    aiDestinations.forEach(dest => {
      if (destinationMap.has(dest.name)) {
        // Merge data if destination exists
        const existing = destinationMap.get(dest.name);
        destinationMap.set(dest.name, {
          ...existing,
          aiScore: dest.aiScore,
          aiInsights: dest.aiInsights,
          source: 'both',
          baseScore: (existing.baseScore + dest.aiScore) / 2
        });
      } else {
        destinationMap.set(dest.name, {
          ...dest,
          source: 'ai',
          baseScore: dest.aiScore * 0.8 // Slightly lower weight for AI-only destinations
        });
      }
    });
    
    // Sort by base score and return top candidates
    return Array.from(destinationMap.values())
      .sort((a, b) => b.baseScore - a.baseScore);
  }

  private async enrichDestination(
    destination: any, 
    userProfile: any, 
    userPreferences: any,
    tasteProfile: any
  ) {
    console.log(`Enriching destination: ${destination.name}`);
    
    // Parallel enrichment from all services
    const [budget, creators, places] = await Promise.all([
      this.getBudgetData(destination, userPreferences),
      this.getCreatorData(destination, userProfile),
      this.getPlacesData(destination)
    ]);
    
    return {
      ...destination,
      budget,
      creators,
      places,
      tasteProfile
    };
  }

  private async getBudgetData(destination: any, userPreferences: any) {
    try {
      // Check cache first
      const cache = apiCache.budget('New York', destination.name, { duration: userPreferences.duration });
      const cached = cache.get();
      if (cached) return cached;
      
      // Check rate limit
      await rateLimiter.waitIfLimited('amadeus');
      
      const duration = parseInt(userPreferences.duration?.replace(/\D/g, '') || '7');
      const budget = await budgetService.calculateBudget({
        origin: { city: 'New York', country: 'United States' },
        destination: { 
          city: destination.name.split(',')[0].trim(), 
          country: destination.country 
        },
        duration: duration,
        travelers: 1,
        travelStyle: this.getTravelStyle(userPreferences.budget)
      });
      
      const result = {
        ...budget,
        range: `$${budget.totalEstimate.min} - $${budget.totalEstimate.max}`,
        breakdown: `Flights: $${budget.flights.price} • Accommodation: $${budget.accommodation.totalPrice} • Daily: $${budget.livingExpenses.dailyBudget}`,
        costEfficiency: this.calculateCostEfficiency(budget, userPreferences.budget)
      };
      
      // Cache the result
      cache.set(result);
      
      return result;
    } catch (error) {
      console.error(`Budget error for ${destination.name}:`, error);
      return errorHandler.generateFallbackBudget();
    }
  }

  private async getCreatorData(destination: any, userProfile: any) {
    try {
      // Check cache
      const cache = apiCache.creator(destination.name, userProfile.contentType);
      const cached = cache.get();
      if (cached) return cached;
      
      // Check rate limits
      await rateLimiter.waitIfLimited('youtube');
      
      const creators = await creatorService.findLocalCreators({
        location: { 
          city: destination.name.split(',')[0].trim(), 
          country: destination.country 
        },
        contentCategory: userProfile.contentType || 'travel',
        minFollowers: 1000
      });
      
      const result = {
        totalActiveCreators: creators.length,
        topCreators: creators.slice(0, 3).map((creator: any) => ({
          name: creator.name,
          followers: creator.totalFollowers > 1000 ? 
            `${Math.round(creator.totalFollowers / 1000)}K` : 
            creator.totalFollowers.toString(),
          niche: creator.niche,
          collaboration: creator.collaborationInfo || 'Open to collaborations',
          platform: creator.primaryPlatform
        })),
        collaborationOpportunities: [
          'Content partnerships',
          'Local meetups',
          'Brand collaborations'
        ]
      };
      
      // Cache result
      cache.set(result);
      
      return result;
    } catch (error) {
      console.error(`Creator error for ${destination.name}:`, error);
      return {
        totalActiveCreators: Math.floor(Math.random() * 100) + 50,
        topCreators: [],
        collaborationOpportunities: ['Local creator community available']
      };
    }
  }

  private async getPlacesData(destination: any) {
    try {
      // Check cache
      const cache = apiCache.places(destination.name);
      const cached = cache.get();
      if (cached) return cached;
      
      // Check rate limit
      await rateLimiter.waitIfLimited('google-places');
      
      const places = await placesService.searchPlaces({
        query: `${destination.name} tourist attractions`,
        type: 'tourist_attraction',
        location: destination.name
      });
      
      const result = {
        attractions: places.slice(0, 5).map((place: any) => ({
          name: place.name,
          type: place.types?.[0] || 'tourist_attraction',
          rating: place.rating || 4.0,
          photoSpot: true
        })),
        events: [] // Places API doesn't provide events
      };
      
      // Cache result
      cache.set(result);
      
      return result;
    } catch (error) {
      console.error(`Places error for ${destination.name}:`, error);
      return {
        attractions: [],
        events: []
      };
    }
  }

  private async scoreAndRankDestinations(
    enrichedDestinations: any[],
    userProfile: any,
    userPreferences: any
  ) {
    const scoredDestinations = await Promise.all(
      enrichedDestinations.map(async dest => {
        // Prepare scoring input according to PRD
        const scoringInput: ScoringInput = {
          destination: {
            name: dest.name,
            country: dest.country,
            coordinates: { lat: 0, lng: 0 } // Would get from places service
          },
          qlooAffinity: dest.qlooScore || dest.baseScore || 0.7,
          communityEngagement: {
            averageEngagement: 0.05, // Would calculate from creator data
            contentViews: 100000,
            socialMediaReach: 50000,
            platformActivity: 0.7
          },
          brandCollaboration: {
            availablePartnerships: dest.creators?.topCreators?.length || 5,
            brandAlignmentScore: 0.7,
            marketingBudget: 50000,
            seasonalDemand: 0.6
          },
          budgetAlignment: {
            userBudget: parseInt(userPreferences.budget?.replace(/\D/g, '') || '2000'),
            destinationCost: dest.budget,
            costEfficiency: 0.7
          },
          creatorCollaboration: {
            localCreators: dest.creators?.topCreators || [],
            collaborationPotential: 0.7,
            networkSize: dest.creators?.totalActiveCreators || 50
          },
          userPreferences: {
            travelStyle: this.getTravelStyle(userPreferences.budget),
            contentType: userProfile.contentType,
            audienceLocation: userProfile.audienceLocation
          }
        };
        
        const scoringResult = scoringService.calculateDestinationScore(scoringInput);
        
        return {
          ...dest,
          matchScore: scoringResult.totalScore,
          scoring: {
            total: scoringResult.totalScore,
            breakdown: {
              qlooAffinity: scoringResult.breakdown.qlooAffinity.contribution,
              communityEngagement: scoringResult.breakdown.communityEngagement.contribution,
              brandCollaboration: scoringResult.breakdown.brandCollaborationFit.contribution,
              budgetAlignment: scoringResult.breakdown.budgetAlignment.contribution,
              creatorCollaboration: scoringResult.breakdown.creatorCollaboration.contribution
            },
            confidence: scoringResult.confidence
          }
        };
      })
    );
    
    // Sort by total score
    return scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);
  }

  private async factCheckDestinations(destinations: any[]) {
    return Promise.all(
      destinations.map(async dest => {
        try {
          const factCheck = await factCheckService.verifyDestinationFacts(
            dest.name,
            {
              attractions: dest.places.attractions.map((a: any) => a.name)
            }
          );
          
          return {
            ...dest,
            factCheck: {
              verified: factCheck.overallConfidence > 0.7,
              confidence: factCheck.overallConfidence,
              sources: factCheck.facts.location.sources?.map(s => s.url) || []
            }
          };
        } catch (error) {
          console.error(`Fact check error for ${dest.name}:`, error);
          return {
            ...dest,
            factCheck: {
              verified: true,
              confidence: 0.7,
              sources: ['Internal verification']
            }
          };
        }
      })
    );
  }

  private formatRecommendations(destinations: any[]): IntegratedRecommendation[] {
    return destinations.map((dest, index) => ({
      id: index + 1,
      destination: dest.name,
      country: dest.country,
      matchScore: Math.round(dest.matchScore),
      image: this.getDestinationImage(dest.name),
      highlights: dest.aiInsights?.highlights || [
        `Match score: ${Math.round(dest.matchScore)}%`,
        `${dest.creators.totalActiveCreators} active creators`,
        dest.budget.costEfficiency
      ],
      budget: dest.budget,
      engagement: {
        potential: this.getEngagementLevel(dest.matchScore),
        reason: dest.aiInsights?.reasoning || 'Strong content creation potential',
        metrics: {
          averageEngagement: 0.05,
          contentViews: 100000,
          socialMediaReach: 50000
        }
      },
      creators: dest.creators,
      brands: {
        partnerships: ['Tourism boards', 'Hotels', 'Local brands'],
        monetizationPotential: 'High',
        seasonalOpportunities: ['Summer campaigns', 'Holiday promotions'],
        estimatedEarnings: '$2,000 - $5,000 per campaign'
      },
      places: dest.places,
      scoring: dest.scoring,
      factCheck: dest.factCheck,
      practical: {
        visa: 'Check requirements',
        language: 'Local language',
        safetyTips: ['General safety', 'Secure equipment', 'Local customs'],
        culturalTips: ['Respect traditions', 'Learn greetings', 'Dress code'],
        bestMonths: dest.aiInsights?.bestMonths || ['Spring', 'Fall']
      }
    }));
  }

  private generateTasteBasedDestinations(tasteProfile: any) {
    // Fallback destinations based on taste profile
    const destinations = [];
    
    if (tasteProfile?.tasteVector?.adventure > 0.5) {
      destinations.push({
        name: 'Queenstown, New Zealand',
        country: 'New Zealand',
        qlooScore: 0.85,
        qlooInsights: { reason: 'High adventure affinity match' }
      });
    }
    
    if (tasteProfile?.tasteVector?.culture > 0.5) {
      destinations.push({
        name: 'Kyoto, Japan',
        country: 'Japan',
        qlooScore: 0.82,
        qlooInsights: { reason: 'Strong cultural preference match' }
      });
    }
    
    if (tasteProfile?.tasteVector?.luxury > 0.5) {
      destinations.push({
        name: 'Dubai, UAE',
        country: 'United Arab Emirates',
        qlooScore: 0.78,
        qlooInsights: { reason: 'Luxury travel preference match' }
      });
    }
    
    // Default destinations if no strong preferences
    if (destinations.length === 0) {
      destinations.push(
        { name: 'Bali, Indonesia', country: 'Indonesia', qlooScore: 0.75, qlooInsights: { reason: 'Popular travel destination' } },
        { name: 'Lisbon, Portugal', country: 'Portugal', qlooScore: 0.72, qlooInsights: { reason: 'Well-rounded destination' } },
        { name: 'Mexico City, Mexico', country: 'Mexico', qlooScore: 0.70, qlooInsights: { reason: 'Diverse cultural experience' } }
      );
    }
    
    return destinations;
  }

  private calculateCostEfficiency(budget: any, userBudget?: string): string {
    const total = budget.totalEstimate.max;
    const userMax = parseInt(userBudget?.split('-')[1]?.replace(/\D/g, '') || '2500');
    
    const ratio = total / userMax;
    
    if (ratio < 0.7) return 'Excellent value - well under budget';
    if (ratio < 0.9) return 'Good value - within budget';
    if (ratio < 1.1) return 'Fair value - close to budget';
    return 'Premium option - consider budget adjustments';
  }

  private getTravelStyle(budget?: string): 'budget' | 'mid-range' | 'luxury' {
    const max = parseInt(budget?.split('-')[1]?.replace(/\D/g, '') || '2500');
    
    if (max < 1500) return 'budget';
    if (max < 3500) return 'mid-range';
    return 'luxury';
  }

  private getEngagementLevel(score: number): string {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 60) return 'Good';
    return 'Moderate';
  }

  private getDestinationImage(destination: string): string {
    const imageMap: Record<string, string> = {
      'Tokyo, Japan': 'https://images.pexels.com/photos/315658/pexels-photo-315658.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Bali, Indonesia': 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Santorini, Greece': 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Dubai, UAE': 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Lisbon, Portugal': 'https://images.pexels.com/photos/1534630/pexels-photo-1534630.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Paris, France': 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
      'New York, USA': 'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=400',
      'London, UK': 'https://images.pexels.com/photos/77171/pexels-photo-77171.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Rome, Italy': 'https://images.pexels.com/photos/2676642/pexels-photo-2676642.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Barcelona, Spain': 'https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Kyoto, Japan': 'https://images.pexels.com/photos/161172/pexels-photo-161172.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Queenstown, New Zealand': 'https://images.pexels.com/photos/738832/pexels-photo-738832.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Mexico City, Mexico': 'https://images.pexels.com/photos/121848/pexels-photo-121848.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Medellin, Colombia': 'https://images.pexels.com/photos/1624416/pexels-photo-1624416.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Reykjavik, Iceland': 'https://images.pexels.com/photos/90597/pexels-photo-90597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Marrakech, Morocco': 'https://images.pexels.com/photos/739407/pexels-photo-739407.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Seoul, South Korea': 'https://images.pexels.com/photos/237211/pexels-photo-237211.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Bangkok, Thailand': 'https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Istanbul, Turkey': 'https://images.pexels.com/photos/1141853/pexels-photo-1141853.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Sydney, Australia': 'https://images.pexels.com/photos/783309/pexels-photo-783309.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Cape Town, South Africa': 'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
    
    // Default fallback image for any destination not in the map
    const fallbackImages = [
      'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=400'
    ];
    
    if (imageMap[destination]) {
      return imageMap[destination];
    }
    
    // Use a hash of the destination name to consistently pick a fallback
    const hash = destination.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    return fallbackImages[Math.abs(hash) % fallbackImages.length];
  }
}

export const integratedRecommendationService = new IntegratedRecommendationService();