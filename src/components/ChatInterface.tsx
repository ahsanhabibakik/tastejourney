"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import TypingIndicator from "./TypingIndicator";
import URLForm from "./URLForm";
import ConfirmationScreen from "./ConfirmationScreen";


interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  component?: "url-form" | "confirmation" | "questions" | "recommendations";
}

type ChatState =
  | "initial"
  | "analyzing"
  | "confirmation"
  | "profiling"
  | "questions"
  | "generating"
  | "recommendations";

interface UserAnswers {
  budget?: string;
  duration?: string;
  style?: string;
  contentFocus?: string;
  climate?: string | string[];
  [key: string]: string | string[] | undefined;
}

interface Recommendation {
  destination: string;
  image?: string;
  highlights?: string[];
  budget?: { range: string };
  bestMonths?: string[];
  engagement?: { potential: string };
  enrichment?: Record<string, unknown>;
  tags?: string[];
  creatorDetails?: {
    totalActiveCreators: number;
    topCreators: Array<{
      name: string;
      followers: string;
      niche: string;
      collaboration: string;
    }>;
    collaborationOpportunities: string[];
  };
}

const questions = [
  {
    id: "budget",
    text: "💸 What's your budget range for this trip?",
    options: ["$500-1000", "$1000-2500", "$2500-5000", "$5000+"],
    icon: "💸",
    multiSelect: false,
  },
  {
    id: "duration",
    text: "🗓️ How long would you like to travel?",
    options: ["1-3 days", "4-7 days", "1-2 weeks", "2+ weeks"],
    icon: "🗓️",
    multiSelect: false,
  },
  {
    id: "style",
    text: "🌍 What's your preferred travel style?",
    options: ["Adventure", "Luxury", "Cultural", "Beach", "Urban"],
    icon: "🌍",
    multiSelect: false,
  },
  {
    id: "contentFocus",
    text: "📸 What type of content do you focus on?",
    options: ["Photography", "Food", "Lifestyle", "Adventure"],
    icon: "📸",
    multiSelect: false,
  },
  {
    id: "climate",
    text: "☀️ Select all climate preferences that apply (you can choose multiple):",
    options: [
      "Tropical/Sunny",
      "Mild/Temperate",
      "Cold/Snowy",
      "Desert/Arid",
      "No preference",
      "Avoid hot",
      "Avoid cold",
      "Avoid rainy",
    ],
    icon: "☀️",
    multiSelect: true,
  },
];

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
  const [email, setEmail] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("initial");
  const [websiteData, setWebsiteData] = useState<{
    url: string;
    themes: string[];
    hints: string[];
    contentType: string;
    socialLinks: { platform: string; url: string }[];
    title: string;
    description: string;
    keywords?: string[];
    images?: string[];
    videoLinks?: string[];
    language?: string;
    location?: string;
    brands?: string[];
    collaborations?: string[];
    regionBias?: string[];
    extractedAt?: string;
    scrapingMethods?: string[];
    fallbackUsed?: boolean;
  } | null>(null);
  const [tasteProfile, setTasteProfile] = useState<{ 
    tasteVector: Record<string, number>;
    confidence?: number;
    culturalAffinities?: string[];
    personalityTraits?: string[];
  } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedClimates, setSelectedClimates] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [recommendations, setRecommendations] = useState<
    | {
        recommendations: Recommendation[];
        [key: string]: unknown;
      }
    | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Generate a unique ID for each message
  function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const addMessage = (
    text: string,
    isBot: boolean,
    component?: "url-form" | "confirmation" | "questions" | "recommendations"
  ) => {
    const newMessage: Message = {
      id: generateUniqueId(),
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
    setChatState("analyzing");

    await simulateTyping(() => {
      addMessage(
        "Perfect! I'm analyzing your website now. This may take a moment while I extract key information about your content, audience, and preferences...",
        true
      );
    });

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setWebsiteData(result.data);
        setChatState("confirmation");
        await simulateTyping(() => {
          addMessage(
            "Great! I've extracted key information from your website. Please confirm if this looks accurate:",
            true,
            "confirmation"
          );
        }, 2500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error analyzing website:", error);
      addMessage(
        "I encountered an issue analyzing your website. Let me use some sample data to continue the demo.",
        true
      );

      // Fallback to mock data
      const mockData = {
        url,
        themes: ["travel", "photography", "adventure", "culture", "food"],
        hints: [
          "visual-content-creator",
          "photographer",
          "social-media-creator",
        ],
        contentType: "Travel Photography",
        socialLinks: [
          { platform: "Instagram", url: "https://instagram.com/example" },
        ],
        title: "Creative Portfolio",
        description: "Travel and lifestyle content creator",
      };
      setWebsiteData(mockData);
      setChatState("confirmation");
      await simulateTyping(() => {
        addMessage(
          "Here's what I found about your content. Please confirm if this looks accurate:",
          true,
          "confirmation"
        );
      }, 1500);
    }
  };

  const handleDataConfirmation = async (confirmed: boolean) => {
    if (confirmed) {
      addMessage("Yes, this information is accurate.", false);
      setChatState("profiling");

      await simulateTyping(() => {
        addMessage(
          "Excellent! Now I'm creating your taste profile using AI analysis. This helps me understand your cultural preferences and content style...",
          true
        );
      });

      try {
        if (!websiteData) throw new Error("Website data is missing");
        const response = await fetch("/api/profile-taste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themes: websiteData.themes,
            hints: websiteData.hints,
            contentType: websiteData.contentType,
            socialLinks: websiteData.socialLinks,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setTasteProfile(result.data);
          setChatState("questions");
          setCurrentQuestionIndex(0);
          await simulateTyping(() => {
            addMessage(
              "Perfect! I've created your taste profile. Now I need to ask you a few quick questions to personalize your recommendations:",
              true
            );
            addMessage(questions[0].text, true, "questions");
          }, 2000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error creating taste profile:", error);
        // Continue with mock data
        setChatState("questions");
        setCurrentQuestionIndex(0);
        await simulateTyping(() => {
          addMessage(
            "Great! Now let me ask you a few questions to personalize your recommendations:",
            true
          );
          addMessage(questions[0].text, true, "questions");
        }, 1500);
      }
    } else {
      addMessage("The information needs corrections.", false);
      await simulateTyping(() => {
        addMessage(
          "No problem! For this demo, let me continue with the analysis. In the full version, you'd be able to correct any details.",
          true
        );
      });
    }
  };

  const handleClimateSelection = (climate: string) => {
    setSelectedClimates(prev => {
      if (prev.includes(climate)) {
        return prev.filter(c => c !== climate);
      } else {
        return [...prev, climate];
      }
    });
  };

  const handleQuestionAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Handle multi-select for climate question
    if (currentQuestion.id === "climate" && currentQuestion.multiSelect) {
      handleClimateSelection(answer);
      return; // Don't proceed to next question yet
    }
    
    addMessage(answer, false);

    // Save the answer
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      await simulateTyping(() => {
        addMessage(questions[currentQuestionIndex + 1].text, true, "questions");
      });
    } else {
      // All questions answered, generate recommendations
      setChatState("generating");
      await simulateTyping(() => {
        addMessage(
          "Perfect! I have all the information I need. Now I'm generating your personalized travel recommendations using AI analysis of taste vectors, creator communities, and brand partnerships...",
          true
        );
      });

      try {
        const finalAnswers = { ...userAnswers, [currentQuestion.id]: answer };
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasteVector: tasteProfile?.tasteVector || {
              adventure: 0.7,
              culture: 0.6,
              luxury: 0.4,
              food: 0.8,
              nature: 0.5,
              urban: 0.3,
              budget: 0.6,
            },
            userPreferences: {
              budget: finalAnswers.budget?.replace("$", "") || "1000-2500",
              duration: finalAnswers.duration || "4-7 days",
              style: finalAnswers.style?.toLowerCase() || "adventure",
              contentFocus:
                finalAnswers.contentFocus?.toLowerCase() || "photography",
              climate: finalAnswers.climate || selectedClimates.length > 0 ? selectedClimates : ["No preference"],
            },
            websiteData: websiteData,
          }),
        });

        const result = await response.json();

        if (result.recommendations) {
          // Attach Qloo enrichment if available
          setRecommendations({
            ...result,
            qloo: {
              confidence: tasteProfile?.confidence,
              culturalAffinities: tasteProfile?.culturalAffinities,
              personalityTraits: tasteProfile?.personalityTraits,
            },
          });
          setChatState("recommendations");
          await simulateTyping(() => {
            addMessage(
              "Here are your top travel destination recommendations optimized for content creation and monetization:",
              true,
              "recommendations"
            );
          }, 3000);
        } else {
          throw new Error("No recommendations received");
        }
      } catch (error) {
        console.error("Error generating recommendations:", error);
        setChatState("recommendations");
        await simulateTyping(() => {
          addMessage(
            "Here are your personalized travel recommendations:",
            true,
            "recommendations"
          );
        }, 2000);
      }
    }
  };

  const handleClimateConfirm = async () => {
    if (selectedClimates.length === 0) return;
    
    const climateAnswerText = selectedClimates.join(", ");
    addMessage(climateAnswerText, false);
    
    // Save the climate answers
    setUserAnswers((prev) => ({
      ...prev,
      climate: selectedClimates,
    }));

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      await simulateTyping(() => {
        addMessage(questions[currentQuestionIndex + 1].text, true, "questions");
      });
    } else {
      // All questions answered, generate recommendations
      setChatState("generating");
      await simulateTyping(() => {
        addMessage(
          "Perfect! I have all the information I need. Now I'm generating your personalized travel recommendations using AI analysis of taste vectors, creator communities, and brand partnerships...",
          true
        );
      });

      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasteVector: tasteProfile?.tasteVector || {
              adventure: 0.7,
              culture: 0.6,
              luxury: 0.4,
              food: 0.8,
              nature: 0.5,
              urban: 0.3,
              budget: 0.6,
            },
            userPreferences: {
              budget: userAnswers.budget?.replace("$", "") || "1000-2500",
              duration: userAnswers.duration || "4-7 days",
              style: userAnswers.style?.toLowerCase() || "adventure",
              contentFocus: userAnswers.contentFocus?.toLowerCase() || "photography",
              climate: selectedClimates,
            },
            websiteData: websiteData,
          }),
        });

        const result = await response.json();

        if (result.recommendations) {
          // Attach Qloo enrichment if available
          setRecommendations({
            ...result,
            qloo: {
              confidence: tasteProfile?.confidence,
              culturalAffinities: tasteProfile?.culturalAffinities,
              personalityTraits: tasteProfile?.personalityTraits,
            },
          });
          setChatState("recommendations");
          await simulateTyping(() => {
            addMessage(
              "Here are your top travel destination recommendations optimized for content creation and monetization:",
              true,
              "recommendations"
            );
          }, 3000);
        } else {
          throw new Error("No recommendations received");
        }
      } catch (error) {
        console.error("Error generating recommendations:", error);
        setChatState("recommendations");
        await simulateTyping(() => {
          addMessage(
            "Here are your personalized travel recommendations:",
            true,
            "recommendations"
          );
        }, 2000);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage(userMessage, false);

    setIsTyping(true);

    try {
      const response = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            chatState,
            websiteData,
            recommendations: recommendations?.recommendations || [],
            userAnswers,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        setIsTyping(false);
        addMessage(data.message, true);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setIsTyping(false);
      addMessage(
        "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment.",
        true
      );
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  async function handleSendReport() {
    if (!email) return;
    
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recommendations: recommendations?.recommendations || [],
          userProfile: userAnswers,
          websiteData: websiteData || {
            url: '',
            themes: [],
            hints: [],
            contentType: '',
            socialLinks: [],
            title: '',
            description: ''
          },
          userName: email.split('@')[0], // Extract username from email
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReportSent(true);
        addMessage("Great! Your personalized travel report has been sent to your email. Check your inbox (and spam folder) for the PDF attachment.", true);
      } else {
        throw new Error(data.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      addMessage(`Sorry, there was an issue sending your report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`, true);
    }
  }

  return (
    <div className="flex h-[calc(100vh-60px)] sm:h-[calc(100vh-73px)] bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Desktop Sidebar - Visible on large screens */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-card/60 backdrop-blur-lg border-r border-border/40 shadow-lg">
        {/* Sidebar Header */}
        <div className="p-4 lg:p-5 xl:p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-7 w-7 xl:h-8 xl:w-8 text-primary drop-shadow-sm" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse shadow-sm" />
            </div>
            <div>
              <h2 className="font-bold text-base xl:text-lg text-foreground">Travel AI</h2>
              <p className="text-xs xl:text-sm text-muted-foreground">Content Creator Companion</p>
            </div>
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="p-4 lg:p-5 xl:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Session Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Messages</span>
                <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Current Step</span>
                <span className="text-sm font-medium capitalize bg-muted/50 px-2 py-1 rounded-md">{chatState}</span>
              </div>
              {websiteData && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Content Type</span>
                  <span className="text-sm font-medium bg-accent/50 px-2 py-1 rounded-md text-accent-foreground">{websiteData.contentType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Website Analysis Summary */}
          {websiteData && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border/30 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Website Analysis
              </h3>
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-muted-foreground block mb-2">Detected Themes:</span>
                  <div className="flex flex-wrap gap-1">
                    {websiteData.themes.slice(0, 4).map((theme, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-medium">
                        {theme}
                      </span>
                    ))}
                    {websiteData.themes.length > 4 && (
                      <span className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded-full">
                        +{websiteData.themes.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Quick Actions
            </h3>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start h-9 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                <Sparkles className="h-3 w-3 mr-2" />
                New Analysis
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-9 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                <MessageSquare className="h-3 w-3 mr-2" />
                Export Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Enhanced Chat Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
              {/* Show bot icon on smaller screens when sidebar is hidden */}
              <div className="relative flex-shrink-0 lg:hidden">
                <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl text-foreground flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="truncate">AI Travel Companion</span>
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-primary flex-shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground truncate">
                {chatState === "initial" && "Ready to analyze your website"}
                {chatState === "analyzing" && "Analyzing your content..."}
                {chatState === "confirmation" && "Reviewing extracted data"}
                {chatState === "profiling" && "Building your taste profile..."}
                {chatState === "questions" && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                {chatState === "generating" && "Generating recommendations..."}
                {chatState === "recommendations" && "Recommendations ready!"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1 bg-primary/10 rounded-full">
                <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                <span className="text-[10px] sm:text-xs font-medium text-primary">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Enhanced Chat Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-background/50 to-muted/20">
          <div className="max-w-none lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 xl:py-8">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <div
                    className={`flex items-end gap-2 sm:gap-3 animate-fade-in ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Bot Avatar - Only show for bot messages on the left */}
                    {message.isBot && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-md">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`group relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] xl:max-w-[65%] ${
                      message.isBot ? "order-2" : "order-1"
                    }`}>
                      <div
                        className={`
                          px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 shadow-md transition-all duration-200 hover:shadow-lg
                          ${message.isBot
                            ? "bg-card border border-border/50 rounded-2xl rounded-bl-md text-foreground"
                            : "bg-gradient-to-br from-primary to-primary/90 rounded-2xl rounded-br-md text-primary-foreground shadow-primary/20"
                          }
                        `}
                      >
                        {message.isBot && (
                          <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-[10px] sm:text-xs font-medium">AI Assistant</span>
                          </div>
                        )}
                        <p className="text-xs sm:text-sm lg:text-base leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        message.isBot ? "text-left" : "text-right"
                      }`}>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* User Avatar - Only show for user messages on the right */}
                    {!message.isBot && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-primary/30 flex items-center justify-center shadow-md ml-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Component renders */}
                  {message.component === "url-form" &&
                    chatState === "initial" && (
                      <URLForm onSubmit={handleURLSubmit} />
                    )}

                  {message.component === "confirmation" &&
                    chatState === "confirmation" &&
                    websiteData && (
                      <ConfirmationScreen
                        data={websiteData}
                        onConfirm={handleDataConfirmation}
                      />
                    )}

                {message.component === "questions" &&
                  chatState === "questions" && (
                    <div className="mt-6 w-full animate-slide-up">
                      {/* Enhanced Progress Bar */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500 ease-out relative"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                          >
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                          <span className="text-sm font-semibold text-primary">
                            {currentQuestionIndex + 1}
                          </span>
                          <span className="text-xs text-primary/70">of</span>
                          <span className="text-sm font-semibold text-primary">
                            {questions.length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Enhanced Current Question */}
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-2xl">
                              {questions[currentQuestionIndex].icon}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground mb-1">
                              {questions[currentQuestionIndex].text}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Choose the option that best describes your preference
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Options */}
                      <div className="grid gap-3">
                        {questions[currentQuestionIndex].options.map(
                          (option, index) => {
                            const isMultiSelect = questions[currentQuestionIndex].multiSelect;
                            const isSelected = isMultiSelect 
                              ? selectedClimates.includes(option)
                              : userAnswers[questions[currentQuestionIndex].id] === option;
                            
                            return (
                              <Button
                                key={index}
                                variant={isSelected ? "default" : "outline"}
                                className="w-full justify-start text-left"
                                onClick={() => handleQuestionAnswer(option)}
                              >
                                {isMultiSelect && isSelected && "✓ "}
                                {option}
                              </Button>
                            );
                          }
                        )}
                        
                        {/* Continue button for multi-select */}
                        {questions[currentQuestionIndex].multiSelect && selectedClimates.length > 0 && (
                          <div className="mt-4 pt-2 border-t">
                            <Button
                              onClick={handleClimateConfirm}
                              className="w-full"
                              variant="default"
                            >
                              Continue with {selectedClimates.length} preference{selectedClimates.length > 1 ? 's' : ''}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                {message.component === "recommendations" &&
                  chatState === "recommendations" && recommendations?.recommendations && (
                    <div className="mt-3 sm:mt-4 xl:mt-6 w-full">
                      {/* Enhanced Header for Desktop */}
                      <div className="flex flex-col gap-1 sm:gap-2 xl:gap-3 mb-3 sm:mb-4 xl:mb-6">
                        <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Your Travel Recommendations
                        </h3>
                        <p className="text-[10px] sm:text-xs xl:text-sm text-muted-foreground">
                          <span className="hidden xl:inline">Explore personalized destinations • </span>
                          <span className="xl:hidden">Swipe to explore • </span>
                          {recommendations.recommendations.length} destinations curated for content creators
                        </p>
                      </div>
                      
                      {/* Enhanced Destination Cards Grid for Desktop */}
                      <div className="xl:hidden">
                        {/* Mobile/Tablet Horizontal Scroll */}
                        <div 
                          ref={scrollContainerRef}
                          className="overflow-x-auto pb-2 sm:pb-3 scrollbar-hide -mx-1"
                          style={{scrollBehavior: 'smooth'}}
                        >
                          <div className="flex gap-2 sm:gap-3 w-max px-1">
                            {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                              <div
                                key={i}
                                className="group bg-card border border-border/50 rounded-lg overflow-hidden flex-shrink-0 w-56 sm:w-64 md:w-72 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                            {/* Compact Image */}
                            <div className="relative overflow-hidden">
                              {rec.image && (
                                <Image 
                                  src={rec.image} 
                                  alt={rec.destination}
                                  width={300}
                                  height={120}
                                  className="w-full h-24 sm:h-28 md:h-32 object-cover group-hover:scale-105 transition-transform duration-200" 
                                />
                              )}
                              <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                              <div className="absolute top-1.5 right-1.5">
                                <span className="bg-white/90 text-primary text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                                  #{i + 1}
                                </span>
                              </div>
                            </div>
                            
                            {/* Compact Content */}
                            <div className="p-2 sm:p-2.5">
                              <h4 className="font-bold text-xs sm:text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                {rec.destination}
                              </h4>
                              
                              {rec.highlights && rec.highlights.length > 0 && (
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-2 line-clamp-1">
                                  {rec.highlights.slice(0, 2).join(' • ')}
                                </p>
                              )}
                              
                              {/* Essential Info Only */}
                              <div className="space-y-1 text-[9px] sm:text-[10px] mb-2">
                                {rec.budget?.range && (
                                  <div className="flex items-center gap-1">
                                    <span>💰</span>
                                    <span className="truncate">{rec.budget.range}</span>
                                  </div>
                                )}
                                {rec.engagement?.potential && (
                                  <div className="flex items-center gap-1">
                                    <span>📈</span>
                                    <span className="truncate">{rec.engagement.potential}</span>
                                  </div>
                                )}
                              </div>

                              {/* Compact Creator Info */}
                              {rec.creatorDetails && (
                                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded border border-primary/20">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-primary">🎯 Creator Hub</span>
                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground">{rec.creatorDetails.totalActiveCreators}+</span>
                                  </div>
                                  
                                  {/* Show only 1 top creator on mobile */}
                                  {rec.creatorDetails.topCreators.slice(0, 1).map((creator, idx) => (
                                    <div key={idx} className="bg-background/60 p-1 rounded text-[8px] sm:text-[9px]">
                                      <div className="font-medium truncate">{creator.name}</div>
                                      <div className="text-primary">{creator.collaboration}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Compact Tags */}
                              {rec.tags && rec.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {rec.tags.slice(0, 2).map((tag: string) => (
                                    <span key={tag} className="bg-secondary text-secondary-foreground text-[8px] px-1 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mobile Progress Indicator */}
                      <div className="flex justify-center items-center gap-2 mt-2 sm:mt-3">
                        <div className="flex items-center gap-1">
                          {recommendations.recommendations.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentSlide(idx);
                                if (scrollContainerRef.current) {
                                  const cardWidth = window.innerWidth < 640 ? 224 : window.innerWidth < 768 ? 256 : 288; // w-56, w-64, w-72
                                  const gap = 8; // gap-2
                                  const scrollDistance = (cardWidth + gap) * idx;
                                  scrollContainerRef.current.scrollTo({
                                    left: scrollDistance,
                                    behavior: 'smooth'
                                  });
                                }
                              }}
                              className={`transition-all duration-200 rounded-full ${
                                idx === currentSlide 
                                  ? 'w-4 sm:w-5 h-1 sm:h-1.5 bg-primary' 
                                  : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-muted-foreground/30'
                              }`}
                              aria-label={`Go to recommendation ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                      </div>

                      {/* Desktop Grid Layout - Only visible on xl screens */}
                      <div className="hidden xl:block">
                        <div className="grid grid-cols-2 2xl:grid-cols-3 gap-6">
                          {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                            <div
                              key={i}
                              className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            >
                              {/* Enhanced Image for Desktop */}
                              <div className="relative overflow-hidden h-48">
                                {rec.image && (
                                  <Image 
                                    src={rec.image} 
                                    alt={rec.destination}
                                    width={400}
                                    height={200}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                  />
                                )}
                                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                <div className="absolute top-4 right-4">
                                  <span className="bg-white/90 backdrop-blur-sm text-primary text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                    #{i + 1}
                                  </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                  <h4 className="font-bold text-xl text-white mb-2 drop-shadow-lg">
                                    {rec.destination}
                                  </h4>
                                </div>
                              </div>
                              
                              {/* Enhanced Content for Desktop */}
                              <div className="p-6 space-y-4">
                                {rec.highlights && rec.highlights.length > 0 && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {rec.highlights.slice(0, 3).join(' • ')}
                                  </p>
                                )}
                                
                                {/* Enhanced Info Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {rec.budget?.range && (
                                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                      <span className="text-lg">💰</span>
                                      <span className="font-medium">{rec.budget.range}</span>
                                    </div>
                                  )}
                                  {rec.engagement?.potential && (
                                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                      <span className="text-lg">📈</span>
                                      <span className="font-medium">{rec.engagement.potential}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Enhanced Creator Info for Desktop */}
                                {rec.creatorDetails && (
                                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-bold text-primary flex items-center gap-2">
                                        🎯 Creator Community
                                      </span>
                                      <span className="text-sm font-semibold text-muted-foreground">{rec.creatorDetails.totalActiveCreators}+ Active</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {rec.creatorDetails.topCreators.slice(0, 2).map((creator, idx) => (
                                        <div key={idx} className="bg-background/60 p-3 rounded-lg text-sm">
                                          <div className="font-semibold text-foreground">{creator.name}</div>
                                          <div className="text-xs text-muted-foreground">{creator.niche}</div>
                                          <div className="text-primary font-medium mt-1">{creator.collaboration}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Enhanced Tags for Desktop */}
                                {rec.tags && rec.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {rec.tags.slice(0, 4).map((tag: string) => (
                                      <span key={tag} className="bg-secondary/80 text-secondary-foreground text-xs px-3 py-1 rounded-full font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {isTyping && (
                <div className="flex items-end gap-3 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl shadow-sm max-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 opacity-70">
                      <Wand2 className="h-3 w-3" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Input Area for Desktop */}
        {chatState === "recommendations" && (
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-md">
            <div className="max-w-none xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
              {!reportSent ? (
                <div className="py-2 sm:py-3 xl:py-4 space-y-2 sm:space-y-3 xl:space-y-4">
                  {/* Enhanced Report Section for Desktop */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-md sm:rounded-lg xl:rounded-xl p-2 sm:p-3 xl:p-4">
                    <div className="flex items-center gap-2 xl:gap-3 mb-2 xl:mb-3">
                      <span className="text-xs xl:text-sm">📧</span>
                      <h4 className="font-semibold text-[10px] sm:text-xs xl:text-sm text-foreground">
                        Get Detailed PDF Report
                      </h4>
                      <span className="hidden xl:inline text-xs text-muted-foreground">• Comprehensive travel insights & creator opportunities</span>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 xl:gap-3">
                      <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 h-7 sm:h-8 xl:h-10 text-[10px] sm:text-xs xl:text-sm"
                        type="email"
                      />
                      <Button 
                        onClick={handleSendReport} 
                        disabled={!email}
                        className="h-7 sm:h-8 xl:h-10 px-2 sm:px-3 xl:px-4 font-medium text-[10px] sm:text-xs xl:text-sm"
                      >
                        <span className="xl:hidden">Send</span>
                        <span className="hidden xl:inline">Send Report</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced Chat Input for Desktop */}
                  <div className="xl:grid xl:grid-cols-3 xl:gap-4 xl:items-center">
                    <div className="relative xl:col-span-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about recommendations, budget details, or collaboration opportunities..."
                        className="w-full pr-8 sm:pr-9 xl:pr-12 h-7 sm:h-8 xl:h-10 text-[10px] sm:text-xs xl:text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        size="icon"
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 xl:h-8 xl:w-8"
                      >
                        <Send className="h-2.5 w-2.5 sm:h-3 sm:w-3 xl:h-4 xl:w-4" />
                      </Button>
                    </div>
                    
                    {/* Enhanced Quick Actions for Desktop */}
                    <div className="xl:col-span-1 xl:flex xl:justify-end">
                      <div className="flex flex-wrap gap-1 xl:gap-2 justify-center xl:justify-end">
                        {[
                          "More destinations",
                          "Budget breakdown", 
                          "Collaboration tips"
                        ].map((action) => (
                          <Button
                            key={action}
                            variant="outline"
                            size="sm"
                            className="text-[8px] sm:text-[9px] xl:text-xs px-1 sm:px-1.5 xl:px-3 py-0.5 xl:py-1 h-auto border-muted hover:bg-muted/50"
                            onClick={() => {
                              setInputValue(action);
                              setTimeout(() => handleSendMessage(), 0);
                            }}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-3 sm:py-4 xl:py-6 text-center">
                  <div className="inline-flex items-center gap-2 xl:gap-3 px-3 sm:px-4 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-lg xl:rounded-xl">
                    <span className="text-xs sm:text-sm xl:text-base">✅</span>
                    <div className="text-left">
                      <p className="font-semibold text-[10px] sm:text-xs xl:text-sm">Report Sent!</p>
                      <p className="text-[9px] sm:text-[10px] xl:text-xs text-green-600">Check your email</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
