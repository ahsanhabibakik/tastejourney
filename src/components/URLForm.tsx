"use client";

import React, { useState, useEffect } from "react";
import { Globe, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface URLFormProps {
  onSubmit: (url: string) => void;
}

const URLForm: React.FC<URLFormProps> = ({ onSubmit }) => {
  const [url, setUrl] = useState("");
  const [fixedUrl, setFixedUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [urlStatus, setUrlStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // URL auto-fixing function
  const fixURL = (inputUrl: string): string => {
    let fixed = inputUrl.trim();
    
    // Return empty if no input
    if (!fixed) return '';
    
    // Remove any protocol first to standardize
    fixed = fixed.replace(/^https?:\/\//, '');
    
    // Remove www. prefix for consistency
    fixed = fixed.replace(/^www\./, '');
    
    // Remove trailing slash
    fixed = fixed.replace(/\/$/, '');
    
    // Add https:// prefix
    return `https://${fixed}`;
  };

  // Validate URL format
  const validateURL = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Handle URL input changes
  useEffect(() => {
    if (url.trim()) {
      const fixed = fixURL(url);
      setFixedUrl(fixed);
      
      // Validate the fixed URL
      if (validateURL(fixed)) {
        setUrlStatus('valid');
      } else {
        setUrlStatus('invalid');
      }
    } else {
      setFixedUrl('');
      setUrlStatus('idle');
    }
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || urlStatus !== 'valid') return;

    setIsValidating(true);

    // Simulate URL validation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsValidating(false);
    // Use the fixed URL for submission
    onSubmit(fixedUrl);
  };

  return (
    <div className="mt-4 p-4 bg-card rounded-lg border border-border animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="website-url"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Your Website URL
          </label>
          <div className="space-y-2">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (e.g., example.com, https://example.com)"
                className={`pl-10 pr-10 transition-all duration-200 ${
                  urlStatus === 'valid' 
                    ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' 
                    : urlStatus === 'invalid' 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'focus:border-primary/50 focus:ring-primary/20'
                }`}
                required
              />
              
              {/* Status Icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {urlStatus === 'valid' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {urlStatus === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            {/* URL Preview */}
            {fixedUrl && urlStatus === 'valid' && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2 animate-slide-up">
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    URL will be analyzed as:
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded break-all">
                  {fixedUrl}
                </div>
              </div>
            )}

            {/* Error Message */}
            {url.trim() && urlStatus === 'invalid' && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2 animate-slide-up">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-300">
                    Please enter a valid website URL
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!url.trim() || urlStatus !== 'valid' || isValidating}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
              <span>Analyzing Website...</span>
            </>
          ) : (
            <>
              <span>Analyze My Website</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        <div className="text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-primary">💡</span>
            <span>I'll analyze your content themes, audience insights, and posting patterns to create personalized travel recommendations.</span>
          </p>
        </div>
        
        {/* URL Format Examples */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          <p className="font-medium mb-1">Supported formats:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <code className="text-[10px] bg-background/50 px-1 py-0.5 rounded">example.com</code>
            <code className="text-[10px] bg-background/50 px-1 py-0.5 rounded">https://example.com</code>
            <code className="text-[10px] bg-background/50 px-1 py-0.5 rounded">www.site.com</code>
            <code className="text-[10px] bg-background/50 px-1 py-0.5 rounded">http://blog.io</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLForm;
