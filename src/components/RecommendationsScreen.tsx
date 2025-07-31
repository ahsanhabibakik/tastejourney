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
  ThumbsUp,
  MessageCircle,
  Sparkles,
  Award,
  Zap,
  Target,
  Eye,
  Layers,
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
  creators: number;
  bestMonths: string[];
  travelTime: string;
  visaRequired: boolean;
  safetyRating: number;
  tags: string[];
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
  const recommendationsData = (typeof window !== 'undefined' && (window as typeof window & { recommendationsResult?: { recommendations?: Recommendation[] } }).recommendationsResult) || {};
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
      creators: 142,
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
      creators: 85,
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
      creators: 95,
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

  // Qloo enrichment - removed for now
  // const qloo = recommendationsData.qloo || {};

  return (
    <div className="mt-6 space-y-8 animate-fade-in">
      {/* Enhanced Header Section */}
      <div className="text-center pb-8 border-b border-border/30">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-8 mb-6">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="relative">
            <div className="flex items-center justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-background border-2 border-primary/20 rounded-full p-4">
                  <Globe className="h-12 w-12 text-primary" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Your AI-Curated Travel Destinations
            </h1>
            <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
              Optimized for content creation, audience engagement, and monetization opportunities based on your unique profile
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Personalized Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Real-time Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>Creator Optimized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {recommendations.length}
            </div>
            <div className="text-sm text-muted-foreground">Destinations</div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {recommendations.reduce((sum, rec) => sum + rec.creators, 0)}+
            </div>
            <div className="text-sm text-muted-foreground">Active Creators</div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {recommendations.reduce(
                (sum, rec) => sum + rec.collaborations.length,
                0
              )}
            </div>
            <div className="text-sm text-muted-foreground">Brand Partners</div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(recommendations.reduce((sum, rec) => sum + rec.engagement.avgLikes, 0) / recommendations.length / 1000)}K
            </div>
            <div className="text-sm text-muted-foreground">Avg Engagement</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter and Sort Controls */}
      <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Filter Options</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "budget", "luxury", "adventure"].map((filter) => (
                <Button
                  key={filter}
                  variant={filterBy === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBy(filter as typeof filterBy)}
                  className="capitalize transition-all duration-200 hover:scale-105"
                >
                  {filter === "all" ? "All Destinations" : filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Layers className="h-4 w-4 text-blue-500" />
              </div>
              <span className="font-semibold text-foreground">Sort By</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "match", label: "Best Match" },
                { key: "budget", label: "Budget" },
                { key: "engagement", label: "Engagement" }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={sortBy === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(key as typeof sortBy)}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-Enhanced Recommendations Grid */}
      <div className="space-y-10">
        {filteredRecommendations.map((rec, index) => (
          <Card
            key={rec.id}
            className={`group overflow-hidden hover:shadow-2xl transition-all duration-700 border border-border/50 hover:border-primary/30 transform hover:-translate-y-2 hover:scale-[1.02] animate-fade-in ${
              selectedDestination === rec.id ? "ring-2 ring-primary/50 shadow-xl scale-[1.01]" : ""
            }`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Ultra-Enhanced Image Section */}
              <div className="relative lg:col-span-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                <Image
                  src={rec.image}
                  alt={rec.destination}
                  width={400}
                  height={300}
                  className="w-full h-64 lg:h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                />

                {/* Enhanced Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20">
                  <div className="flex items-center space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <Button
                      size="sm"
                      className={`backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110 ${
                        bookmarkedItems.has(rec.id)
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      onClick={() => handleBookmark(rec.id)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="backdrop-blur-md bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
                      onClick={() => handleShare(rec.destination)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="backdrop-blur-md bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
                      onClick={() =>
                        setSelectedDestination(
                          selectedDestination === rec.id ? null : rec.id
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Ultra-Enhanced Badges */}
                <div className="absolute top-4 right-4 space-y-2 z-30">
                  <div className="relative">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm px-4 py-2 shadow-xl border-2 border-white/20 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {rec.matchScore}% Match
                    </Badge>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-full blur opacity-50" />
                  </div>
                  {rec.visaRequired && (
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm text-xs border-white/30 text-gray-700"
                    >
                      Visa Required
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 space-y-2 z-30">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm font-semibold">
                      {rec.safetyRating}/5
                    </span>
                    <span className="text-white/70 text-xs">Safety</span>
                  </div>
                </div>

                {/* Enhanced Tags */}
                <div className="absolute bottom-4 right-4 z-30">
                  <div className="flex flex-wrap gap-2">
                    {rec.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={rec.id + '-' + tag}
                        className="text-xs bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-colors duration-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Content Section */}
              <div className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="flex items-center text-2xl mb-1">
                      <MapPin className="h-6 w-6 text-primary mr-2" />
                      {rec.destination}, {rec.country}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {rec.travelTime}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Best: {rec.bestMonths.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column - Enhanced */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 text-primary mr-2" />
                        Key Highlights
                      </h5>
                      <ul className="space-y-2">
                    {rec.highlights.map((highlight) => (
                      <li
                        key={rec.id + '-' + highlight}
                        className="text-sm text-muted-foreground flex items-start"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        {highlight}
                      </li>
                    ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <DollarSign className="h-4 w-4 text-primary mr-2" />
                        Budget Estimate
                      </h5>
                      <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border">
                        <p className="text-xl font-bold text-foreground">
                          {rec.budget.range}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {rec.budget.breakdown}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center">
                            <Plane className="h-3 w-3 mr-1" />
                            Flights: 40%
                          </div>
                          <div className="flex items-center">
                            <Hotel className="h-3 w-3 mr-1" />
                            Hotels: 35%
                          </div>
                          <div className="flex items-center">
                            <Utensils className="h-3 w-3 mr-1" />
                            Food: 25%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Enhanced */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <Heart className="h-4 w-4 text-primary mr-2" />
                        Engagement Potential
                      </h5>
                      <div className="space-y-3">
                        <Badge
                          variant={
                            rec.engagement.potential === "Very High"
                              ? "default"
                              : "secondary"
                          }
                          className="text-sm px-3 py-1"
                        >
                          {rec.engagement.potential}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {rec.engagement.reason}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="font-medium">
                              {rec.engagement.avgLikes.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              avg likes
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="font-medium">
                              {rec.engagement.avgComments}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              avg comments
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <Users className="h-4 w-4 text-primary mr-2" />
                        Creator Community
                      </h5>
                      <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border">
                        <p className="text-xl font-bold text-foreground">
                          {rec.creators}+
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Active creators in this destination
                        </p>
                        <div className="mt-2 flex -space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center"
                            >
                              <Camera className="h-3 w-3 text-primary-foreground" />
                            </div>
                          ))}
                          <div className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Brand Collaborations */}
                <div className="border-t border-border pt-6">
                  <h5 className="font-semibold text-foreground mb-4 flex items-center">
                    <Briefcase className="h-4 w-4 text-primary mr-2" />
                    Top Brand Collaboration Opportunities
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rec.collaborations.map((collab) => (
                      <Card
                        key={rec.id + '-' + collab.name + '-' + collab.type}
                        className="p-4 hover:shadow-md transition-all duration-300 border hover:border-primary/50"
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-primary" />
                          </div>
                          <h6 className="font-medium text-foreground mb-1">
                            {collab.name}
                          </h6>
                          <p className="text-xs text-muted-foreground mb-2">
                            {collab.type}
                          </p>
                          <Badge variant="outline" className="text-xs mb-2">
                            {collab.commission} commission
                          </Badge>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs p-0 h-auto"
                          >
                            View Details{" "}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedDestination === rec.id && (
                  <div className="mt-6 p-4 bg-muted/20 rounded-lg border-l-4 border-l-primary">
                    <h6 className="font-semibold mb-3">Additional Details</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Safety Rating:
                        </span>
                        <div className="font-medium">
                          {rec.safetyRating}/5.0
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Visa Required:
                        </span>
                        <div className="font-medium">
                          {rec.visaRequired ? "Yes" : "No"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Travel Time:
                        </span>
                        <div className="font-medium">{rec.travelTime}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Currency:</span>
                        <div className="font-medium">{rec.budget.currency}</div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
