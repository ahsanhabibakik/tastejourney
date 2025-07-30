"use client";

import React from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Recommendation {
  id: number;
  destination: string;
  matchScore: number;
  image: string;
  highlights: string[];
  budget: {
    range: string;
    breakdown: string;
  };
  engagement: {
    potential: string;
    reason: string;
  };
  collaborations: string[];
  creators: number;
  bestMonths: string[];
}

const RecommendationsScreen: React.FC = () => {
  const recommendations: Recommendation[] = [
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
    },
  ];

  const handleActionClick = (action: string) => {
    // This is where you would integrate with your API
    console.log(`Action clicked: ${action}`);
    // Example API call structure:
    // await fetch('/api/recommendations', {
    //   method: 'POST',
    //   body: JSON.stringify({ action, userPreferences })
    // })
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Header Section */}
      <div className="text-center pb-6 border-b border-border">
        <div className="flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-primary mr-3" />
          <h3 className="text-2xl font-bold text-foreground">
            Your Personalized Travel Recommendations
          </h3>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Optimized for content creation, audience engagement, and monetization
          opportunities based on your website analysis
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="space-y-8">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Image Section */}
              <div className="relative lg:col-span-1">
                <Image
                  src={rec.image}
                  alt={rec.destination}
                  width={400}
                  height={300}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1">
                    {rec.matchScore}% Match
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm font-medium">
                      {rec.matchScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center text-xl">
                    <MapPin className="h-6 w-6 text-primary mr-2" />
                    {rec.destination}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Best: {rec.bestMonths.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 text-primary mr-2" />
                        Key Highlights
                      </h5>
                      <ul className="space-y-2">
                        {rec.highlights.map((highlight, index) => (
                          <li
                            key={index}
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
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-lg font-bold text-foreground">
                          {rec.budget.range}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rec.budget.breakdown}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <Heart className="h-4 w-4 text-primary mr-2" />
                        Engagement Potential
                      </h5>
                      <div className="space-y-2">
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
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center">
                        <Users className="h-4 w-4 text-primary mr-2" />
                        Creator Community
                      </h5>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-lg font-bold text-foreground">
                          {rec.creators}+
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Active creators in this destination
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Collaborations */}
                <div className="border-t border-border pt-4">
                  <h5 className="font-semibold text-foreground mb-4 flex items-center">
                    <Briefcase className="h-4 w-4 text-primary mr-2" />
                    Top Brand Collaboration Opportunities
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {rec.collaborations.map((brand, index) => (
                      <div
                        key={index}
                        className="bg-card border border-border rounded-lg p-3 text-center hover:shadow-md transition-shadow"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {brand}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs p-0 h-auto"
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Email Report Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h4 className="text-xl font-bold text-primary mb-3">
              📧 Detailed Report Coming Your Way!
            </h4>
            <p className="text-muted-foreground mb-6">
              A comprehensive PDF report with detailed cost breakdowns,
              collaboration contacts, and content creation guides will be sent
              to your email within the next few minutes.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Cost Analysis
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Brand Contacts
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Content Guides
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <Card>
        <CardContent className="p-8">
          <h4 className="text-xl font-bold text-foreground mb-6 text-center">
            What would you like to explore next?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => handleActionClick("more-destinations")}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h5 className="font-semibold text-foreground mb-2">
                  Get More Destinations
                </h5>
                <p className="text-sm text-muted-foreground">
                  Explore additional travel recommendations based on different
                  criteria or seasons
                </p>
              </div>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => handleActionClick("budget-planning")}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h5 className="font-semibold text-foreground mb-2">
                  Budget Planning
                </h5>
                <p className="text-sm text-muted-foreground">
                  Get detailed cost breakdowns and budget optimization tips for
                  your chosen destination
                </p>
              </div>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => handleActionClick("brand-collaborations")}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h5 className="font-semibold text-foreground mb-2">
                  Brand Collaborations
                </h5>
                <p className="text-sm text-muted-foreground">
                  Learn more about specific brand partnership opportunities and
                  how to approach them
                </p>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsScreen;
