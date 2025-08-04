"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Wand2, X, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { Swiper, SwiperSlide } from "./TravelSwiper";
import { Pagination } from "swiper/modules";
import TypingIndicator from "./TypingIndicator";
import URLForm from "./URLForm";
import ConfirmationScreen from "./ConfirmationScreen";
import DestinationCard from "./DestinationCard";
import SidebarContent from "./SidebarContent";

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

// Optimized markdown rendering function
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (line.trim() === '') {
      return <br key={lineIndex} />;
    }
    
    const processedLine = processInlineMarkdown(line);
    
    return (
      <div key={lineIndex} className="mb-1 last:mb-0">
        {processedLine}
      </div>
    );
  });
};

// Process inline markdown elements
const processInlineMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  const patterns = [
    { regex: /^(.*?)\*\*\*(.*?)\*\*\*(.*)$/, component: (match: RegExpMatchArray) => <span key={key++} className="font-bold italic">{match[2]}</span> },
    { regex: /^(.*?)\*\*(.*?)\*\*(.*)$/, component: (match: RegExpMatchArray) => <span key={key++} className="font-bold">{match[2]}</span> },
    { regex: /^(.*?)`([^`]+)`(.*)$/, component: (match: RegExpMatchArray) => <code key={key++} className="bg-muted/50 px-1 py-0.5 rounded text-[0.875em] font-mono">{match[2]}</code> },
    { regex: /^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/, component: (match: RegExpMatchArray) => {
      const url = match[3];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 transition-opacity">{match[2]}</a>;
      }
      return `[${match[2]}](${match[3]})`;
    }},
    { regex: /^(.*?)\*(?!\*)(.*?)\*(.*)$/, component: (match: RegExpMatchArray) => <span key={key++} className="italic">{match[2]}</span> },
  ];
  
  while (remaining.length > 0) {
    let matched = false;
    
    for (const { regex, component } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        if (match[1]) elements.push(match[1]);
        elements.push(component(match));
        remaining = match[match.length - 1];
        matched = true;
        break;
      }
    }
    
    // Bullet points
    const bulletMatch = remaining.match(/^\s*\*\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-4">
          <span className="text-primary mt-1 text-xs">•</span>
          <span className="flex-1">{processInlineMarkdown(bulletMatch[1])}</span>
        </div>
      );
      break;
    }
    
    if (!matched) {
      elements.push(remaining);
      break;
    }
  }
  
  return elements;
};

interface ChatInterfaceProps {
  showMobileSidebar: boolean;
  setShowMobileSidebar: (show: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ showMobileSidebar, setShowMobileSidebar }) => {
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
  const [showEmailSection, setShowEmailSection] = useState(true);
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
  const [recommendations, setRecommendations] = useState<
    | {
        recommendations: Recommendation[];
        [key: string]: unknown;
      }
    | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addMessage = useCallback((
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
  }, [generateUniqueId]);

  const simulateTyping = useCallback(async (callback: () => void, delay: number = 1500) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, delay));
    setIsTyping(false);
    callback();
  }, []);

  const handleURLSubmit = useCallback(async (url: string) => {
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
  }, [addMessage, simulateTyping]);

  const handleDataConfirmation = useCallback(async (confirmed: boolean) => {
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
  }, [addMessage, simulateTyping, websiteData]);

  const handleClimateSelection = useCallback((climate: string) => {
    setSelectedClimates(prev => {
      if (prev.includes(climate)) {
        return prev.filter(c => c !== climate);
      } else {
        return [...prev, climate];
      }
    });
  }, []);

  const generateRecommendations = useCallback(async (finalAnswers: UserAnswers) => {
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
            budget: finalAnswers.budget?.replace("$", "") || "1000-2500",
            duration: finalAnswers.duration || "4-7 days",
            style: finalAnswers.style?.toLowerCase() || "adventure",
            contentFocus: finalAnswers.contentFocus?.toLowerCase() || "photography",
            climate: finalAnswers.climate || selectedClimates.length > 0 ? selectedClimates : ["No preference"],
          },
          websiteData: websiteData,
        }),
      });

      const result = await response.json();

      if (result.recommendations) {
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
  }, [addMessage, simulateTyping, tasteProfile, websiteData, selectedClimates]);

  const handleQuestionAnswer = useCallback(async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.id === "climate" && currentQuestion.multiSelect) {
      handleClimateSelection(answer);
      return;
    }
    
    addMessage(answer, false);

    const newAnswers = {
      ...userAnswers,
      [currentQuestion.id]: answer,
    };
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      await simulateTyping(() => {
        addMessage(questions[currentQuestionIndex + 1].text, true, "questions");
      });
    } else {
      await generateRecommendations(newAnswers);
    }
  }, [currentQuestionIndex, userAnswers, addMessage, simulateTyping, handleClimateSelection, generateRecommendations]);

  const handleClimateConfirm = useCallback(async () => {
    if (selectedClimates.length === 0) return;
    
    const climateAnswerText = selectedClimates.join(", ");
    addMessage(climateAnswerText, false);
    
    const newAnswers = {
      ...userAnswers,
      climate: selectedClimates,
    };
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      await simulateTyping(() => {
        addMessage(questions[currentQuestionIndex + 1].text, true, "questions");
      });
    } else {
      await generateRecommendations(newAnswers);
    }
  }, [selectedClimates, userAnswers, currentQuestionIndex, addMessage, simulateTyping, generateRecommendations]);

  const handleSendMessage = useCallback(async () => {
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
  }, [inputValue, addMessage, chatState, websiteData, recommendations, userAnswers]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSendReport = useCallback(async () => {
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
          userName: email.split('@')[0],
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReportSent(true);
        addMessage("Great! Your personalized travel report has been sent to your email. Check your inbox (and spam folder) for the PDF attachment. You can continue chatting to explore more destinations or ask any questions!", true);
        setTimeout(() => {
          setShowEmailSection(false);
        }, 5000);
      } else {
        throw new Error(data.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      addMessage(`Sorry, there was an issue sending your report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`, true);
    }
  }, [email, recommendations, userAnswers, websiteData, addMessage]);

  const quickActions = useMemo(() => [
    { text: "Compare destinations", icon: "🔄", short: "Compare" },
    { text: "Budget breakdown", icon: "💰", short: "Budget" }, 
    { text: "Best time to visit", icon: "📅", short: "Best time" },
    { text: "Creator opportunities", icon: "🎯", short: "Creator" }
  ], []);

  return (
    <div className="flex h-[calc(100vh-40px)] lg:h-[calc(100vh-48px)] bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Mobile Sidebar Dialog */}
      <div className="lg:hidden">
        <Dialog open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
          <DialogContent className="p-0 max-w-none w-64 h-full rounded-none inset-y-0 left-0 translate-x-0 translate-y-0 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full">
            <SidebarContent
              chatState={chatState}
              currentQuestionIndex={currentQuestionIndex}
              questions={questions}
              messages={messages}
              websiteData={websiteData}
              tasteProfile={tasteProfile}
              reportSent={reportSent}
              email={email}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              setShowEmailSection={setShowEmailSection}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-60 xl:w-64 bg-card/60 backdrop-blur-lg border-r border-border/40 shadow-lg h-full">
        <SidebarContent
          chatState={chatState}
          currentQuestionIndex={currentQuestionIndex}
          questions={questions}
          messages={messages}
          websiteData={websiteData}
          tasteProfile={tasteProfile}
          reportSent={reportSent}
          email={email}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          setShowEmailSection={setShowEmailSection}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-background/50 to-muted/20 overscroll-contain" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="max-w-none lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-3 lg:py-4 xl:py-6">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <div
                    className={`flex items-start gap-2 sm:gap-3 animate-fade-in ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {message.isBot && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm mt-1">
                        <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                      </div>
                    )}

                    <div className={`group relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] xl:max-w-[65%]`}>
                      <div
                        className={`
                          px-3 py-2 sm:px-4 sm:py-3 shadow-sm transition-all duration-150 hover:shadow-md
                          ${message.isBot
                            ? "bg-card border border-border/50 rounded-2xl rounded-bl-md text-foreground"
                            : "bg-gradient-to-br from-primary to-primary/90 rounded-2xl rounded-br-md text-primary-foreground shadow-primary/20"
                          }
                        `}
                      >
                        {message.isBot && (
                          <div className="flex items-center gap-1.5 mb-2 opacity-60">
                            <Wand2 className="h-3 w-3" />
                            <span className="text-xs font-medium">AI Assistant</span>
                          </div>
                        )}
                        
                        <div className="text-sm leading-relaxed">
                          {renderMarkdown(message.text)}
                        </div>
                      </div>
                      
                      <div className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        message.isBot ? "text-left ml-1" : "text-right mr-1"
                      }`}>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!message.isBot && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary/80 to-primary border border-primary/30 flex items-center justify-center shadow-sm mt-1">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
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
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500 ease-out relative"
                              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
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
                      <div className="mt-3 sm:mt-4 w-full">
                        {recommendations?.recommendations?.length > 0 && (
                          <>
                            <div className="flex flex-col gap-1 sm:gap-2 mb-3 sm:mb-4">
                              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                Your Travel Recommendations
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Swipe to explore • {recommendations.recommendations.length} destinations curated for you
                              </p>
                            </div>
                            
                            {/* Mobile/Tablet Cards */}
                            <div className="lg:hidden">
                              <Swiper
                                modules={[Pagination]}
                                spaceBetween={16}
                                slidesPerView={1.1}
                                pagination={{ clickable: true, dynamicBullets: true }}
                                breakpoints={{
                                  480: { slidesPerView: 1.25 },
                                  640: { slidesPerView: 1.5 },
                                }}
                                className="w-full pb-6"
                              >
                                {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                                  <SwiperSlide key={i} className="!w-auto">
                                    <DestinationCard rec={rec} rank={i + 1} />
                                  </SwiperSlide>
                                ))}
                              </Swiper>
                            </div>

                            {/* Desktop Grid */}
                            <div className="hidden lg:block">
                              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
                                {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                                  <div
                                    key={i}
                                    className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                  >
                                    <div className="relative overflow-hidden h-40 xl:h-48">
                                      {rec.image && (
                                        <Image 
                                          src={rec.image} 
                                          alt={rec.destination}
                                          width={400}
                                          height={192}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                      <div className="absolute top-3 right-3">
                                        <span className="bg-white/90 backdrop-blur-sm text-primary text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                          #{i + 1}
                                        </span>
                                      </div>
                                      <div className="absolute bottom-3 left-3 right-3">
                                        <h4 className="font-bold text-lg xl:text-xl text-white drop-shadow-lg">
                                          {rec.destination}
                                        </h4>
                                      </div>
                                    </div>
                                    
                                    <div className="p-4 xl:p-6 space-y-4">
                                      {rec.highlights && rec.highlights.length > 0 && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {rec.highlights.slice(0, 3).join(' • ')}
                                        </p>
                                      )}
                                      
                                      <div className="grid grid-cols-2 gap-3 text-sm">
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

                                      {rec.creatorDetails && (
                                        <div className="p-3 xl:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                          <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-primary">
                                              🎯 Creator Community
                                            </span>
                                            <span className="text-sm font-semibold text-muted-foreground">
                                              {rec.creatorDetails.totalActiveCreators}+ Active
                                            </span>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            {rec.creatorDetails.topCreators.slice(0, 2).map((creator, idx) => (
                                              <div key={idx} className="bg-background/60 p-2 xl:p-3 rounded-lg text-sm">
                                                <div className="font-semibold text-foreground">{creator.name}</div>
                                                <div className="text-xs text-muted-foreground">{creator.niche}</div>
                                                <div className="text-primary font-medium mt-1">{creator.collaboration}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {rec.tags && rec.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {rec.tags.slice(0, 4).map((tag: string) => (
                                            <span key={tag} className="bg-secondary/80 text-secondary-foreground text-xs px-2 xl:px-3 py-1 rounded-full font-medium">
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
                          </>
                        )}
                      </div>
                    )}
                </React.Fragment>
              ))}

              {isTyping && (
                <div className="flex items-start gap-2 sm:gap-3 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-1">
                    <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border/50 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl rounded-bl-md shadow-sm max-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-2 opacity-60">
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

        {/* Bottom Input Area */}
        <div className="flex-none border-t border-border/50 bg-background/95 backdrop-blur-md">
          <div className="max-w-none xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="py-2 sm:py-3 lg:py-4 space-y-2 sm:space-y-3">
              {chatState === "recommendations" && showEmailSection && (
                <div className="transition-all duration-300 ease-in-out">
                  {!reportSent ? (
                    <div id="email-report-section" className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 shadow-sm">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground leading-tight">
                              Get Travel Report
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                              PDF with all recommendations
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 rounded-full flex-shrink-0"
                          onClick={() => setShowEmailSection(false)}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full h-10 sm:h-11 text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-3 sm:px-4 rounded-lg"
                          type="email"
                        />
                        <Button 
                          onClick={handleSendReport} 
                          disabled={!email || isTyping}
                          className="w-full h-10 sm:h-11 font-medium text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="hidden xs:inline">Send PDF Report</span>
                          <span className="xs:hidden">Send Report</span>
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 text-xs">📄</span>
                          <span className="leading-tight">Complete recommendations & budget breakdown</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-0.5 text-xs">🎯</span>
                          <span className="leading-tight">Creator collaboration insights</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id="email-report-section" className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-emerald-800 leading-tight">
                              Report Sent!
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5 leading-tight truncate">
                              Check {email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-emerald-500/10 flex-shrink-0 rounded-full"
                          onClick={() => setShowEmailSection(false)}
                        >
                          <X className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
                
              <div className="bg-background/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-border/30">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block flex-shrink-0" />
                  <div className="relative flex-1">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        chatState === "initial" ? "Ask me anything about travel..." :
                        chatState === "analyzing" ? "Processing your website..." :
                        chatState === "confirmation" ? "Ask about the extracted information..." :
                        chatState === "profiling" ? "Creating your taste profile..." :
                        chatState === "questions" ? "Ask about travel preferences..." :
                        chatState === "generating" ? "Generating recommendations..." :
                        reportSent ? "Ask another question..." : "Ask about recommendations..."
                      }
                      className="w-full pr-10 sm:pr-12 h-10 sm:h-11 text-sm bg-background border-border/50 focus:border-primary/50 px-3 sm:px-4 rounded-lg"
                      disabled={isTyping || chatState === "analyzing" || chatState === "profiling" || chatState === "generating"}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping || chatState === "analyzing" || chatState === "profiling" || chatState === "generating"}
                      size="icon"
                      className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 bg-primary hover:bg-primary/90 rounded-md"
                    >
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                  
                {chatState === "recommendations" && (
                  <div className="mt-2.5 sm:mt-3">
                    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-2.5 sm:-mx-3 px-2.5 sm:px-3 scrollbar-hide">
                      {quickActions.map((action) => (
                        <Button
                          key={action.text}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 h-7 sm:h-8 border-border/50 hover:bg-primary/10 hover:border-primary/30 flex-shrink-0 whitespace-nowrap rounded-full"
                          onClick={() => {
                            setInputValue(action.text);
                            setTimeout(() => handleSendMessage(), 0);
                          }}
                          disabled={isTyping}
                        >
                          <span className="mr-1">{action.icon}</span>
                          <span className="hidden xs:inline">{action.text}</span>
                          <span className="xs:hidden">{action.short}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;