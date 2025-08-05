"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";

export default function Home() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-background/95">
      <Header onMobileMenuClick={() => setShowMobileSidebar(!showMobileSidebar)} />
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
        />
      </div>
    </div>
  );
}
