"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInterfaceEnhanced from "@/components/ChatInterface-enhanced";

export default function EnhancedPage() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-background/90 backdrop-blur-sm border-border/40 shadow-sm"
          onClick={() => setShowMobileSidebar(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Enhanced Chat Interface */}
      <ChatInterfaceEnhanced 
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />
      
      {/* Enhanced Feature Badge */}
      <div className="fixed top-4 right-4 z-40 hidden lg:block">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          ✨ Enhanced Version
        </div>
      </div>
    </div>
  );
}
