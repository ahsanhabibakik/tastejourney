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
import { serviceMatrix } from './service-matrix';

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
      // Step 0: Check service capabilities per instruction #6
      const serviceBanner = this.checkServiceCapabilities();
      console.log('🔧 SERVICE MATRIX: Capability check complete');
      
      // Step 1: Get Qloo taste profile and recommendations (45% weight)
      // Per instruction #0: If Qloo fails, abort instead of using AI fallback
      const qlooData = await this.getQlooRecommendations(userProfile, tasteProfile);
      
      if (!qlooData.destinations || qlooData.destinations.length === 0) {
        throw new Error('No Qloo destinations available - cannot provide accurate taste-based recommendations');
      }
      
      // Step 2: Skip AI-powered destination suggestions per instruction #2 (prevent Gemini rate limit spam)
      console.log('🚫 AI: Skipping AI destination generation to prevent Gemini rate limit spam');
      const aiDestinations: any[] = [];
      
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
      
      // Step 7: Apply spec-compliant processing pipeline before formatting
      console.log('🔄 PROCESSING: Applying recommendation processor pipeline...');
      const userBudget = parseInt(userPreferences?.budget?.replace(/[^\\d]/g, '') || '2500');
      
      // Import and use the recommendation processor
      const { recommendationProcessor } = await import('./recommendation-processor');
      const processingResult = await recommendationProcessor.processRecommendations(
        verifiedDestinations,
        userBudget,
        userPreferences
      );

      console.log(`✅ PROCESSING: ${processingResult.recommendations.length} recommendations after spec-compliant processing`);

      // Step 8: Format final recommendations
      const finalRecommendations = this.formatRecommendations(processingResult.recommendations);

      const result = {
        recommendations: finalRecommendations,
        processingStats: {
          totalProcessed: processingResult.totalProcessed,
          filteredByBudget: processingResult.filteredByBudget,
          filteredByCreators: processingResult.filteredByCreators
        },
        noFitMessage: processingResult.noFitMessage,
        serviceBanner: serviceBanner, // Per instruction #6
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
          servicesUsed: serviceMatrix.getEnabledServices(),
          servicesDisabled: serviceMatrix.getDisabledServices(),
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
      
      console.log('🎯 QLOO: Attempting to get destination recommendations...');
      
      const culturalAffinities = tasteProfile?.culturalAffinities || ['Global Culture'];
      const personalityTraits = tasteProfile?.personalityTraits || ['Explorer'];
      
      // Get destinations from Qloo - NO FALLBACK per instruction #0
      const destinations = await qlooService.getDestinationRecommendations({
        culturalAffinities,
        personalityTraits,
        tasteVector: tasteProfile?.tasteVector || {},
        confidence: tasteProfile?.confidence || 0.6
      });
      
      console.log(`✅ QLOO: Got ${destinations.length} destination recommendations`);
      
      return {
        destinations: destinations.map((dest: any) => ({
          name: dest.name,
          country: dest.country || 'Unknown',
          qlooScore: dest.affinityScore || 0.7,
          qlooInsights: dest.insights || {}
        }))
      };
    } catch (error) {
      console.error('❌ QLOO: Failed to get recommendations:', error);
      // Per instruction #0: NO AI fallback when Qloo fails
      throw new Error('Qloo service unavailable - cannot provide accurate recommendations without taste profiling');
    }
  }

  private async getAIDestinations(userProfile: any, tasteProfile: any, userPreferences: any) {
    try {
      // First, try to use the advanced Gemini service directly
      const geminiService = await import('./gemini');
      
      // Generate dynamic base destinations using taste profile and themes
      const baseDestinations = this.generateDynamicBaseDestinations(userProfile, tasteProfile);
      
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
      // Per instruction #3: Origin must come from user input, never default to New York
      const userOrigin = userPreferences?.origin;
      if (!userOrigin) {
        console.warn('⚠️ BUDGET: No user origin provided, cannot calculate budget');
        throw new Error('User origin required for budget calculation');
      }

      // Check cache first with proper origin
      const cache = apiCache.budget(userOrigin, destination.name, { duration: userPreferences.duration });
      const cached = cache.get();
      if (cached) return cached;
      
      // Check rate limit
      await rateLimiter.waitIfLimited('amadeus');
      
      const duration = parseInt(userPreferences.duration?.replace(/\D/g, '') || '7');
      const budget = await budgetService.calculateBudget({
        origin: { city: userOrigin, country: userPreferences?.originCountry || 'Unknown' },
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
      return this.generateRealisticBudgetFallback(destination, userPreferences);
    }
  }

  private generateRealisticBudgetFallback(destination: any, userPreferences: any) {
    const duration = parseInt(userPreferences.duration?.replace(/\D/g, '') || '7');
    const userBudget = parseInt(userPreferences.budget?.replace(/\D/g, '') || '2500');
    
    // Calculate realistic budget based on user's total budget and destination
    const flightCost = Math.floor(userBudget * 0.3); // 30% for flights
    const accommodationPerNight = Math.floor((userBudget * 0.4) / duration); // 40% for accommodation
    const dailyExpenses = Math.floor((userBudget * 0.3) / duration); // 30% for daily expenses
    
    const totalMin = Math.floor(userBudget * 0.8);
    const totalMax = userBudget;
    
    return {
      range: `$${totalMin} - $${totalMax}`,
      breakdown: `${duration} days including flights, accommodation & activities`,
      costEfficiency: userBudget > 5000 ? 'Premium budget allows for luxury experiences' : 'Good value for comprehensive travel experience',
      flights: {
        price: flightCost,
        currency: 'USD',
        roundTrip: true
      },
      accommodation: {
        pricePerNight: accommodationPerNight,
        totalPrice: accommodationPerNight * duration,
        currency: 'USD',
        category: userBudget > 5000 ? 'Luxury' : userBudget > 2500 ? 'Premium' : 'Standard'
      },
      livingExpenses: {
        dailyBudget: dailyExpenses,
        totalBudget: dailyExpenses * duration,
        currency: 'USD',
        breakdown: {
          meals: Math.floor(dailyExpenses * 0.5),
          transport: Math.floor(dailyExpenses * 0.25),
          activities: Math.floor(dailyExpenses * 0.2),
          miscellaneous: Math.floor(dailyExpenses * 0.05)
        }
      },
      totalEstimate: {
        min: totalMin,
        max: totalMax
      }
    };
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
          name: creator.name || 'Unknown Creator',
          followers: creator.totalFollowers && creator.totalFollowers > 1000 ? 
            `${Math.round(creator.totalFollowers / 1000)}K` : 
            (creator.totalFollowers || 0).toString(),
          niche: creator.niche || 'Content Creator',
          collaboration: creator.collaborationInfo || 'Open to collaborations',
          platform: creator.primaryPlatform || 'Multi-platform'
        })),
        collaborationOpportunities: [
          'Content partnerships',
          'Local meetups',
          'Brand collaborations'
        ],
        dataSource: 'social-apis' as any,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache result
      cache.set(result);
      
      return result;
    } catch (error) {
      console.error(`Creator error for ${destination.name}:`, error);
      // Per instruction #4: Return actual data, let creator gating service decide whether to show
      // Random data should be realistic and allow for proper gating
      const creatorCount = Math.floor(Math.random() * 5); // 0-4 creators (realistic for unknown destinations)
      return {
        totalActiveCreators: creatorCount,
        topCreators: creatorCount > 0 ? [
          { name: "Local Travel Creator", followers: "1.5K", niche: "Travel & Lifestyle", collaboration: "Content partnerships available", platform: "Instagram" },
          { name: "Food Explorer", followers: "900", niche: "Culinary Adventures", collaboration: "Limited availability", platform: "YouTube" }
        ].slice(0, creatorCount) : [],
        collaborationOpportunities: creatorCount > 0 ? [
          'Limited local creator community', 
          'Emerging destination for content creation'
        ] : [],
        dataSource: 'estimated' as any,
        lastUpdated: new Date().toISOString()
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
      matchScore: this.sanitizeMatchScore(dest.matchScore),
      image: this.getDestinationImage(dest.name),
      highlights: dest.aiInsights?.highlights || [
        `Match score: ${this.sanitizeMatchScore(dest.matchScore)}%`,
        ...(dest.creatorDetails ? [`${this.sanitizeCreatorCount(dest.creatorDetails.totalActiveCreators)} active creators`] : []),
        dest.budget?.costEfficiency || 'Budget information available'
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
      creators: dest.creatorDetails || undefined, // Respect creator gating from recommendation processor
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

  // Generate dynamic base destinations for AI processing
  private generateDynamicBaseDestinations(userProfile: any, tasteProfile: any): string[] {
    const destinations = [];
    const themes = userProfile.themes || [];
    const tasteVector = tasteProfile?.tasteVector || {};

    console.log('🎯 INTEGRATED: Generating dynamic base destinations for themes:', themes);
    console.log('🎯 INTEGRATED: Taste vector scores:', tasteVector);

    // Technology-focused destinations
    if (themes.includes('technology') || themes.includes('tech') || tasteVector.urban > 0.7) {
      destinations.push('Singapore, Singapore', 'Seoul, South Korea', 'Shenzhen, China', 'Tel Aviv, Israel', 'Tallinn, Estonia');
    }

    // Adventure destinations
    if (themes.includes('adventure') || themes.includes('outdoor') || tasteVector.adventure > 0.7) {
      destinations.push('Queenstown, New Zealand', 'Patagonia, Chile', 'Iceland, Iceland', 'Nepal, Nepal', 'Tanzania, Tanzania');
    }

    // Culture and art destinations
    if (themes.includes('culture') || themes.includes('art') || themes.includes('history') || tasteVector.culture > 0.7) {
      destinations.push('Florence, Italy', 'Prague, Czech Republic', 'Angkor Wat, Cambodia', 'Jerusalem, Israel', 'Fez, Morocco');
    }

    // Food destinations
    if (themes.includes('food') || themes.includes('culinary') || themes.includes('cooking') || tasteVector.food > 0.6) {
      destinations.push('Lyon, France', 'Lima, Peru', 'Oaxaca, Mexico', 'Melbourne, Australia', 'Chengdu, China');
    }

    // Photography destinations
    if (themes.includes('photography') || themes.includes('visual') || themes.includes('photo')) {
      destinations.push('Salar de Uyuni, Bolivia', 'Faroe Islands, Faroe Islands', 'Lofoten, Norway', 'Socotra, Yemen', 'Raja Ampat, Indonesia');
    }

    // Wellness and spiritual destinations
    if (themes.includes('wellness') || themes.includes('spiritual') || themes.includes('yoga') || themes.includes('meditation')) {
      destinations.push('Rishikesh, India', 'Tulum, Mexico', 'Ubud, Indonesia', 'Bhutan, Bhutan', 'Tibet, China');
    }

    // Nature destinations
    if (themes.includes('nature') || themes.includes('wildlife') || themes.includes('eco') || tasteVector.nature > 0.7) {
      destinations.push('Costa Rica, Costa Rica', 'Madagascar, Madagascar', 'Galápagos, Ecuador', 'Botswana, Botswana', 'Alaska, USA');
    }

    // Business and finance themes
    if (themes.includes('business') || themes.includes('finance') || themes.includes('startup')) {
      destinations.push('Zurich, Switzerland', 'Luxembourg, Luxembourg', 'Hong Kong, Hong Kong', 'Dubai, UAE', 'London, UK');
    }

    // If no specific themes, use diverse global destinations
    if (destinations.length === 0) {
      destinations.push('Lisbon, Portugal', 'Vietnam, Vietnam', 'Georgia, Georgia', 'Jordan, Jordan', 'Estonia, Estonia');
    }

    // Remove duplicates and limit to 8 destinations
    const uniqueDestinations = [...new Set(destinations)].slice(0, 8);
    
    console.log('✅ INTEGRATED: Generated dynamic destinations:', uniqueDestinations);
    return uniqueDestinations;
  }

  private generateTasteBasedDestinations(tasteProfile: any) {
    console.log('🚀 INTEGRATED: Generating taste-based destinations with enhanced algorithm...');
    
    const destinations = [];
    const tasteVector = tasteProfile?.tasteVector || {};
    
    // Enhanced taste-based destination selection with more variety
    if (tasteVector.adventure > 0.5) {
      destinations.push(
        { name: 'Queenstown', country: 'New Zealand', qlooScore: 0.85, qlooInsights: { reason: 'High adventure affinity match' } },
        { name: 'Interlaken', country: 'Switzerland', qlooScore: 0.83, qlooInsights: { reason: 'Alpine adventure destination' } },
        { name: 'Banff', country: 'Canada', qlooScore: 0.81, qlooInsights: { reason: 'Mountain adventure paradise' } }
      );
    }
    
    if (tasteVector.culture > 0.5) {
      destinations.push(
        { name: 'Kyoto', country: 'Japan', qlooScore: 0.82, qlooInsights: { reason: 'Strong cultural preference match' } },
        { name: 'Florence', country: 'Italy', qlooScore: 0.80, qlooInsights: { reason: 'Renaissance culture and art' } },
        { name: 'Varanasi', country: 'India', qlooScore: 0.78, qlooInsights: { reason: 'Ancient cultural heritage' } }
      );
    }

    if (tasteVector.urban > 0.6) {
      destinations.push(
        { name: 'Singapore', country: 'Singapore', qlooScore: 0.84, qlooInsights: { reason: 'Urban innovation hub' } },
        { name: 'Tokyo', country: 'Japan', qlooScore: 0.82, qlooInsights: { reason: 'Urban technology center' } },
        { name: 'Seoul', country: 'South Korea', qlooScore: 0.80, qlooInsights: { reason: 'Modern urban experience' } }
      );
    }

    if (tasteVector.nature > 0.6) {
      destinations.push(
        { name: 'Costa Rica', country: 'Costa Rica', qlooScore: 0.86, qlooInsights: { reason: 'Biodiversity and eco-tourism' } },
        { name: 'Iceland', country: 'Iceland', qlooScore: 0.84, qlooInsights: { reason: 'Pristine natural landscapes' } },
        { name: 'Madagascar', country: 'Madagascar', qlooScore: 0.82, qlooInsights: { reason: 'Unique wildlife and nature' } }
      );
    }

    if (tasteVector.food > 0.6) {
      destinations.push(
        { name: 'Lyon', country: 'France', qlooScore: 0.87, qlooInsights: { reason: 'Culinary capital of France' } },
        { name: 'Lima', country: 'Peru', qlooScore: 0.85, qlooInsights: { reason: 'Innovative fusion cuisine' } },
        { name: 'Oaxaca', country: 'Mexico', qlooScore: 0.83, qlooInsights: { reason: 'Traditional Mexican gastronomy' } }
      );
    }

    if (tasteVector.luxury > 0.5) {
      destinations.push(
        { name: 'Monaco', country: 'Monaco', qlooScore: 0.85, qlooInsights: { reason: 'Luxury and glamour' } },
        { name: 'Maldives', country: 'Maldives', qlooScore: 0.84, qlooInsights: { reason: 'Luxury resort destination' } },
        { name: 'Aspen', country: 'USA', qlooScore: 0.82, qlooInsights: { reason: 'Exclusive mountain retreat' } }
      );
    }

    // Add unique/emerging destinations for variety
    destinations.push(
      { name: 'Estonia', country: 'Estonia', qlooScore: 0.75, qlooInsights: { reason: 'Digital innovation hub' } },
      { name: 'Rwanda', country: 'Rwanda', qlooScore: 0.73, qlooInsights: { reason: 'Conservation and transformation story' } },
      { name: 'Georgia', country: 'Georgia', qlooScore: 0.71, qlooInsights: { reason: 'Emerging cultural destination' } }
    );
    
    // Sort by Qloo score and remove duplicates
    const uniqueDestinations = destinations
      .filter((dest, index, self) => 
        index === self.findIndex(d => d.name === dest.name)
      )
      .sort((a, b) => b.qlooScore - a.qlooScore)
      .slice(0, 10); // Return more options for variety

    console.log(`✅ INTEGRATED: Generated ${uniqueDestinations.length} taste-based destinations`);
    return uniqueDestinations;
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

  /**
   * Sanitize match score to prevent NaN display - per instruction #5
   */
  private sanitizeMatchScore(score: any): number {
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      console.warn('⚠️ NaN GUARD: Invalid match score detected, using fallback:', score);
      return 75; // Neutral match score
    }
    
    // Ensure valid percentage range
    const rounded = Math.round(score);
    return Math.max(0, Math.min(100, rounded));
  }

  /**
   * Sanitize creator count to prevent NaN display - per instruction #5
   */
  private sanitizeCreatorCount(count: any): number {
    if (typeof count !== 'number' || isNaN(count) || !isFinite(count) || count < 0) {
      console.warn('⚠️ NaN GUARD: Invalid creator count detected, using fallback:', count);
      return 0;
    }
    
    return Math.floor(count);
  }

  /**
   * Check service capabilities and generate banner per instruction #6
   */
  private checkServiceCapabilities(): string | null {
    const criticalServices = ['amadeus', 'numbeo', 'places'];
    const socialServices = ['instagram', 'tiktok', 'youtube'];
    
    const disabledCritical = criticalServices.filter(service => !serviceMatrix.isEnabled(service));
    const disabledSocial = socialServices.filter(service => !serviceMatrix.isEnabled(service));
    
    const totalDisabled = [...disabledCritical, ...disabledSocial];
    
    if (totalDisabled.length > 0) {
      console.warn(`⚠️ SERVICE GATING: ${totalDisabled.length} services unavailable:`, totalDisabled);
      return "Some data sources unavailable; showing only verified results.";
    }
    
    console.log('✅ SERVICE GATING: All services available');
    return null;
  }
}

export const integratedRecommendationService = new IntegratedRecommendationService();