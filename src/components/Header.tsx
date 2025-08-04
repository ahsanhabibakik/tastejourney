"use client";

import React from "react";
import { MapPin, User, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuClick }) => {
  return (
    <header className="bg-background/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40 px-4 lg:px-6 py-2.5 lg:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              TasteJourney
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block leading-none">
              AI Travel Companion
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {["Home", "Destinations", "Collaborate", "About"].map(
            (item) => (
              <Button
                key={item}
                variant="ghost"
                className="text-[13px] font-medium h-8 px-3 hover:bg-primary/10"
              >
                {item}
              </Button>
            )
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 p-0"
          >
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </Button>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
