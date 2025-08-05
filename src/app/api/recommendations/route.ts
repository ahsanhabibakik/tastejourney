import { NextRequest, NextResponse } from "next/server";
import { integratedRecommendationService } from "@/services/integrated-recommendation";
import { dynamicRecommendationService } from "@/services/dynamic-recommendation";
import { errorHandler } from "@/services/errorHandler";

export async function POST(request: NextRequest) {
  // Parse the request body once, before passing to error handler
  const requestBody = await request.json();
  const { tasteVector, userPreferences, websiteData } = requestBody;
  
  return await errorHandler.withFallback(
    async () => {

      if (!websiteData) {
        return NextResponse.json(
          { error: "Website data is required" },
          { status: 400 }
        );
      }

      console.log('🚀 Starting integrated recommendation generation with PRD compliance...');

      // Prepare user profile from website data
      const userProfile = {
        url: websiteData.url || '',
        themes: websiteData.themes || [],
        hints: websiteData.hints || [],
        contentType: websiteData.contentType || 'Mixed',
        socialLinks: websiteData.socialLinks || [],
        title: websiteData.title || '',
        description: websiteData.description || '',
        keywords: websiteData.keywords || [],
        audienceLocation: websiteData.location || 'Global'
      };

      // Prepare taste profile with enhanced fallback
      const tasteProfile = tasteVector ? {
        tasteVector,
        confidence: 0.8,
        culturalAffinities: ['adventure', 'culture', 'food'],
        personalityTraits: ['explorer', 'creative', 'social']
      } : {
        tasteVector: dynamicRecommendationService.generateTasteVectorFromProfile(userProfile),
        confidence: 0.6,
        culturalAffinities: dynamicRecommendationService.inferCulturalAffinities(userProfile.themes),
        personalityTraits: ['explorer', 'creative']
      };

      // Use integrated recommendation service with all PRD components
      const result = await integratedRecommendationService.generateRecommendations(
        userProfile,
        tasteProfile,
        userPreferences
      );

      console.log(`✅ Generated ${result.recommendations.length} optimized recommendations`);

      return NextResponse.json({
        recommendations: result.recommendations,
        totalCount: result.recommendations.length,
        metadata: {
          ...result.metadata,
          processingTime: Date.now(),
          fallback: false,
          apiVersion: 'optimized-v2'
        }
      });
    },
    async () => {
      try {
        console.warn('Primary service failed, using dynamic fallback with Gemini API');
        // Use the already parsed request body
        const fallbackData = await getDynamicFallbackRecommendations(websiteData, userPreferences);
        return NextResponse.json({
          recommendations: fallbackData.recommendations,
          totalCount: fallbackData.totalCount,
          metadata: fallbackData.metadata
        });
      } catch (error) {
        return NextResponse.json(
          { error: "Fallback recommendation generation failed" },
          { status: 500 }
        );
      }
    },
    'recommendations-api',
    'generate-recommendations',
    { timeout: 30000 } // Increase timeout to 30 seconds
  );
}

