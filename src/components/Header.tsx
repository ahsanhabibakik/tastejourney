"use client";

import React from "react";
import { MapPin, User, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MapPin className="h-7 w-7 text-primary" />
            <Sparkles className="h-3 w-3 text-primary/60 absolute -top-1 -right-1" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground">
              TasteJourney
            </span>
            <div className="text-xs text-muted-foreground">
              AI Travel Companion
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Home
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Destinations
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Collaborations
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Analytics
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
