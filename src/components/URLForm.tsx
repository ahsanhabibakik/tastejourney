"use client";

import React, { useState } from "react";
import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface URLFormProps {
  onSubmit: (url: string) => void;
}

const URLForm: React.FC<URLFormProps> = ({ onSubmit }) => {
  const [url, setUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsValidating(true);

    // Simulate URL validation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsValidating(false);
    onSubmit(url);
  };

  return (
    <div className="mt-4 p-4 bg-card rounded-lg border border-border">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="website-url"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Your Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="website-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-website.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!url.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
              <span>Validating...</span>
            </>
          ) : (
            <>
              <span>Analyze My Website</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>
          💡 I&apos;ll analyze your content themes, audience insights, and
          posting patterns to create personalized travel recommendations.
        </p>
      </div>
    </div>
  );
};

export default URLForm;
