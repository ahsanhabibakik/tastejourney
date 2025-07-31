import { NextRequest, NextResponse } from "next/server";

// Types for the recommendation system
interface TasteVector {
  adventure: number;
  culture: number;
  luxury: number;
  food: number;
  nature: number;
  urban: number;
  budget: number;
}

interface UserPreferences {
  budget: string; // "500-1000" | "1000-2500" | "2500-5000" | "5000+"
  duration: string; // "1-3" | "4-7" | "8-14" | "15+"
  style: string; // "adventure" | "luxury" | "cultural" | "beach" | "urban"
  contentFocus: string; // "photography" | "food" | "lifestyle" | "adventure"
}

interface WebsiteData {
  themes: string[];
  hints: string[];
  regionBias: string[];
  socialLinks: string[];
  title: string;
  description: string;
}

interface Destination {
  id: number;
  name: string;
  country: string;
  region: string;
  tags: string[];
  avgCost: number;
  activeCreators: number;
  brands: {
    name: string;
    type: string;
    commission: string;
    contactEmail?: string;
  }[];
  qlooAffinityScore: number;
  creatorDensity: number;
  brandFitScore: number;
  budgetFitScore: number;
  geoFitScore: number;
  totalScore?: number;
  image: string;
  highlights: string[];
  bestMonths: string[];
  visaRequired: boolean;
  safetyRating: number;
  travelTime: string;
  engagement: {
    avgLikes: number;
    avgComments: number;
    potential: string;
    reason: string;
  };
}

interface RecommendationRequest {
  tasteVector: TasteVector;
  userPreferences: UserPreferences;
  websiteData: WebsiteData;
}

