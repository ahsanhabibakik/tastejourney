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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RecommendationsScreen: React.FC = () => {
  const recommendations = [
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

  return (
    <div className="mt-6 space-y-6">
      <div className="text-center pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Your Personalized Travel Recommendations
        </h3>
        <p className="text-sm text-muted-foreground">
          Optimized for content creation, audience engagement, and monetization
          opportunities
        </p>
      </div>

      {recommendations.map((rec) => (
        <Card
          key={rec.id}
          className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative">
            <Image
              src={rec.image}
              alt={rec.destination}
              width={400}
              height={200}
              className="w-full h-48 object-cover"
            />
            <Badge className="absolute top-4 right-4">
              {rec.matchScore}% Match
            </Badge>
          </div>

          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                {rec.destination}
              </CardTitle>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-foreground">
                  {rec.matchScore}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-foreground mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 text-primary mr-2" />
                    Key Highlights
                  </h5>
                  <ul className="space-y-1">
                    {rec.highlights.map((highlight, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start"
                      >
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 text-primary mr-2" />
                    Budget Estimate
                  </h5>
                  <p className="text-sm font-medium text-foreground">
                    {rec.budget.range}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rec.budget.breakdown}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-foreground mb-2 flex items-center">
                    <Heart className="h-4 w-4 text-primary mr-2" />
                    Engagement Potential
                  </h5>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge
                      variant={
                        rec.engagement.potential === "Very High"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {rec.engagement.potential}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rec.engagement.reason}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2 flex items-center">
                    <Users className="h-4 w-4 text-primary mr-2" />
                    Creator Community
                  </h5>
                  <p className="text-sm text-foreground">
                    {rec.creators}+ active creators
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best months: {rec.bestMonths.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center">
                <Briefcase className="h-4 w-4 text-primary mr-2" />
                Top Brand Collaboration Opportunities
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rec.collaborations.map((brand, index) => (
                  <Card key={index} className="p-3 text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {brand}
                    </p>
                    <Button variant="link" size="sm" className="mt-2 text-xs">
                      Explore Collaboration
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h4 className="font-semibold text-primary mb-2">
            📧 Detailed Report Coming Your Way!
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            A comprehensive PDF report with detailed cost breakdowns,
            collaboration contacts, and content creation guides will be sent to
            your email within the next few minutes.
          </p>
          <p className="text-xs text-muted-foreground">
            Click on any suggestion above or continue chatting to ask questions
            about these recommendations!
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h4 className="font-semibold text-foreground mb-4 text-center">
            What would you like to do next?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start text-left"
            >
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Get More Destinations</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore additional travel recommendations based on different
                criteria or seasons
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start text-left"
            >
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Budget Planning</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get detailed cost breakdowns and budget optimization tips for
                your chosen destination
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start text-left"
            >
              <div className="flex items-center mb-2">
                <Briefcase className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Brand Collaborations</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn more about specific brand partnership opportunities and
                how to approach them
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsScreen;
