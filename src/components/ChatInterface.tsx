"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, Wand2, X, CheckCircle2, Circle, ArrowRight, Mail, FileText, Globe } from "lucide-react";
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
        addMessage("Great! Your personalized travel report has been sent to your email. Check your inbox (and spam folder) for the PDF attachment. You can continue chatting to explore more destinations or ask any questions!", true);
        // Scroll to show the success message
        setTimeout(() => {
          const el = document.getElementById('email-report-section');
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        throw new Error(data.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      addMessage(`Sorry, there was an issue sending your report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`, true);
    }
  }

  return (
    <div className="flex h-[calc(100vh-40px)] lg:h-[calc(100vh-48px)] bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Desktop Sidebar - Visible on large screens */}
      <div className="hidden lg:flex flex-col w-60 xl:w-64 bg-card/60 backdrop-blur-lg border-r border-border/40 shadow-lg">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-primary drop-shadow-sm" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card animate-pulse shadow-sm" />
              </div>
              <div>
                <h2 className="font-semibold text-[13px] text-foreground">Travel AI Assistant</h2>
                <p className="text-[10px] text-muted-foreground">Analyzing your journey</p>
              </div>
            </div>
            <div className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Live
            </div>
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          {/* Journey Progress Steps */}
          <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-3 border border-border/30">
            <h3 className="font-semibold text-[12px] mb-3 text-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              Journey Progress
            </h3>
            <div className="space-y-2">
              {[
                { step: "Website Analysis", status: chatState !== "initial" ? "completed" : chatState === "initial" ? "current" : "pending", icon: Globe },
                { step: "Data Confirmation", status: chatState === "profiling" || chatState === "questions" || chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "confirmation" ? "current" : "pending", icon: CheckCircle2 },
                { step: "Taste Profiling", status: chatState === "questions" || chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "profiling" ? "current" : "pending", icon: User },
                { step: "Preferences", status: chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "questions" ? "current" : "pending", icon: MessageSquare },
                { step: "Recommendations", status: chatState === "recommendations" ? "completed" : chatState === "generating" ? "current" : "pending", icon: Sparkles }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      item.status === "completed" ? "bg-green-500/20 text-green-600" :
                      item.status === "current" ? "bg-primary/20 text-primary animate-pulse" :
                      "bg-muted/50 text-muted-foreground"
                    }`}>
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : item.status === "current" ? (
                        <Circle className="h-3 w-3 fill-current" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    <span className={`text-[11px] flex-1 transition-all duration-300 ${
                      item.status === "completed" ? "font-medium text-foreground" :
                      item.status === "current" ? "font-medium text-primary" :
                      "text-muted-foreground"
                    }`}>
                      {item.step}
                    </span>
                    {item.status === "current" && (
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Stats */}
          <div className="bg-card/50 rounded-lg p-3 border border-border/30">
            <h3 className="font-semibold text-[12px] mb-2 text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Session Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded p-2 text-center">
                <div className="text-lg font-bold text-primary">{messages.length}</div>
                <div className="text-[10px] text-muted-foreground">Messages</div>
              </div>
              <div className="bg-background/50 rounded p-2 text-center">
                <div className="text-lg font-bold text-green-600">
                  {chatState === "recommendations" ? "100%" : 
                   chatState === "generating" ? "80%" :
                   chatState === "questions" ? `${Math.round(((currentQuestionIndex + 1) / questions.length) * 60 + 20)}%` :
                   chatState === "profiling" ? "20%" :
                   chatState === "confirmation" ? "15%" :
                   chatState === "analyzing" ? "10%" : "0%"}
                </div>
                <div className="text-[10px] text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>

          {/* Website Analysis Summary */}
          {websiteData && (
            <div className="bg-gradient-to-br from-accent/10 to-transparent rounded-lg p-3 border border-border/30">
              <h3 className="font-semibold text-[12px] mb-2 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-accent" />
                Website Insights
              </h3>
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Content Type</div>
                  <div className="text-[11px] font-medium text-foreground bg-accent/10 px-2 py-1 rounded inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {websiteData.contentType}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Key Themes</div>
                  <div className="flex flex-wrap gap-1">
                    {websiteData.themes.slice(0, 3).map((theme, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                        {theme}
                      </span>
                    ))}
                    {websiteData.themes.length > 3 && (
                      <span className="bg-muted/50 text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                        +{websiteData.themes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                {tasteProfile && (
                  <div className="pt-1 border-t border-border/30">
                    <div className="text-[10px] text-muted-foreground mb-1">Taste Match</div>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{ width: `${(tasteProfile.confidence || 0.85) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-primary">
                        {Math.round((tasteProfile.confidence || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Status */}
          {chatState === "recommendations" && reportSent && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <h3 className="font-semibold text-[12px] text-green-800 dark:text-green-300">
                  Report Delivered
                </h3>
              </div>
              <p className="text-[10px] text-green-600 dark:text-green-400 leading-relaxed">
                Your personalized PDF report has been sent to {email}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          {chatState === "recommendations" && (
            <div className="space-y-2">
              <h3 className="font-semibold text-[12px] text-foreground flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-primary" />
                Quick Actions
              </h3>
              <div className="grid gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start h-7 text-[11px] hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-2.5 group"
                  onClick={() => {
                    setInputValue("Show me more destinations");
                    setTimeout(() => handleSendMessage(), 0);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1.5 group-hover:animate-pulse" />
                  More Destinations
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`justify-start h-7 text-[11px] px-2.5 group ${
                    reportSent 
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30" 
                      : "hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                  }`}
                  onClick={() => {
                    const el = document.getElementById('email-report-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Mail className="h-3 w-3 mr-1.5" />
                  {reportSent ? "Report Sent ✓" : "Get PDF Report"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start h-7 text-[11px] hover:bg-muted hover:text-foreground px-2.5"
                  onClick={() => {
                    setInputValue("Export this conversation");
                    setTimeout(() => handleSendMessage(), 0);
                  }}
                >
                  <MessageSquare className="h-3 w-3 mr-1.5" />
                  Export Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Enhanced Chat Header */}
        {/* <div className="border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto px-3 lg:px-4 xl:px-6 py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0 lg:hidden">
                <Bot className="h-4 w-4 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-background animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-[13px] lg:text-sm xl:text-base text-foreground flex items-center gap-1.5 truncate">
                  <span className="truncate">AI Travel Companion</span>
                  <Sparkles className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-primary" />
                </h2>
                <p className="text-[11px] lg:text-xs text-muted-foreground truncate">
                  {chatState === "initial" && "Ready to analyze your website"}
                  {chatState === "analyzing" && "Analyzing your content..."}
                  {chatState === "confirmation" && "Reviewing data"}
                  {chatState === "profiling" && "Building your taste profile..."}
                  {chatState === "questions" && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                  {chatState === "generating" && "Generating recommendations..."}
                  {chatState === "recommendations" && "Recommendations ready!"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-full">
                  <MessageSquare className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">{messages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}


        {/* Enhanced Chat Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-background/50 to-muted/20">
          <div className="max-w-none lg:max-w-4xl xl:max-w-5xl mx-auto px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-6">
            <div className="space-y-3 lg:space-y-4">
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
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`group relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] xl:max-w-[65%] ${
                      message.isBot ? "order-2" : "order-1"
                    }`}>
                      <div
                        className={`
                          px-3 py-2 lg:px-4 lg:py-3 shadow-sm transition-all duration-150 hover:shadow-md
                          ${message.isBot
                            ? "bg-card border border-border/50 rounded-xl rounded-bl-sm text-foreground"
                            : "bg-gradient-to-br from-primary to-primary/90 rounded-xl rounded-br-sm text-primary-foreground shadow-primary/20"
                          }
                        `}
                      >
                        {message.isBot && (
                          <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                            <Wand2 className="h-3 w-3" />
                            <span className="text-[11px] font-medium">AI Assistant</span>
                          </div>
                        )}
                        <p className="text-[13px] lg:text-sm leading-relaxed">
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
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-primary border border-primary/30 flex items-center justify-center shadow-sm ml-2">
                        <User className="h-3.5 w-3.5 text-white" />
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
                <div className="flex items-end gap-2 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border/50 px-3 py-2 rounded-xl shadow-sm max-w-[180px]">
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                      <Wand2 className="h-3 w-3" />
                      <span className="text-[11px] font-medium">AI Assistant</span>
                    </div>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Input Area */}
        {chatState === "recommendations" && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="max-w-none xl:max-w-6xl mx-auto px-3 lg:px-4 xl:px-6">
              <div className="py-2 lg:py-3 space-y-2">
                {/* Enhanced Email Report Section */}
                {!reportSent ? (
                  <div id="email-report-section" className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-3 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-xs text-foreground">
                          Get Your Personalized Travel Report
                        </h4>
                        <span className="hidden lg:inline text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                          PDF • 10+ pages
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 h-8 text-xs bg-background/50 border-border/50 focus:border-primary/50"
                        type="email"
                      />
                      <Button 
                        onClick={handleSendReport} 
                        disabled={!email || isTyping}
                        className="h-8 px-4 font-medium text-xs bg-primary hover:bg-primary/90"
                      >
                        <Mail className="h-3 w-3 mr-1.5" />
                        Send Report
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      📄 Includes: Detailed recommendations, budget analysis, creator insights & collaboration tips
                    </p>
                  </div>
                ) : (
                  <div id="email-report-section" className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <div>
                          <p className="font-semibold text-xs text-green-800 dark:text-green-300">Report Sent Successfully!</p>
                          <p className="text-[10px] text-green-600 dark:text-green-400">Check your email inbox (and spam folder)</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                        onClick={() => setReportSent(false)}
                      >
                        <X className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </Button>
                    </div>
                  </div>
                )}
                  
                {/* Chat Input - Always Available */}
                <div className="bg-background/50 rounded-lg p-2 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    <div className="relative flex-1">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={reportSent ? "Continue chatting - ask about other destinations, tips, or details..." : "Ask me anything about your recommendations..."}
                        className="w-full pr-10 h-9 text-xs lg:text-[13px] bg-background border-border/50 focus:border-primary/50"
                        disabled={isTyping}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary hover:bg-primary/90"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                    
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-muted-foreground">Suggestions:</span>
                    {[
                      { text: "Compare destinations", icon: "🔄" },
                      { text: "Budget breakdown", icon: "💰" }, 
                      { text: "Best time to visit", icon: "📅" },
                      { text: "Creator opportunities", icon: "🎯" }
                    ].map((action) => (
                      <Button
                        key={action.text}
                        variant="ghost"
                        size="sm"
                        className="text-[10px] px-2 py-1 h-5 border border-border/30 hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => {
                          setInputValue(action.text);
                          setTimeout(() => handleSendMessage(), 0);
                        }}
                        disabled={isTyping}
                      >
                        <span className="mr-1">{action.icon}</span>
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ChatInterface;