// Mock destinations database - in production, this would come from a real database
const mockDestinations: Destination[] = [
  {
    id: 1,
    name: "Bali",
    country: "Indonesia",
    region: "southeast-asia",
    tags: ["adventure", "culture", "food", "beach", "spiritual"],
    avgCost: 1500,
    activeCreators: 142,
    brands: [
      {
        name: "AdventureBound Gear",
        type: "Equipment",
        commission: "15%",
        contactEmail: "partnerships@adventurebound.com",
      },
      {
        name: "TasteTrek Culinary",
        type: "Food Tours",
        commission: "20%",
        contactEmail: "collabs@tastetrek.com",
      },
      {
        name: "WanderStay Boutique Hotels",
        type: "Accommodation",
        commission: "12%",
        contactEmail: "creators@wanderstay.com",
      },
    ],
    qlooAffinityScore: 0,
    creatorDensity: 0,
    brandFitScore: 0,
    budgetFitScore: 0,
    geoFitScore: 0,
    image:
      "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400",
    highlights: [
      "Perfect for adventure & food content",
      "140+ active travel creators",
      "15 brand partnerships available",
    ],
    bestMonths: ["April-May", "September-October"],
    visaRequired: false,
    safetyRating: 4.2,
    travelTime: "14-18 hours",
    engagement: {
      avgLikes: 2500,
      avgComments: 180,
      potential: "High",
      reason: "Strong alignment with adventure & cultural content",
    },
  },
  {
    id: 2,
    name: "Santorini",
    country: "Greece",
    region: "europe",
    tags: ["luxury", "photography", "romance", "architecture", "wine"],
    avgCost: 2100,
    activeCreators: 85,
    brands: [
      {
        name: "StyleVoyager Fashion",
        type: "Fashion",
        commission: "18%",
        contactEmail: "brand@stylevoyager.com",
      },
      {
        name: "LuxeStay Resorts",
        type: "Luxury Hotels",
        commission: "10%",
        contactEmail: "influencers@luxestay.com",
      },
      {
        name: "Mediterranean Gourmet",
        type: "Fine Dining",
        commission: "25%",
        contactEmail: "partnerships@medgourmet.com",
      },
    ],
    qlooAffinityScore: 0,
    creatorDensity: 0,
    brandFitScore: 0,
    budgetFitScore: 0,
    geoFitScore: 0,
    image:
      "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400",
    highlights: [
      "Ideal for photography & lifestyle content",
      "85+ local creators for collaboration",
      "12 luxury brand partnerships",
    ],
    bestMonths: ["May-June", "September"],
    visaRequired: false,
    safetyRating: 4.8,
    travelTime: "10-14 hours",
    engagement: {
      avgLikes: 3200,
      avgComments: 240,
      potential: "Very High",
      reason: "Premium aesthetic matches audience preferences",
    },
  },
  {
    id: 3,
    name: "Kyoto",
    country: "Japan",
    region: "east-asia",
    tags: ["culture", "traditional", "technology", "temples", "authentic"],
    avgCost: 1900,
    activeCreators: 95,
    brands: [
      {
        name: "TechGear Cultural Tech",
        type: "Technology",
        commission: "12%",
        contactEmail: "creators@techgear.jp",
      },
      {
        name: "ZenStay Traditional Inns",
        type: "Traditional Hotels",
        commission: "15%",
        contactEmail: "partnerships@zenstay.jp",
      },
      {
        name: "Artisan Craft Co.",
        type: "Crafts & Souvenirs",
        commission: "22%",
        contactEmail: "collabs@artisancraft.jp",
      },
    ],
    qlooAffinityScore: 0,
    creatorDensity: 0,
    brandFitScore: 0,
    budgetFitScore: 0,
    geoFitScore: 0,
    image:
      "https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=400",
    highlights: [
      "Rich cultural content opportunities",
      "95+ creators in cultural niche",
      "18 traditional & modern brands",
    ],
    bestMonths: ["March-April", "October-November"],
    visaRequired: false,
    safetyRating: 4.9,
    travelTime: "12-16 hours",
    engagement: {
      avgLikes: 2800,
      avgComments: 200,
      potential: "High",
      reason: "Unique cultural experiences drive high engagement",
    },
  },
  {
    id: 4,
    name: "Tulum",
    country: "Mexico",
    region: "north-america",
    tags: ["beach", "wellness", "photography", "eco", "bohemian"],
    avgCost: 1200,
    activeCreators: 78,
    brands: [
      {
        name: "EcoWear Sustainable Fashion",
        type: "Sustainable Fashion",
        commission: "20%",
        contactEmail: "partnerships@ecowear.mx",
      },
      {
        name: "Wellness Retreats Co.",
        type: "Wellness",
        commission: "18%",
        contactEmail: "creators@wellnessretreats.mx",
      },
      {
        name: "Bohemian Stays",
        type: "Boutique Hotels",
        commission: "14%",
        contactEmail: "influencers@bohemianstays.mx",
      },
    ],
    qlooAffinityScore: 0,
    creatorDensity: 0,
    brandFitScore: 0,
    budgetFitScore: 0,
    geoFitScore: 0,
    image:
      "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400",
    highlights: [
      "Perfect for wellness & lifestyle content",
      "78+ active wellness creators",
      "Strong eco-tourism brand partnerships",
    ],
    bestMonths: ["November-April"],
    visaRequired: false,
    safetyRating: 4.1,
    travelTime: "8-12 hours",
    engagement: {
      avgLikes: 2200,
      avgComments: 160,
      potential: "High",
      reason: "Wellness and sustainability trends are growing",
    },
  },
  {
    id: 5,
    name: "Dubai",
    country: "UAE",
    region: "middle-east",
    tags: ["luxury", "urban", "technology", "shopping", "architecture"],
    avgCost: 2800,
    activeCreators: 120,
    brands: [
      {
        name: "Luxury Lifestyle Brands",
        type: "Luxury Goods",
        commission: "25%",
        contactEmail: "partnerships@luxurylifestyle.ae",
      },
      {
        name: "Tech Innovation Hub",
        type: "Technology",
        commission: "15%",
        contactEmail: "creators@techinnovation.ae",
      },
      {
        name: "Premium Hospitality Group",
        type: "Luxury Hotels",
        commission: "12%",
        contactEmail: "influencers@premiumhospitality.ae",
      },
    ],
    qlooAffinityScore: 0,
    creatorDensity: 0,
    brandFitScore: 0,
    budgetFitScore: 0,
    geoFitScore: 0,
    image:
      "https://images.pexels.com/photos/1470502/pexels-photo-1470502.jpeg?auto=compress&cs=tinysrgb&w=400",
    highlights: [
      "Ultimate luxury lifestyle content",
      "120+ luxury-focused creators",
      "High-value brand partnerships",
    ],
    bestMonths: ["November-March"],
    visaRequired: false,
    safetyRating: 4.7,
    travelTime: "12-16 hours",
    engagement: {
      avgLikes: 4500,
      avgComments: 320,
      potential: "Very High",
      reason: "Luxury content performs exceptionally well",
    },
  },
];

