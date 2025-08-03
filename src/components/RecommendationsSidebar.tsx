"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  Users,
  ChevronRight,
  Bookmark,
  Share2,
  ExternalLink,
  Heart,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

interface RecommendationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Recommendation[];
  onDestinationSelect?: (destination: Recommendation) => void;
}

const RecommendationsSidebar: React.FC<RecommendationsSidebarProps> = ({
  isOpen,
  onClose,
  recommendations,
  onDestinationSelect,
}) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<number>>(new Set());

  const handleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBookmarks = new Set(bookmarkedItems);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
    } else {
      newBookmarks.add(id);
    }
    setBookmarkedItems(newBookmarks);
  };

  const handleShare = async (destination: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      navigator.clipboard.writeText(`${destination} - ${window.location.href}`);
      // You could add a toast notification here
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed top-0 right-0 bottom-0 left-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 lg:w-80 xl:w-96 
        bg-background border-l border-border/50 shadow-2xl z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">
                Your Destinations
              </h2>
              <p className="text-sm text-muted-foreground">
                {recommendations.length} recommendations
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className={`
                group cursor-pointer hover:shadow-lg transition-all duration-300 
                border-border/50 hover:border-primary/30 overflow-hidden
                ${expandedCard === rec.id ? 'ring-2 ring-primary/20' : ''}
              `}
              onClick={() => setExpandedCard(expandedCard === rec.id ? null : rec.id)}
            >
              <div className="relative">
                {/* Image */}
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={rec.image}
                    alt={rec.destination}
                    width={400}
                    height={128}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                      onClick={(e) => handleBookmark(rec.id, e)}
                    >
                      <Bookmark 
                        className={`h-3 w-3 ${bookmarkedItems.has(rec.id) ? 'fill-current text-primary' : 'text-white'}`} 
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                      onClick={(e) => handleShare(rec.destination, e)}
                    >
                      <Share2 className="h-3 w-3 text-white" />
                    </Button>
                  </div>

                  {/* Match Score Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 font-semibold">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {rec.matchScore}%
                    </Badge>
                  </div>

                  {/* Destination Name */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-bold text-sm truncate">
                      {rec.destination}, {rec.country}
                    </h3>
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span>{rec.safetyRating}/5</span>
                      <span>•</span>
                      <span>{rec.travelTime}</span>
                    </div>
                  </div>
                </div>

                {/* Compact Info */}
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-foreground">
                        {rec.budget.range}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {expandedCard === rec.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs px-2 py-0.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Engagement Preview */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>{(rec.engagement.avgLikes / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span>{rec.creators}+ creators</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{rec.engagement.potential}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedCard === rec.id && (
                    <div className="mt-4 pt-3 border-t border-border/50 space-y-3 animate-slide-up">
                      {/* Highlights */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-2">Highlights</h4>
                        <ul className="space-y-1">
                          {rec.highlights.slice(0, 2).map((highlight, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start">
                              <div className="w-1 h-1 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Best Months */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-2">Best Time</h4>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            {rec.bestMonths.join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Top Collaboration */}
                      {rec.collaborations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-2">Top Opportunity</h4>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  {rec.collaborations[0].name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {rec.collaborations[0].type}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {rec.collaborations[0].commission}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDestinationSelect?.(rec);
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to comparison or similar action
                          }}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <Button 
            className="w-full"
            onClick={() => {
              // Scroll to recommendations or take some action
              onClose();
            }}
          >
            <MapPin className="h-4 w-4 mr-2" />
            View All Recommendations
          </Button>
        </div>
      </div>
    </>
  );
};

export default RecommendationsSidebar;