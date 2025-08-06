"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Edit2, RefreshCw } from 'lucide-react';

interface RefineButtonProps {
  onClick: () => void;
  isRefining?: boolean;
  className?: string;
}

export const RefineButton: React.FC<RefineButtonProps> = ({
  onClick,
  isRefining = false,
  className = ""
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <Button
        onClick={onClick}
        variant="outline"
        className="bg-gradient-to-r from-background to-muted/50 hover:from-muted/30 hover:to-muted/70 border-primary/20 hover:border-primary/40 transition-all duration-300"
        disabled={isRefining}
      >
        {isRefining ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Re-calculating...
          </>
        ) : (
          <>
            <Settings className="w-4 h-4 mr-2" />
            Refine Your Preferences
          </>
        )}
      </Button>
    </div>
  );
};