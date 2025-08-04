"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";

export default function Home() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileMenuClick={() => setShowMobileSidebar(!showMobileSidebar)} />
      <ChatInterface 
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />
    </div>
  );
}