async function getDynamicFallbackRecommendations(websiteData: Record<string, unknown>, userPreferences: Record<string, unknown>) {
  console.log('🚨 Generating advanced dynamic fallback recommendations using enhanced Gemini service...');
  
  try {
    // Import the enhanced Gemini service
    const { geminiService } = await import('@/services/gemini');
    
    const userProfile = {
      website: (websiteData.url as string) || '',
      contentThemes: (websiteData.themes as string[]) || ['travel', 'adventure'],
      audienceInterests: (websiteData.hints as string[]) || [],
      contentType: (websiteData.contentType as string) || 'Mixed',
      audienceLocation: (websiteData.location as string) || 'Global'
    };

    // Use the advanced generateDynamicRecommendation method with smart destination selection
    const smartDestinations = await generateSmartDestinations(userProfile, userPreferences);
    
    // Generate advanced recommendations for each destination
    const advancedRecommendations = await Promise.all(
      smartDestinations.map(async (dest) => {
        return await geminiService.generateDynamicRecommendation({
          userProfile,
          tasteProfile: null, // No taste profile in fallback
          destination: {
            name: dest.city,
            country: dest.country,
            coordinates: dest.coordinates
          },
          budgetData: null,
          localCreators: null,
          places: null,
          userPreferences: {
            budget: userPreferences?.budget as string,
            travelStyle: userPreferences?.travelStyle as string || 'mid-range',
            duration: userPreferences?.duration as string || '7 days',
            contentType: userPreferences?.contentType as string || userProfile.contentType,
            climate: userPreferences?.climate as string[] || []
          }
        });
      })
    );

    // Transform to API format
    const transformedRecommendations = advancedRecommendations.map((rec, index) => ({
      id: index + 1,
      destination: rec.destination,
      country: rec.destination.split(',')[1]?.trim() || 'Unknown',
      matchScore: rec.matchScore,
      image: getDestinationImage(rec.destination),
      highlights: rec.highlights,
      budget: {
        range: rec.budgetBreakdown.summary,
        breakdown: rec.budgetBreakdown.costEfficiency,
        costEfficiency: rec.budgetBreakdown.costEfficiency
      },
      engagement: {
        potential: rec.brandCollaborations.monetizationPotential,
        reason: rec.summary
      },
      creatorDetails: {
        totalActiveCreators: rec.localCreators.topCollaborators.length * 10 + Math.floor(Math.random() * 50),
        topCreators: rec.localCreators.topCollaborators.map(creator => ({
          name: creator.name,
          followers: creator.followers,
          niche: creator.collaborationReason,
          collaboration: creator.collaborationReason
        })),
        collaborationOpportunities: rec.localCreators.networkingOpportunities
      },
      tags: rec.tags,
      bestMonths: rec.bestTimeToVisit.months,
      // Additional enhanced data from Gemini
      contentOpportunities: rec.contentOpportunities,
      brandCollaborations: rec.brandCollaborations,
      practicalInfo: rec.practicalInfo,
      confidence: rec.confidence,
      factChecked: rec.factChecked
    }));

    console.log(`✅ Generated ${transformedRecommendations.length} advanced dynamic recommendations using enhanced Gemini service`);
    
    return {
      recommendations: transformedRecommendations,
      totalCount: transformedRecommendations.length,
      metadata: {
        fallback: true,
        dynamic: true,
        enhanced: true,
        processingTime: Date.now(),
        apiVersion: 'enhanced-gemini-fallback-v4',
        message: 'Advanced AI-generated recommendations using enhanced Gemini service with structured data',
        source: 'enhanced-gemini-service',
        features: [
          'Content opportunity analysis',
          'Brand collaboration insights',
          'Local creator networking',
          'Practical travel information',
          'Fact-checking verification',
          'Budget optimization'
        ]
      }
    };
  } catch (error) {
    console.error('Enhanced Gemini fallback failed, using basic API approach:', error);
    return await getBasicGeminiFallback(websiteData, userPreferences);
  }
}

