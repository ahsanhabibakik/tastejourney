"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Globe,
  Users,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConfirmationScreenProps {
  data: {
    url: string;
    title: string;
    description: string;
    themes: string[];
    hints: string[];
    contentType: string;
    socialLinks: { platform: string; url: string }[];
    keywords?: string[];
    images?: string[];
    videoLinks?: string[];
    language?: string;
    location?: string;
    brands?: string[];
    collaborations?: string[];
    regionBias?: string[];
    extractedAt?: string;
    scrapingMethods?: string[];
    fallbackUsed?: boolean;
  };
  onConfirm: (confirmed: boolean) => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  data,
  onConfirm,
}) => {
  return (
    <Card className="w-full max-w-4xl mx-auto mt-4 sm:mt-6 shadow-lg border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl lg:text-2xl">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="font-bold">Website Analysis Results</span>
        </CardTitle>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Please confirm if this information accurately represents your content and audience:
        </p>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-6">
        <div className="space-y-6 sm:space-y-8">
          {/* Website Details Section */}
          <section>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">🌐 Website Details</h4>
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4 sm:p-6 border border-border/30">
              <h5 className="text-base sm:text-lg font-bold text-foreground mb-2 break-words">{data.title}</h5>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {data.description}
              </p>
              <p className="text-xs sm:text-sm text-primary font-medium break-all bg-primary/10 px-2 py-1 rounded-md inline-block">
                {data.url}
              </p>
            </div>
          </section>

          {/* Content Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="flex items-center font-semibold text-base sm:text-lg mb-3">
                  <TrendingUp className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  Content Themes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.themes.length > 0 ? (
                    data.themes.map((theme, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                        {theme}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No themes detected</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base sm:text-lg mb-3">📝 Content Type</h4>
                <Badge variant="default" className="text-sm sm:text-base px-4 py-2">
                  {data.contentType}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {data.socialLinks && data.socialLinks.length > 0 && (
                <div>
                  <h4 className="flex items-center font-semibold text-base sm:text-lg mb-3">
                    <Users className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    Social Presence ({data.socialLinks.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {data.socialLinks.map((link, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm justify-center py-2">
                        {link.platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.hints && data.hints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-3">👤 Creator Profile</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.hints.map((hint, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                        {hint.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Extended Details Grid */}
          {(data.location || data.language || data.keywords?.length || data.brands?.length || data.regionBias?.length || 
            (data.images?.length || 0) > 0 || (data.videoLinks?.length || 0) > 0) && (
            <section>
              <h4 className="font-semibold text-base sm:text-lg mb-4">📊 Extended Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Location & Language */}
                {(data.location || (data.language && data.language !== "en")) && (
                  <div className="space-y-3">
                    {data.location && (
                      <div>
                        <h5 className="flex items-center font-medium text-sm mb-2">
                          <MapPin className="h-4 w-4 text-primary mr-2" />
                          Location
                        </h5>
                        <Badge variant="outline" className="text-sm">
                          {data.location.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    )}
                    {data.language && data.language !== "en" && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">🌐 Language</h5>
                        <Badge variant="outline" className="text-sm">{data.language.toUpperCase()}</Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Keywords */}
                {data.keywords && data.keywords.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">🔤 Keywords ({data.keywords.length})</h5>
                    <div className="flex flex-wrap gap-1">
                      {data.keywords.slice(0, 6).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {data.keywords.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{data.keywords.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Brands & Regions */}
                {(data.brands?.length || data.regionBias?.length) && (
                  <div className="space-y-3">
                    {data.brands && data.brands.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">🏷️ Brand Mentions</h5>
                        <div className="flex flex-wrap gap-1">
                          {data.brands.slice(0, 3).map((brand, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {brand.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          ))}
                          {data.brands.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{data.brands.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {data.regionBias && data.regionBias.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">🗺️ Regional Interest</h5>
                        <div className="flex flex-wrap gap-1">
                          {data.regionBias.slice(0, 2).map((region, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {region.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          ))}
                          {data.regionBias.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{data.regionBias.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Content */}
                {((data.images?.length || 0) > 0 || (data.videoLinks?.length || 0) > 0) && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <h5 className="font-medium text-sm mb-2">🎬 Media Content</h5>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {data.images && data.images.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          📸 {data.images.length} images
                        </Badge>
                      )}
                      {data.videoLinks && data.videoLinks.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          🎥 {data.videoLinks.length} videos
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Analysis Metadata */}
          <div className="space-y-3">
            {data.fallbackUsed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-1">Limited Analysis</p>
                    <p className="text-xs text-amber-700">
                      This analysis uses fallback data due to website access limitations. 
                      The actual content may be more detailed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.extractedAt && (
              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                📅 Analyzed: {new Date(data.extractedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={() => onConfirm(true)}
              className="w-full h-12 sm:h-14 flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>✅ Yes, this looks accurate</span>
            </Button>
            <Button
              onClick={() => onConfirm(false)}
              variant="outline"
              className="w-full h-12 sm:h-14 flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-200"
            >
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>🔄 Needs corrections</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationScreen;
