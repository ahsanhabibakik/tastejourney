import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { websiteData, tasteVector } = await request.json();

    if (!websiteData) {
      return NextResponse.json(
        { error: "Website data is required" },
        { status: 400 }
      );
    }
    if (!tasteVector) {
      return NextResponse.json(
        { error: "tasteVector is required" },
        { status: 400 }
      );
    }

    // Enhanced destinations with detailed creator collaboration info
    const destinations = [
      {
        id: 1,
        destination: "Bali, Indonesia",
        matchScore: 94,
        image:
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400",
        highlights: [
          "Perfect for adventure & food content",
          "140+ active travel creators",
          "15 brand partnerships available",
        ],
        budget: {
          range: "$1,200 - $1,800",
          breakdown: "7 days including flights, accommodation & activities",
        },
        engagement: {
          potential: "High",
          reason: "Strong alignment with adventure & cultural content",
        },
        collaborations: [
          "AdventureBound Gear",
          "TasteTrek Culinary",
          "WanderStay Boutique Hotels",
        ],
        creators: 142,
        bestMonths: ["April-May", "September-October"],
        creatorDetails: {
          totalActiveCreators: 142,
          topCreators: [
            { name: "BaliAdventureLife", followers: "850K", niche: "Adventure Travel", collaboration: "Content partnerships" },
            { name: "TropicalFoodie", followers: "520K", niche: "Food & Culture", collaboration: "Restaurant reviews" },
            { name: "IslandLifestyle", followers: "380K", niche: "Lifestyle", collaboration: "Accommodation features" }
          ],
          collaborationOpportunities: [
            "Joint adventure content creation",
            "Cultural immersion experiences",
            "Food tour partnerships",
            "Accommodation brand deals"
          ]
        },
        tags: ["adventure", "culture", "food", "beach", "tropical"]
      },
      {
        id: 2,
        destination: "Santorini, Greece",
        matchScore: 89,
        image:
          "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400",
        highlights: [
          "Ideal for photography & lifestyle content",
          "85+ local creators for collaboration",
          "12 luxury brand partnerships",
        ],
        budget: {
          range: "$1,800 - $2,400",
          breakdown: "7 days including flights, accommodation & activities",
        },
        engagement: {
          potential: "Very High",
          reason: "Premium aesthetic matches your audience preferences",
        },
        collaborations: [
          "StyleVoyager Fashion",
          "LuxeStay Resorts",
          "Mediterranean Gourmet",
        ],
        creators: 85,
        bestMonths: ["May-June", "September"],
        creatorDetails: {
          totalActiveCreators: 85,
          topCreators: [
            { name: "SantoriniSunsets", followers: "1.2M", niche: "Photography", collaboration: "Photo location guides" },
            { name: "GreekIslandLife", followers: "680K", niche: "Luxury Travel", collaboration: "Hotel partnerships" },
            { name: "MediterraneanVibes", followers: "420K", niche: "Lifestyle", collaboration: "Cultural experiences" }
          ],
          collaborationOpportunities: [
            "Luxury accommodation reviews",
            "Photography workshop collaborations",
            "Wine tasting content",
            "Sunset cruise partnerships"
          ]
        },
        tags: ["photography", "luxury", "mediterranean", "culture", "romantic"]
      },
      {
        id: 3,
        destination: "Kyoto, Japan",
        matchScore: 87,
        image:
          "https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=400",
        highlights: [
          "Rich cultural content opportunities",
          "95+ creators in cultural niche",
          "18 traditional & modern brands",
        ],
        budget: {
          range: "$1,600 - $2,200",
          breakdown: "7 days including flights, accommodation & activities",
        },
        engagement: {
          potential: "High",
          reason: "Unique cultural experiences drive high engagement",
        },
        collaborations: [
          "TechGear Cultural Tech",
          "ZenStay Traditional Inns",
          "Artisan Craft Co.",
        ],
        creators: 95,
        bestMonths: ["March-April", "October-November"],
        creatorDetails: {
          totalActiveCreators: 95,
          topCreators: [
            { name: "KyotoTraditions", followers: "720K", niche: "Cultural", collaboration: "Temple & tradition content" },
            { name: "JapanFoodExplorer", followers: "590K", niche: "Food Culture", collaboration: "Traditional cuisine features" },
            { name: "ZenLifestyle", followers: "340K", niche: "Mindfulness", collaboration: "Meditation retreat content" }
          ],
          collaborationOpportunities: [
            "Traditional craft workshops",
            "Temple meditation sessions",
            "Tea ceremony experiences",
            "Seasonal festival coverage"
          ]
        },
        tags: ["culture", "tradition", "food", "mindfulness", "photography"]
      },
    ];

    // Score destinations using tasteVector
    const scored = destinations.map(dest => {
      let score = 0;
      if (dest.highlights) {
        dest.highlights.forEach(h => {
          if (h.toLowerCase().includes("adventure")) score += (tasteVector.adventure || 0) * 20;
          if (h.toLowerCase().includes("food")) score += (tasteVector.food || 0) * 20;
          if (h.toLowerCase().includes("culture")) score += (tasteVector.culture || 0) * 20;
          if (h.toLowerCase().includes("luxury")) score += (tasteVector.luxury || 0) * 20;
        });
      }
      return { ...dest, matchScore: Math.round(score + 70) };
    });

    // Sort by matchScore descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      recommendations: scored,
      totalCount: scored.length,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
