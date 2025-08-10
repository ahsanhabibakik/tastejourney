"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  DollarSign,
  Users,
  Briefcase,
  Star,
  TrendingUp,
  Camera,
  Heart,
  Calendar,
  Globe,
  ChevronRight,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Plane,
  Hotel,
  Utensils,
  Filter,
  SortDesc,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Recommendation {
  id: number;
  destination: string;
  country: string;
  matchScore: number;
  image: string;
  highlights: string[];
  budget: {
    range: string;
    breakdown: string;
    currency: string;
  };
  engagement: {
    potential: string;
    reason: string;
    avgLikes: number;
    avgComments: number;
  };
  collaborations: {
    name: string;
    type: string;
    commission: string;
  }[];
  creators?: {
    totalActiveCreators: number;
    topCreators: any[];
  };
  bestMonths: string[];
  travelTime: string;
  visaRequired: boolean;
  safetyRating: number;
  tags: string[];
}

interface RecommendationsData {
  recommendations: Recommendation[];
  serviceBanner?: string;
}

const RecommendationsScreen: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"match" | "budget" | "engagement">("match");
  const [filterBy, setFilterBy] = useState<"all" | "budget" | "luxury" | "adventure">("all");
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<number>>(new Set());

  // Load bookmarks from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("bookmarkedDestinations");
    if (stored) {
      setBookmarkedItems(new Set(JSON.parse(stored)));
    }
  }, []);

  // Sync bookmarks to localStorage
  React.useEffect(() => {
    localStorage.setItem("bookmarkedDestinations", JSON.stringify(Array.from(bookmarkedItems)));
  }, [bookmarkedItems]);

  // Accept recommendations and Qloo enrichment from props or context
  // For demo, fallback to mock data if not provided
  const recommendationsData = (typeof window !== 'undefined' && (window as typeof window & { 
    recommendationsResult?: RecommendationsData & {
      qloo?: {
        confidence?: number;
        culturalAffinities?: string[];
        personalityTraits?: string[];
      };
    } 
  }).recommendationsResult) || {};
  const recommendations: Recommendation[] = recommendationsData.recommendations || [
    {
      id: 1,
      destination: "Bali",
      country: "Indonesia",
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
        currency: "USD",
      },
      engagement: {
        potential: "High",
        reason: "Strong alignment with adventure & cultural content",
        avgLikes: 2500,
        avgComments: 180,
      },
      collaborations: [
        { name: "AdventureBound Gear", type: "Equipment", commission: "15%" },
        { name: "TasteTrek Culinary", type: "Food Tours", commission: "20%" },
        {
          name: "WanderStay Boutique Hotels",
          type: "Accommodation",
          commission: "12%",
        },
      ],
      creators: {
        totalActiveCreators: 142,
        topCreators: []
      },
      bestMonths: ["April-May", "September-October"],
      travelTime: "14-18 hours",
      visaRequired: false,
      safetyRating: 4.2,
      tags: ["Adventure", "Culture", "Food", "Beach", "Affordable"],
    },
    {
      id: 2,
      destination: "Santorini",
      country: "Greece",
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
        currency: "USD",
      },
      engagement: {
        potential: "Very High",
        reason: "Premium aesthetic matches your audience preferences",
        avgLikes: 3200,
        avgComments: 240,
      },
      collaborations: [
        { name: "StyleVoyager Fashion", type: "Fashion", commission: "18%" },
        { name: "LuxeStay Resorts", type: "Luxury Hotels", commission: "10%" },
        {
          name: "Mediterranean Gourmet",
          type: "Fine Dining",
          commission: "25%",
        },
      ],
      creators: {
        totalActiveCreators: 85,
        topCreators: []
      },
      bestMonths: ["May-June", "September"],
      travelTime: "10-14 hours",
      visaRequired: false,
      safetyRating: 4.8,
      tags: ["Luxury", "Photography", "Romance", "Architecture", "Premium"],
    },
    {
      id: 3,
      destination: "Kyoto",
      country: "Japan",
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
        currency: "USD",
      },
      engagement: {
        potential: "High",
        reason: "Unique cultural experiences drive high engagement",
        avgLikes: 2800,
        avgComments: 200,
      },
      collaborations: [
        {
          name: "TechGear Cultural Tech",
          type: "Technology",
          commission: "12%",
        },
        {
          name: "ZenStay Traditional Inns",
          type: "Traditional Hotels",
          commission: "15%",
        },
        {
          name: "Artisan Craft Co.",
          type: "Crafts & Souvenirs",
          commission: "22%",
        },
      ],
      creators: {
        totalActiveCreators: 95,
        topCreators: []
      },
      bestMonths: ["March-April", "October-November"],
      travelTime: "12-16 hours",
      visaRequired: false,
      safetyRating: 4.9,
      tags: ["Culture", "Traditional", "Technology", "Temples", "Authentic"],
    },
  ];

  const handleBookmark = (id: number) => {
    const newBookmarks = new Set(bookmarkedItems);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
      // Remove from backend
      fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: id.toString() })
      });
    } else {
      newBookmarks.add(id);
      // Add to backend
      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: id.toString() })
      });
    }
    setBookmarkedItems(newBookmarks);
  };

  const handleShare = async (destination: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${destination} - TasteJourney Recommendation`,
          text: `I found this amazing travel destination recommendation for content creators!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    switch (sortBy) {
      case "match":
        return b.matchScore - a.matchScore;
      case "budget":
        return (
          parseInt(
            a.budget.range.split(" - ")[0].replace("$", "").replace(",", "")
          ) -
          parseInt(
            b.budget.range.split(" - ")[0].replace("$", "").replace(",", "")
          )
        );
      case "engagement":
        return b.engagement.avgLikes - a.engagement.avgLikes;
      default:
        return 0;
    }
  });

  const filteredRecommendations = sortedRecommendations.filter((rec) => {
    if (filterBy === "all") return true;
    return rec.tags.some((tag) => tag.toLowerCase().includes(filterBy));
  });

  // Qloo enrichment
  const qloo = recommendationsData.qloo || {};

  return (
    <div className="mt-4 sm:mt-6 space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Qloo Enrichment Section */}
      {qloo && (
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
          <h4 className="text-xl font-bold text-primary mb-2">Your AI Taste Profile</h4>
          {qloo.confidence && (
            <div className="mb-2 text-sm text-muted-foreground">
              <strong>Confidence:</strong> {(qloo.confidence * 100).toFixed(1)}%
            </div>
          )}
          {qloo.culturalAffinities && qloo.culturalAffinities.length > 0 && (
            <div className="mb-2 text-sm text-muted-foreground">
              <strong>Cultural Affinities:</strong> {qloo.culturalAffinities.join(", ")}
            </div>
          )}
          {qloo.personalityTraits && qloo.personalityTraits.length > 0 && (
            <div className="mb-2 text-sm text-muted-foreground">
              <strong>Personality Traits:</strong> {qloo.personalityTraits.join(", ")}
            </div>
          )}
        </div>
      )}
      <div className="text-center pb-6 border-b border-border">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-4 text-center sm:text-left">
          <div className="relative mb-2 sm:mb-0">
            <Globe className="h-10 w-10 text-primary sm:mr-3" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground text-center sm:text-left">
              Your Personalized Travel Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered insights for content creators
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Optimized for content creation, audience engagement, and monetization
          opportunities based on your website analysis
        </p>

        {/* Stats Bar */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {recommendations.length}
            </div>
            <div className="text-xs text-muted-foreground">Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {recommendations.reduce((sum, rec) => sum + (rec.creators?.totalActiveCreators || 0), 0)}+
            </div>
            <div className="text-xs text-muted-foreground">Active Creators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {recommendations.reduce(
                (sum, rec) => sum + rec.collaborations.length,
                0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Brand Partners</div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
            <select
              value={filterBy}
              onChange={(e) =>
                setFilterBy(
                  e.target.value as "all" | "budget" | "luxury" | "adventure"
                )
              }
              className="bg-background border border-border rounded px-2 py-1 text-sm"
              aria-label="Filter recommendations"
            >
              <option value="all">All Destinations</option>
              <option value="budget">Budget Friendly</option>
              <option value="luxury">Luxury</option>
              <option value="adventure">Adventure</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SortDesc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "match" | "budget" | "engagement")
              }
              className="bg-background border border-border rounded px-2 py-1 text-sm"
              aria-label="Sort recommendations"
            >
              <option value="match">Match Score</option>
              <option value="budget">Budget</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Banner */}
      {recommendationsData.serviceBanner && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          {recommendationsData.serviceBanner}
        </div>
      )}

      {/* Enhanced Recommendations Grid - Responsive Layout */}
      <div 
        className="grid gap-4 sm:gap-6 lg:gap-8"
        style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        {filteredRecommendations.map((rec, index) => (
          <Card
            key={rec.id}
            className={`overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
              selectedDestination === rec.id ? "ring-2 ring-primary/50" : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Compact Image Section */}
            <div className="relative group">
              <Image
                src={rec.image}
                alt={rec.destination}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />

              {/* Overlay Badges */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground font-semibold">
                  {rec.matchScore}% Match
                </Badge>
              </div>

              {/* Budget Badge - per specification */}
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Aligned
                </Badge>
              </div>

              {/* Quick Actions */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBookmark(rec.id)}
                    className={`h-8 w-8 p-0 ${
                      bookmarkedItems.has(rec.id) ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleShare(rec.destination)}
                    className="h-8 w-8 p-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Compact Content Section - Per Specification */}
            <div className="p-4">
              {/* Destination Name */}
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {rec.destination}
              </h3>

              {/* 2-3 Key Highlights - Per Specification */}
              <div className="mb-4">
                <ul className="space-y-2">
                  {rec.highlights.slice(0, 3).map((highlight, idx) => (
                    <li
                      key={rec.id + '-highlight-' + idx}
                      className="text-sm text-muted-foreground flex items-start"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Budget Range */}
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  {rec.budget.range}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rec.budget.breakdown}
                </p>
              </div>

              {/* Creators Section - Only if gated "true" per specification */}
              {rec.creators && rec.creators.totalActiveCreators >= 2 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-foreground mb-2 flex items-center">
                    <Users className="h-4 w-4 text-primary mr-1" />
                    Creator Community
                  </h6>
                  <p className="text-sm text-muted-foreground">
                    {rec.creators.totalActiveCreators}+ active creators
                  </p>
                </div>
              )}

              {/* Mobile Details Toggle */}
              <div className="block lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedDestination(
                      selectedDestination === rec.id ? null : rec.id
                    )
                  }
                  className="w-full justify-between"
                >
                  <span>Details</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    selectedDestination === rec.id ? "rotate-90" : ""
                  }`} />
                </Button>
              </div>

              {/* Collapsible Details - Default Collapsed on Mobile */}
              {selectedDestination === rec.id && (
                <div className="mt-4 p-3 bg-muted/20 rounded-lg border space-y-3">
                  <div>
                    <h6 className="text-sm font-medium mb-2">Travel Info</h6>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Travel time: {rec.travelTime}</p>
                      <p>Best months: {rec.bestMonths.join(", ")}</p>
                      <p>Safety rating: {rec.safetyRating}/5</p>
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium mb-2">Engagement</h6>
                    <p className="text-sm text-muted-foreground">
                      {rec.engagement.reason}
                    </p>
                  </div>

                  <div>
                    <h6 className="text-sm font-medium mb-2">Brand Opportunities</h6>
                    <div className="flex flex-wrap gap-1">
                      {rec.collaborations.slice(0, 3).map((collab, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {collab.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Enhanced Email Report Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <CardContent className="p-8 text-center relative">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📧</span>
              </div>
              <div className="text-left">
                <h4 className="text-2xl font-bold text-primary mb-1">
                  Detailed Report Coming Your Way!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analysis and actionable insights
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 text-lg">
              A comprehensive PDF report with detailed cost breakdowns,
              collaboration contacts, and content creation guides will be sent
              to your email within the next few minutes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mb-2"></div>
                <span className="font-medium">Cost Analysis</span>
                <span className="text-xs text-muted-foreground">
                  Detailed breakdowns
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full mb-2"></div>
                <span className="font-medium">Brand Contacts</span>
                <span className="text-xs text-muted-foreground">
                  Direct connections
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full mb-2"></div>
                <span className="font-medium">Content Guides</span>
                <span className="text-xs text-muted-foreground">
                  Creation strategies
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg">
                <div className="w-3 h-3 bg-orange-500 rounded-full mb-2"></div>
                <span className="font-medium">Itineraries</span>
                <span className="text-xs text-muted-foreground">
                  Day-by-day plans
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Action Cards */}
      <Card>
        <CardContent className="p-8">
          <h4 className="text-2xl font-bold text-foreground mb-6 text-center">
            What would you like to explore next?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. Primary Destinations Card */}
            <Card
              className="p-6 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group"
              onClick={() => console.log("More destinations clicked")}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h5 className="font-semibold text-foreground mb-2 text-lg">
                  Get More Destinations
                </h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore additional travel recommendations based on different
                  criteria or seasons
                </p>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Explore More <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>

            {/* 2. Budget Planning Card */}
            <Card
              className="p-6 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-600/50 group"
              onClick={() => console.log("Budget planning clicked")}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h5 className="font-semibold text-foreground mb-2 text-lg">
                  Budget Planning
                </h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Get detailed cost breakdowns and budget optimization tips for
                  your chosen destination
                </p>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-green-600 group-hover:text-white transition-colors"
                >
                  Plan Budget <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>

            {/* 3. Brand Collaborations Card */}
            <Card
              className="p-6 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-600/50 group"
              onClick={() => console.log("Brand collaborations clicked")}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
                <h5 className="font-semibold text-foreground mb-2 text-lg">
                  Brand Collaborations
                </h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn more about specific brand partnership opportunities and
                  how to approach them
                </p>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:bg-purple-600 group-hover:text-white transition-colors"
                >
                  View Partnerships <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsScreen;
