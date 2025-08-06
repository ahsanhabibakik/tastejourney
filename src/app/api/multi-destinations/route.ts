import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/services/gemini";
import { errorHandler } from "@/services/errorHandler";

interface MultiDestinationRequest {
  destinations: string[];
  userProfile: {
    website: string;
    contentThemes: string[];
    audienceInterests: string[];
    contentType: string;
    audienceLocation: string;
  };
  tasteProfile?: any;
  userPreferences?: {
    budget?: string;
    travelStyle?: string;
    duration?: string;
    contentType?: string;
    climate?: string[];
  };
  websiteData?: any;
}

export async function POST(request: NextRequest) {
  return await errorHandler.withFallback(
    async () => {
      const body: MultiDestinationRequest = await request.json();
      
      if (!body.destinations || body.destinations.length === 0) {
        return NextResponse.json(
          { error: "Destinations array is required and cannot be empty" },
          { status: 400 }
        );
      }

      if (!body.userProfile) {
        return NextResponse.json(
          { error: "User profile is required" },
          { status: 400 }
        );
      }

      console.log(`🚀 Processing multi-destination analysis for ${body.destinations.length} destinations...`);

      // Use the advanced generateMultipleRecommendations method
      const multipleRecommendations = await geminiService.generateMultipleRecommendations(
        body.destinations,
        {
          userProfile: body.userProfile,
          tasteProfile: body.tasteProfile,
          userPreferences: body.userPreferences || {}
        }
      );

      // Transform to include additional metadata and enhanced data
      const enhancedRecommendations = multipleRecommendations.map((rec, index) => ({
        id: index + 1,
        destination: rec.destination,
        country: rec.destination.split(',')[1]?.trim() || 'Unknown',
        matchScore: rec.matchScore,
        confidence: rec.confidence,
        factChecked: rec.factChecked,
        image: getDestinationImage(rec.destination),
        
        // Core recommendation data
        summary: rec.summary,
        highlights: rec.highlights,
        detailedDescription: rec.detailedDescription,
        
        // Content creation opportunities
        contentOpportunities: rec.contentOpportunities,
        
        // Brand collaboration insights
        brandCollaborations: rec.brandCollaborations,
        
        // Local creator networking
        localCreators: rec.localCreators,
        
        // Budget and practical information
        budgetBreakdown: rec.budgetBreakdown,
        bestTimeToVisit: rec.bestTimeToVisit,
        practicalInfo: rec.practicalInfo,
        
        // Tags and categorization
        tags: rec.tags,
        
        // Enhanced scoring breakdown
        scoring: {
          matchScore: rec.matchScore,
          confidence: rec.confidence,
          factors: {
            contentAlignment: calculateContentAlignment(rec, body.userProfile),
            audienceEngagement: calculateAudienceEngagement(rec, body.userProfile),
            monetizationPotential: calculateMonetizationPotential(rec),
            practicalFeasibility: calculatePracticalFeasibility(rec, body.userPreferences)
          }
        }
      }));

      // Sort by match score (already sorted by Gemini service, but ensure consistency)
      const sortedRecommendations = enhancedRecommendations.sort((a, b) => b.matchScore - a.matchScore);

      console.log(`✅ Generated ${sortedRecommendations.length} enhanced multi-destination recommendations`);

      return NextResponse.json({
        success: true,
        recommendations: sortedRecommendations,
        totalCount: sortedRecommendations.length,
        processing: {
          inputDestinations: body.destinations.length,
          successfulRecommendations: sortedRecommendations.length,
          averageMatchScore: Math.round(
            sortedRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / sortedRecommendations.length
          ),
          averageConfidence: sortedRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / sortedRecommendations.length,
          factCheckedCount: sortedRecommendations.filter(rec => rec.factChecked).length
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now(),
          apiVersion: 'multi-destinations-v1',
          service: 'advanced-gemini-multi-processing',
          features: [
            'Multi-destination batch processing',
            'Comprehensive content opportunity analysis',
            'Brand collaboration mapping',
            'Local creator networking insights',
            'Budget optimization across destinations',
            'Seasonal timing recommendations',
            'Fact-checking verification',
            'Enhanced scoring algorithm'
          ],
          userProfile: {
            contentThemes: body.userProfile.contentThemes,
            contentType: body.userProfile.contentType,
            audienceLocation: body.userProfile.audienceLocation
          }
        }
      });
    },
    async (): Promise<NextResponse> => {
      // Fallback: Return simplified multi-destination processing
      const body: MultiDestinationRequest = await request.json();
      
      console.warn('🔄 Using fallback multi-destination processing...');
      
      const fallbackRecommendations = body.destinations.map((dest, index) => ({
        id: index + 1,
        destination: dest,
        country: dest.split(',')[1]?.trim() || 'Unknown',
        matchScore: Math.floor(Math.random() * 20) + 75, // 75-95
        confidence: 0.7,
        factChecked: false,
        image: getDestinationImage(dest),
        summary: `${dest} offers excellent opportunities for ${body.userProfile.contentType} creators.`,
        highlights: [
          "Great content creation potential",
          "Growing creator community", 
          "Diverse collaboration opportunities"
        ],
        tags: body.userProfile.contentThemes.slice(0, 5),
        contentOpportunities: {
          videoIdeas: ["Local culture exploration", "Hidden gems tour", "Food and lifestyle content"],
          photoSpots: ["Iconic landmarks", "Local markets", "Scenic viewpoints"],
          storytellingAngles: ["Cultural immersion", "Adventure journey", "Local discoveries"]
        },
        brandCollaborations: {
          suggestedBrands: ["Tourism boards", "Local businesses", "Travel gear brands"],
          monetizationPotential: "Medium to High"
        },
        budgetBreakdown: {
          summary: "Moderate budget destination",
          costEfficiency: "Good value for content creators"
        }
      }));

      return NextResponse.json({
        success: true,
        recommendations: fallbackRecommendations,
        totalCount: fallbackRecommendations.length,
        metadata: {
          fallback: true,
          processingTime: Date.now(),
          apiVersion: 'multi-destinations-fallback-v1',
          message: 'Fallback processing used due to service unavailability'
        }
      });
    },
    'multi-destinations-api',
    'process-multiple-destinations',
    { timeout: 45000 } // Longer timeout for multi-destination processing
  );
}

