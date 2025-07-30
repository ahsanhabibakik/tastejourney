"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TypingIndicator from "./TypingIndicator";
import URLForm from "./URLForm";
import ConfirmationScreen from "./ConfirmationScreen";
import RecommendationsScreen from "./RecommendationsScreen";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  component?: "url-form" | "confirmation" | "recommendations";
}

type ChatState =
  | "initial"
  | "url-submitted"
  | "data-confirmed"
  | "recommendations-shown";

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI travel companion. I'll analyze your website and recommend perfect travel destinations for content creation. Let's start by getting your website URL.",
      isBot: true,
      timestamp: new Date(),
      component: "url-form",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("initial");
  const [websiteData, setWebsiteData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (
    text: string,
    isBot: boolean,
    component?: "url-form" | "confirmation" | "recommendations"
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      component,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = async (callback: () => void, delay: number = 1500) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, delay));
    setIsTyping(false);
    callback();
  };

  const handleURLSubmit = async (url: string) => {
    addMessage(url, false);
    setChatState("url-submitted");

    await simulateTyping(() => {
      addMessage(
        "Perfect! I'm analyzing your website now. This may take a moment while I extract key information about your content, audience, and preferences...",
        true
      );
    });

    try {
      await simulateTyping(() => {
        const mockData = {
          url,
          contentThemes: [
            "Travel Photography",
            "Food & Culture",
            "Adventure Sports",
          ],
          audienceInterests: [
            "Photography",
            "Food",
            "Adventure Travel",
            "Cultural Experiences",
          ],
          postingFrequency: "3-4 posts per week",
          topPerformingContent: "Video content (65% engagement)",
          audienceLocation: "North America (45%), Europe (30%), Asia (25%)",
          preferredDestinations: [
            "Mountain regions",
            "Coastal areas",
            "Urban destinations",
          ],
        };
        setWebsiteData(mockData);
        addMessage(
          "Great! I've extracted key information from your website. Please confirm if this looks accurate:",
          true,
          "confirmation"
        );
      }, 2500);
    } catch (error) {
      console.error("Error analyzing website:", error);
      addMessage(
        "I encountered an issue analyzing your website. Please try again or contact support.",
        true
      );
    }
  };

  const handleDataConfirmation = async (confirmed: boolean) => {
    if (confirmed) {
      addMessage("Yes, this information is accurate.", false);
      setChatState("data-confirmed");

      await simulateTyping(() => {
        addMessage(
          "Excellent! Now I'm generating personalized travel recommendations based on your content style, audience preferences, and monetization opportunities. This involves analyzing taste vectors, brand collaboration potential, and creator communities at each destination...",
          true
        );
      });

      await simulateTyping(() => {
        addMessage(
          "Here are your top travel destination recommendations optimized for content creation and monetization:",
          true,
          "recommendations"
        );
      }, 3000);
    } else {
      addMessage("The information needs corrections.", false);
      await simulateTyping(() => {
        addMessage(
          "No problem! Could you please share what needs to be corrected? I'll adjust my analysis accordingly.",
          true
        );
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage(userMessage, false);

    await simulateTyping(() => {
      if (userMessage.toLowerCase().includes("budget")) {
        addMessage(
          "I can help you with budget planning! Each recommendation includes detailed cost breakdowns for flights, accommodation, and daily expenses. Would you like me to adjust the recommendations based on a specific budget range?",
          true
        );
      } else if (userMessage.toLowerCase().includes("collaboration")) {
        addMessage(
          "Great question about collaborations! I've identified local creators and brands in each destination. For example, in Bali, there are 150+ active travel creators and 20+ brands looking for partnerships. Would you like more details about specific collaboration opportunities?",
          true
        );
      } else if (
        userMessage.toLowerCase().includes("more") ||
        userMessage.toLowerCase().includes("additional")
      ) {
        addMessage(
          "I'd be happy to provide more recommendations! Based on your profile, I can suggest alternative destinations, seasonal opportunities, or niche markets. What specific aspect would you like me to explore further?",
          true
        );
      } else {
        addMessage(
          "That's a great point! Based on your website analysis and travel preferences, I can provide more specific guidance. Feel free to ask about budget planning, collaboration opportunities, seasonal considerations, or any other aspects of your travel content strategy.",
          true
        );
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-6xl mx-auto">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isBot ? "justify-start" : "justify-end"
            } animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-soft ${
                message.isBot
                  ? "bg-card border border-border/50 text-card-foreground"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground"
              }`}
            >
              <p className="text-sm sm:text-base leading-relaxed font-medium">
                {message.text}
              </p>

              {/* Component Rendering */}
              {message.component === "url-form" && chatState === "initial" && (
                <div className="mt-4">
                  <URLForm onSubmit={handleURLSubmit} />
                </div>
              )}
              {message.component === "confirmation" &&
                chatState === "url-submitted" &&
                websiteData && (
                  <div className="mt-4">
                    <ConfirmationScreen
                      data={websiteData}
                      onConfirm={handleDataConfirmation}
                    />
                  </div>
                )}
              {message.component === "recommendations" &&
                chatState === "data-confirmed" && (
                  <div className="mt-4">
                    <RecommendationsScreen />
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-xs sm:max-w-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-card border border-border/50 shadow-soft">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {chatState === "data-confirmed" && (
        <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about these recommendations..."
                  className="pr-12 sm:pr-14 h-12 sm:h-14 text-sm sm:text-base rounded-xl sm:rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
              {[
                "Budget planning",
                "More destinations",
                "Brand collaborations",
              ].map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(action);
                    handleSendMessage();
                  }}
                  className="text-xs sm:text-sm rounded-full border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