// Scoring functions
function calculateQlooAffinity(
  destination: Destination,
  tasteVector: TasteVector
): number {
  let score = 0;
  const tagWeights: { [key: string]: keyof TasteVector } = {
    adventure: "adventure",
    culture: "culture",
    luxury: "luxury",
    food: "food",
    nature: "nature",
    urban: "urban",
    beach: "nature",
    traditional: "culture",
    photography: "culture",
    wellness: "nature",
  };

  destination.tags.forEach((tag) => {
    const vectorKey = tagWeights[tag];
    if (vectorKey && tasteVector[vectorKey]) {
      score += tasteVector[vectorKey];
    }
  });

  return Math.min(score / destination.tags.length, 1); // Normalize to 0-1
}

function calculateCreatorDensity(destination: Destination): number {
  // Normalize creator count (assuming max of 200 creators per destination)
  return Math.min(destination.activeCreators / 200, 1);
}

function calculateBrandFit(
  destination: Destination,
  contentFocus: string
): number {
  const focusMapping: { [key: string]: string[] } = {
    photography: ["fashion", "luxury", "equipment"],
    food: ["food", "culinary", "restaurants"],
    lifestyle: ["fashion", "wellness", "luxury"],
    adventure: ["equipment", "outdoor", "sports"],
  };

  const relevantTypes = focusMapping[contentFocus] || [];
  const matchingBrands = destination.brands.filter((brand) =>
    relevantTypes.some((type) => brand.type.toLowerCase().includes(type))
  );

  return Math.min(matchingBrands.length / destination.brands.length, 1);
}

function calculateBudgetMatch(
  destination: Destination,
  budgetRange: string
): number {
  const budgetRanges: { [key: string]: [number, number] } = {
    "500-1000": [500, 1000],
    "1000-2500": [1000, 2500],
    "2500-5000": [2500, 5000],
    "5000+": [5000, 10000],
  };

  const [minBudget, maxBudget] = budgetRanges[budgetRange] || [0, 10000];
  const destCost = destination.avgCost;

  if (destCost >= minBudget && destCost <= maxBudget) {
    return 1.0; // Perfect match
  } else if (destCost < minBudget) {
    return 0.8; // Under budget is still good
  } else {
    // Over budget - penalize based on how much over
    const overBudgetRatio = (destCost - maxBudget) / maxBudget;
    return Math.max(0, 1 - overBudgetRatio);
  }
}

function calculateGeoFit(
  destination: Destination,
  websiteData: WebsiteData
): number {
  // Simple region matching based on website hints
  const regionPreferences = websiteData.regionBias || [];
  if (regionPreferences.length === 0) return 0.5; // Neutral if no preference

  const hasRegionMatch = regionPreferences.some(
    (region) =>
      destination.region.includes(region.toLowerCase()) ||
      destination.country.toLowerCase().includes(region.toLowerCase())
  );

  return hasRegionMatch ? 1.0 : 0.3;
}

