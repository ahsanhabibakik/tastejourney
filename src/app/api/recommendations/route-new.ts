import { NextRequest, NextResponse } from "next/server";
import destinationsData from "@/data/comprehensive-destinations.json";

// Get all recommendations from JSON file
function getAllRecommendationsFromJSON() {
  return destinationsData.destinations;
}

// Filter recommendations based on user preferences
function filterRecommendations(recommendations: any[], userPreferences: any) {
  if (!userPreferences) return recommendations.slice(0, 3);

  let filtered = [...recommendations];

  // Filter by budget
  if (userPreferences.budget) {
    const budget = userPreferences.budget;
    if (budget === "budget") {
      filtered = filtered.filter(rec => 
        rec.budget_insights?.budget_variants?.budget || 
        rec.budget_insights?.budget_variants?.backpacker
      );
    } else if (budget === "luxury") {
      filtered = filtered.filter(rec => 
        rec.budget_insights?.budget_variants?.luxury || 
        rec.budget_insights?.budget_variants?.mid_range
      );
    }
  }

  // Filter by climate
  if (userPreferences.climate && Array.isArray(userPreferences.climate)) {
    filtered = filtered.filter(rec => 
      userPreferences.climate.some((climate: string) => 
        rec.climate === climate.toLowerCase()
      )
    );
  }

  // Filter by content focus
  if (userPreferences.contentFocus) {
    const contentFocus = userPreferences.contentFocus.toLowerCase();
    filtered = filtered.filter(rec => {
      const alignment = rec.content_focus_alignment;
      if (!alignment) return true;
      
      // Get the score for the user's content focus
      const score = alignment[contentFocus] || 0;
      return score >= 7; // Only show destinations with high alignment
    });
  }

  // Sort by match score (using the destination's potential_audience_engagement score)
  filtered.sort((a, b) => {
    const scoreA = a.potential_audience_engagement?.score || a.match_score || 0;
    const scoreB = b.potential_audience_engagement?.score || b.match_score || 0;
    return scoreB - scoreA;
  });

  return filtered.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userPreferences, websiteData } = body;

    console.log("🎯 Getting recommendations from JSON file");
    
    // Get all destinations from JSON
    const allRecommendations = getAllRecommendationsFromJSON();
    
    // Filter based on user preferences
    const filteredRecommendations = filterRecommendations(allRecommendations, userPreferences);
    
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      recommendations: filteredRecommendations,
      metadata: {
        totalDestinations: filteredRecommendations.length,
        source: "comprehensive-destinations.json",
        avgScore: Math.round(
          filteredRecommendations.reduce((sum, rec) => 
            sum + (rec.potential_audience_engagement?.score || rec.match_score || 0), 0
          ) / filteredRecommendations.length * 10
        ) / 10,
        generatedAt: new Date().toISOString(),
        userPreferences: userPreferences || "none"
      }
    });

  } catch (error) {
    console.error("❌ Recommendations API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
