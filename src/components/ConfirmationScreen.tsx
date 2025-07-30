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
    contentThemes: string[];
    audienceInterests: string[];
    postingFrequency: string;
    topPerformingContent: string;
    audienceLocation: string;
    preferredDestinations: string[];
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 text-primary mr-2" />
                Content Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.contentThemes.map((theme, index) => (
                  <Badge key={index} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <Users className="h-4 w-4 text-primary mr-2" />
                Audience Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.audienceInterests.map((interest, index) => (
                  <Badge key={index} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">
                Posting Frequency
              </h4>
              <p className="text-sm text-muted-foreground">
                {data.postingFrequency}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Top Performing Content
              </h4>
              <p className="text-sm text-muted-foreground">
                {data.topPerformingContent}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">
                Audience Location
              </h4>
              <p className="text-sm text-muted-foreground">
                {data.audienceLocation}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <MapPin className="h-4 w-4 text-primary mr-2" />
                Preferred Destinations
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.preferredDestinations.map((dest, index) => (
                  <Badge key={index} variant="default">
                    {dest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-6 border-t border-border mt-6">
          <Button onClick={() => onConfirm(true)} className="flex-1">
            <CheckCircle className="h-4 w-4" />
            <span>Yes, this looks accurate</span>
          </Button>
          <Button
            onClick={() => onConfirm(false)}
            variant="outline"
            className="flex-1"
          >
            <XCircle className="h-4 w-4" />
            <span>Needs corrections</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationScreen;
