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
    extractedKeywords?: string[];
  };
  onConfirm: (confirmed: boolean) => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  data,
  onConfirm,
}) => {
  return (
    <Card className="mt-4">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>Website Analysis Results</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please confirm if this information accurately represents your content
          and audience:
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Website Details
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{data.title}</p>
              <p className="text-xs text-muted-foreground">
                {data.description}
              </p>
              <p className="text-xs text-primary">{data.url}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 text-primary mr-2" />
                Content Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.themes?.map((theme, index) => (
                  <Badge key={index} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Content Type</h4>
              <Badge variant="default" className="text-sm">
                {data.contentType}
              </Badge>
            </div>
          </div>

          {data.socialLinks && data.socialLinks.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <Users className="h-4 w-4 text-primary mr-2" />
                Social Media Presence
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.socialLinks.map((link, index) => (
                  <Badge key={index} variant="outline">
                    {link.platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.hints && data.hints.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Creator Profile
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.hints.map((hint, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {hint.replace("-", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-6 border-t border-border mt-6">
          <Button onClick={() => onConfirm(true)} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Yes, this looks accurate
          </Button>
          <Button
            onClick={() => onConfirm(false)}
            variant="outline"
            className="flex-1"
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