async function generateSmartDestinations(userProfile: any, userPreferences: any) {
  // Smart destination selection based on content themes and preferences
  const destinations = [
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, themes: ['technology', 'culture', 'food', 'urban'] },
    { city: 'Bali', country: 'Indonesia', coordinates: { lat: -8.3405, lng: 115.0920 }, themes: ['wellness', 'nature', 'spiritual', 'adventure'] },
    { city: 'Lisbon', country: 'Portugal', coordinates: { lat: 38.7223, lng: -9.1393 }, themes: ['culture', 'history', 'food', 'coastal'] },
    { city: 'Mexico City', country: 'Mexico', coordinates: { lat: 19.4326, lng: -99.1332 }, themes: ['culture', 'food', 'art', 'history'] },
    { city: 'Istanbul', country: 'Turkey', coordinates: { lat: 41.0082, lng: 28.9784 }, themes: ['culture', 'history', 'food', 'architecture'] },
    { city: 'Barcelona', country: 'Spain', coordinates: { lat: 41.3851, lng: 2.1734 }, themes: ['art', 'culture', 'food', 'architecture'] },
    { city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.7563, lng: 100.5018 }, themes: ['food', 'culture', 'adventure', 'spiritual'] },
    { city: 'Cape Town', country: 'South Africa', coordinates: { lat: -33.9249, lng: 18.4241 }, themes: ['nature', 'adventure', 'wine', 'culture'] }
  ];

  // Score destinations based on user themes
  const scoredDestinations = destinations.map(dest => {
    const themeMatches = userProfile.contentThemes.filter((theme: string) => 
      dest.themes.some(destTheme => 
        destTheme.toLowerCase().includes(theme.toLowerCase()) || 
        theme.toLowerCase().includes(destTheme.toLowerCase())
      )
    ).length;
    
    return {
      ...dest,
      score: themeMatches + Math.random() * 0.5 // Add some randomness
    };
  });

  // Return top 3 destinations
  return scoredDestinations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function getBasicGeminiFallback(websiteData: Record<string, unknown>, userPreferences: Record<string, unknown>) {
  // Keep the original basic implementation as ultimate fallback
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return getStaticFallbackRecommendations();
  }

  const userProfile = websiteData ? {
    themes: (websiteData.themes as string[]) || ['travel', 'adventure'],
    contentType: (websiteData.contentType as string) || 'Mixed',
    audienceLocation: (websiteData.location as string) || 'Global',
    hints: (websiteData.hints as string[]) || []
  } : { themes: ['travel'], contentType: 'Mixed', audienceLocation: 'Global', hints: [] };

  const dynamicPrompt = `Generate 3 travel destinations for a ${userProfile.contentType} content creator with themes: ${userProfile.themes.join(', ')}. Include destination, country, match score (85-95), highlights, budget info, and creator opportunities. Return as JSON array.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: dynamicPrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = aiResponse?.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]).map((rec: any) => ({
          ...rec,
          image: getDestinationImage(rec.destination)
        }));
        
        return {
          recommendations,
          totalCount: recommendations.length,
          metadata: {
            fallback: true,
            dynamic: true,
            processingTime: Date.now(),
            apiVersion: 'basic-gemini-fallback-v3',
            source: 'basic-gemini-api'
          }
        };
      }
    }
  } catch (error) {
    console.error('Basic Gemini API fallback failed:', error);
  }
  
  return getStaticFallbackRecommendations();
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
    'Cape Town, South Africa': 'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=400'
  };

  // Enhanced image fallback with better default
  const fallbackImages = [
    'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  
  const selectedImage = imageMap[destination];
  if (selectedImage) return selectedImage;
  
  // Use hash of destination name to consistently pick same fallback
  const hash = destination.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return fallbackImages[Math.abs(hash) % fallbackImages.length];
}

function getStaticFallbackRecommendations() {
  console.log('🔄 Using static fallback recommendations as last resort');
  return {
    recommendations: [
      {
        id: 1,
        destination: "Bali, Indonesia",
        country: "Indonesia",
        matchScore: 92,
        image: getDestinationImage("Bali, Indonesia"),
        highlights: [
          "Perfect for adventure & cultural content creation",
          "180+ active travel creators in region",
          "25+ brand partnerships opportunities available"
        ],
        budget: {
          range: "$1,200 - $1,800",
          breakdown: "7 days including flights, accommodation & activities",
          costEfficiency: "Excellent value for content creation ROI"
        },
        engagement: {
          potential: "Very High",
          reason: "Strong alignment with adventure & cultural content preferences"
        },
        creatorDetails: {
          totalActiveCreators: 182,
          topCreators: [
            { name: "BaliBound", followers: "85K", niche: "Adventure Travel", collaboration: "Content partnerships available" }
          ],
          collaborationOpportunities: ["Creator meetups", "Brand partnerships", "Cultural exchanges"]
        },
        tags: ["adventure", "culture", "budget-friendly", "instagram-worthy", "food"],
        bestMonths: ["April-May", "September-October"]
      }
    ],
    totalCount: 1,
    metadata: {
      fallback: true,
      dynamic: false,
      processingTime: Date.now(),
      apiVersion: 'static-fallback-v2',
      message: 'Static fallback used as last resort'
    }
  };
}

