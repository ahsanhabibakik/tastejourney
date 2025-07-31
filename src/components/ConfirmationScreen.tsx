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
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          <span>Website Analysis</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please confirm if this information is accurate:
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Website Details */}
          <section>
            <h4 className="font-medium text-sm mb-2">Website Details</h4>
            <div className="bg-muted rounded-lg p-3">
              <h5 className="font-semibold mb-1">{data.title}</h5>
              <p className="text-sm text-muted-foreground mb-2">
                {data.description}
              </p>
              <p className="text-xs text-primary">
                {data.url}
              </p>
            </div>
          </section>

          {/* Content Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="flex items-center font-medium text-sm mb-2">
                <TrendingUp className="h-4 w-4 text-primary mr-1" />
                Content Themes
              </h4>
              <div className="flex flex-wrap gap-1">
                {data.themes.length > 0 ? (
                  data.themes.map((theme, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No themes detected</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Content Type</h4>
              <Badge variant="default">
                {data.contentType}
              </Badge>
            </div>

            {data.socialLinks && data.socialLinks.length > 0 && (
              <div>
                <h4 className="flex items-center font-medium text-sm mb-2">
                  <Users className="h-4 w-4 text-primary mr-1" />
                  Social Media
                </h4>
                <div className="flex flex-wrap gap-1">
                  {data.socialLinks.map((link, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {link.platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.hints && data.hints.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Creator Profile</h4>
                <div className="flex flex-wrap gap-1">
                  {data.hints.map((hint, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {hint.replace(/[-_]/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Additional Info */}
          {(data.location || (data.images?.length || 0) > 0 || data.fallbackUsed) && (
            <div className="space-y-2">
              {data.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Location: {data.location}</span>
                </div>
              )}
              
              {((data.images?.length || 0) > 0 || (data.videoLinks?.length || 0) > 0) && (
                <div className="text-sm text-muted-foreground">
                  Media found: 
                  {data.images && data.images.length > 0 && ` ${data.images.length} images`}
                  {data.videoLinks && data.videoLinks.length > 0 && ` ${data.videoLinks.length} videos`}
                </div>
              )}

              {data.fallbackUsed && (
                <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg p-3 text-sm">
                  ⚠️ Limited analysis due to website access restrictions
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t space-y-2">
          <Button
            onClick={() => onConfirm(true)}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Yes, this looks accurate
          </Button>
          <Button
            onClick={() => onConfirm(false)}
            variant="outline"
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Needs corrections
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationScreen;