// Main scoring function
function scoreDestination(
  destination: Destination,
  tasteVector: TasteVector,
  userPreferences: UserPreferences,
  websiteData: WebsiteData
): Destination {
  const qlooAffinity = calculateQlooAffinity(destination, tasteVector);
  const creatorDensity = calculateCreatorDensity(destination);
  const brandFit = calculateBrandFit(destination, userPreferences.contentFocus);
  const budgetMatch = calculateBudgetMatch(destination, userPreferences.budget);
  const geoFit = calculateGeoFit(destination, websiteData);

  // Apply the scoring formula
  const totalScore =
    0.45 * qlooAffinity +
    0.25 * creatorDensity +
    0.15 * brandFit +
    0.1 * budgetMatch +
    0.05 * geoFit;

  return {
    ...destination,
    qlooAffinityScore: qlooAffinity,
    creatorDensity: creatorDensity,
    brandFitScore: brandFit,
    budgetFitScore: budgetMatch,
    geoFitScore: geoFit,
    totalScore: totalScore,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { tasteVector, userPreferences, websiteData } = body;

    if (!tasteVector || !userPreferences || !websiteData) {
      return NextResponse.json({
        error: "Missing required fields: tasteVector, userPreferences, websiteData",
      }, { status: 400 });
    }

    // Score all destinations
    const scoredDestinations = mockDestinations.map((destination) =>
      scoreDestination(destination, tasteVector, userPreferences, websiteData)
    );

    // Sort by total score and get top 3
    const topDestinations = scoredDestinations
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 3);

    // Enrich each destination with SerpApi data

    async function fetchSerpApi(type: string, q: string) {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/serpapi?type=${type}&q=${encodeURIComponent(q)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.data || null;
      } catch {
        return null;
      }
    }

    async function fetchNumbeo(city: string) {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/cost-of-living?city=${encodeURIComponent(city)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.data || null;
      } catch {
        return null;
      }
    }

    async function fetchFlights(origin: string, destination: string, departureDate: string) {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departureDate=${encodeURIComponent(departureDate)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.data || null;
      } catch {
        return null;
      }
    }

    async function fetchHotels(cityCode: string, checkInDate: string, checkOutDate: string) {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/hotels?cityCode=${encodeURIComponent(cityCode)}&checkInDate=${encodeURIComponent(checkInDate)}&checkOutDate=${encodeURIComponent(checkOutDate)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.data || null;
      } catch {
        return null;
      }
    }

    // For demo, use static origin and dates; in production, use user input or geolocation
    const staticOrigin = "JFK";
    const staticDeparture = "2025-09-01";
    const staticCheckIn = "2025-09-01";
    const staticCheckOut = "2025-09-08";

    const recommendations = await Promise.all(topDestinations.map(async (dest) => {
      const placeQuery = `${dest.name}, ${dest.country}`;
      const youtubeQuery = `${dest.name} travel vlog`;
      const factQuery = dest.name;
      const city = dest.name;
      // For Amadeus, you would need to map city/country to IATA code; here we use static for demo
      const cityCode = dest.country === "Japan" ? "KYO" : dest.country === "Greece" ? "JTR" : dest.country === "Indonesia" ? "DPS" : dest.country === "Mexico" ? "CUN" : dest.country === "UAE" ? "DXB" : "";

      const [maps, youtube, knowledgeGraph, numbeo, flights, hotels] = await Promise.all([
        fetchSerpApi("maps", placeQuery),
        fetchSerpApi("youtube", youtubeQuery),
        fetchSerpApi("knowledge_graph", factQuery),
        fetchNumbeo(city),
        cityCode ? fetchFlights(staticOrigin, cityCode, staticDeparture) : null,
        cityCode ? fetchHotels(cityCode, staticCheckIn, staticCheckOut) : null,
      ]);

      return {
        id: dest.id,
        destination: `${dest.name}, ${dest.country}`,
        matchScore: Math.round((dest.totalScore || 0) * 100),
        image: dest.image,
        highlights: dest.highlights,
        budget: {
          range: `$${dest.avgCost - 300} - $${dest.avgCost + 300}`,
          breakdown: "7 days including flights, accommodation & activities",
          currency: "USD",
        },
        engagement: dest.engagement,
        collaborations: dest.brands,
        creators: dest.activeCreators,
        bestMonths: dest.bestMonths,
        travelTime: dest.travelTime,
        visaRequired: dest.visaRequired,
        safetyRating: dest.safetyRating,
        tags: dest.tags,
        scoreBreakdown: {
          qlooAffinity: Math.round(dest.qlooAffinityScore * 100),
          creatorDensity: Math.round(dest.creatorDensity * 100),
          brandFit: Math.round(dest.brandFitScore * 100),
          budgetMatch: Math.round(dest.budgetFitScore * 100),
          geoFit: Math.round(dest.geoFitScore * 100),
          total: Math.round((dest.totalScore || 0) * 100),
        },
        enrichment: {
          serpapi: {
            maps,
            youtube,
            knowledgeGraph,
          },
          numbeo,
          flights,
          hotels,
        },
      };
    }));

    // Simulate processing time for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      recommendations,
      totalCount: recommendations.length,
      processingTime: "2.3s",
      algorithm: "TasteJourney v1.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json({
      error: "Failed to generate recommendations",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