// Helper functions for enhanced scoring
function calculateContentAlignment(recommendation: any, userProfile: any): number {
  const contentThemes = userProfile.contentThemes || [];
  const recTags = recommendation.tags || [];
  
  const alignmentScore = contentThemes.reduce((score: number, theme: string) => {
    const hasMatch = recTags.some((tag: string) => 
      tag.toLowerCase().includes(theme.toLowerCase()) || 
      theme.toLowerCase().includes(tag.toLowerCase())
    );
    return score + (hasMatch ? 1 : 0);
  }, 0);
  
  return Math.min(alignmentScore / Math.max(contentThemes.length, 1), 1);
}

function calculateAudienceEngagement(recommendation: any, userProfile: any): number {
  // Calculate based on content opportunities and audience location
  const videoIdeas = recommendation.contentOpportunities?.videoIdeas?.length || 0;
  const photoSpots = recommendation.contentOpportunities?.photoSpots?.length || 0;
  const storytellingAngles = recommendation.contentOpportunities?.storytellingAngles?.length || 0;
  
  const opportunityScore = (videoIdeas + photoSpots + storytellingAngles) / 15; // Normalize to 0-1
  
  return Math.min(opportunityScore, 1);
}

function calculateMonetizationPotential(recommendation: any): number {
  const brandCount = recommendation.brandCollaborations?.suggestedBrands?.length || 0;
  const collaborationTypes = recommendation.brandCollaborations?.collaborationTypes?.length || 0;
  
  const monetizationScore = (brandCount + collaborationTypes * 2) / 10; // Normalize
  
  return Math.min(monetizationScore, 1);
}

function calculatePracticalFeasibility(recommendation: any, userPreferences: any): number {
  let feasibilityScore = 0.7; // Base score
  
  // Adjust based on budget alignment
  if (userPreferences?.budget && recommendation.budgetBreakdown?.costEfficiency) {
    if (recommendation.budgetBreakdown.costEfficiency.includes('Excellent')) {
      feasibilityScore += 0.2;
    } else if (recommendation.budgetBreakdown.costEfficiency.includes('Good')) {
      feasibilityScore += 0.1;
    }
  }
  
  // Adjust based on practical info availability
  if (recommendation.practicalInfo?.visa && recommendation.practicalInfo?.safetyTips) {
    feasibilityScore += 0.1;
  }
  
  return Math.min(feasibilityScore, 1);
}

function getDestinationImage(destination: string): string {
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
    'Istanbul, Turkey': 'https://images.pexels.com/photos/1141853/pexels-photo-1141853.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Sydney, Australia': 'https://images.pexels.com/photos/783309/pexels-photo-783309.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Kyoto, Japan': 'https://images.pexels.com/photos/161172/pexels-photo-161172.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Marrakech, Morocco': 'https://images.pexels.com/photos/739407/pexels-photo-739407.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Cape Town, South Africa': 'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Bangkok, Thailand': 'https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Mexico City, Mexico': 'https://images.pexels.com/photos/121848/pexels-photo-121848.jpeg?auto=compress&cs=tinysrgb&w=400'
  };
  
  // Enhanced fallback with hash-based selection
  const fallbackImages = [
    'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  
  if (imageMap[destination]) {
    return imageMap[destination];
  }
  
  // Use hash of destination for consistent fallback selection
  const hash = destination.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return fallbackImages[Math.abs(hash) % fallbackImages.length];
}