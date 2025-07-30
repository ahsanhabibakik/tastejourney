"use client";

import React from "react";
import { MapPin, User, Bell, Sparkles, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <header className="glass sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-background p-2 rounded-lg">
              <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TasteJourney
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              AI Travel Companion
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TasteJourney
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {["Home", "Destinations", "Collaborations", "Analytics"].map(
            (item) => (
              <Button
                key={item}
                variant="ghost"
                className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                {item}
              </Button>
            )
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/5 rounded-full transition-all duration-200 group"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-accent to-warning rounded-full flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </Button>

          {/* User Avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-0 hover:scale-105 transition-transform duration-200"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-soft">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
          </Button>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-primary/5 rounded-lg"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
