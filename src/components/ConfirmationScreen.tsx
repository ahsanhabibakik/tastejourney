"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Globe,
  Users,
  TrendingUp,
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
    <Card className="w-full max-w-md mx-auto mt-4 p-4 sm:p-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Globe className="h-5 w-5 text-primary" />
          <span>Website Analysis Results</span>
        </CardTitle>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Please confirm if this information accurately represents your content and audience:
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-5">
          <section>
            <h4 className="font-medium text-sm sm:text-base mb-2">Website Details</h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm sm:text-base font-medium truncate">{data.title}</p>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-3">
                {data.description}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-primary truncate break-all">
                {data.url}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="flex items-center font-medium text-sm sm:text-base mb-2">
                <TrendingUp className="h-4 w-4 text-primary mr-1" />
                Content Themes
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto">
                {data.themes.map((theme, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm sm:text-base mb-2">Content Type</h4>
              <Badge variant="default" className="text-xs sm:text-sm">
                {data.contentType}
              </Badge>
            </div>
          </div>

          {data.socialLinks.length > 0 && (
            <section>
              <h4 className="flex items-center font-medium text-sm sm:text-base mb-2">
                <Users className="h-4 w-4 text-primary mr-1" />
                Social Media Presence
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto">
                {data.socialLinks.map((link, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs sm:text-sm">
                    {link.platform}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {data.hints.length > 0 && (
            <section>
              <h4 className="font-medium text-sm sm:text-base mb-2">Creator Profile</h4>
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto">
                {data.hints.map((hint, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                    {hint.replace("-", " ")}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <Button
            onClick={() => onConfirm(true)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm sm:text-base">Yes, this looks accurate</span>
          </Button>
          <Button
            onClick={() => onConfirm(false)}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            <XCircle className="h-5 w-5" />
            <span className="text-sm sm:text-base">Needs corrections</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationScreen;
