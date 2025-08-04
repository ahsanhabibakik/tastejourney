import { NextRequest, NextResponse } from "next/server";
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

      console.log('🚀 Starting optimized recommendation generation for:', websiteData.url);

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

      // Generate dynamic recommendations with optimized flow
      const result = await dynamicRecommendationService.generateDynamicRecommendations(
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
  console.log('🚨 Generating dynamic fallback recommendations using Gemini API...');
  
  try {
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

    const dynamicPrompt = `
You are a travel recommendation expert for content creators. Based on this user profile, generate 3 unique travel destinations with comprehensive details.

**USER PROFILE:**
- Content Themes: ${userProfile.themes.join(', ')}
- Content Type: ${userProfile.contentType}
- Audience Location: ${userProfile.audienceLocation}
- Preferences: ${JSON.stringify(userPreferences || {})}

**REQUIREMENTS:**
Generate exactly 3 destinations that are:
1. Unique and diverse (different continents/regions)
2. Optimized for content creation
3. Include realistic creator community data
4. Include accurate budget estimates
5. Match the user's content themes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": 1,
    "destination": "City, Country",
    "country": "Country Name",
    "matchScore": 85-95,
    "highlights": ["3 specific highlights for content creators"],
    "budget": {
      "range": "$X - $Y for 7 days",
      "breakdown": "detailed cost breakdown",
      "costEfficiency": "value assessment"
    },
    "engagement": {
      "potential": "High/Very High/Exceptional",
      "reason": "why this appeals to their audience"
    },
    "creatorDetails": {
      "totalActiveCreators": 50-200,
      "topCreators": [
        {"name": "CreatorName", "followers": "XK", "niche": "content type", "collaboration": "opportunity type"}
      ],
      "collaborationOpportunities": ["3 realistic opportunities"]
    },
    "tags": ["5-7 relevant tags"],
    "bestMonths": ["optimal travel months"]
  }
]

Ensure destinations are:
- Realistic and currently accessible
- Diverse (different continents/cultures)
- Aligned with user's ${userProfile.themes.join(' & ')} interests
- Suitable for ${userProfile.contentType} content creation
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: dynamicPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3000,
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API failed:', response.status);
      return getStaticFallbackRecommendations();
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      console.error('No AI response received');
      return getStaticFallbackRecommendations();
    }

    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const dynamicRecommendations = JSON.parse(jsonMatch[0]);
        
        // Add images to each recommendation
        const recommendationsWithImages = dynamicRecommendations.map((rec: Record<string, unknown>) => ({
          ...rec,
          image: getDestinationImage(rec.destination as string)
        }));

        console.log('✅ Generated dynamic recommendations from Gemini API');
        return {
          recommendations: recommendationsWithImages,
          totalCount: recommendationsWithImages.length,
          metadata: {
            fallback: true,
            dynamic: true,
            processingTime: Date.now(),
            apiVersion: 'dynamic-fallback-v3',
            message: 'AI-generated recommendations using Gemini API',
            source: 'gemini-api'
          }
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON response:', parseError);
      }
    }
    
    console.warn('Failed to extract valid JSON from Gemini response');
    return getStaticFallbackRecommendations();
  } catch (error) {
    console.error('Dynamic fallback generation failed:', error);
    return getStaticFallbackRecommendations();
  }
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

