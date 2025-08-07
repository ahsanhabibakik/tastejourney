"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Wand2, X, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Swiper, SwiperSlide } from "./TravelSwiper";
import { Pagination } from "swiper/modules";
import TypingIndicator from "./TypingIndicator";
import URLForm from "./URLForm";
import ConfirmationScreen from "./ConfirmationScreen";
import DestinationCard from "./DestinationCard";
import SidebarContent from "./SidebarContent";
import { DynamicQuestionFlow } from "./DynamicQuestionFlow";
import { DynamicQuestionV2 } from "@/services/dynamic-questions-v2";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  component?: "url-form" | "confirmation" | "questions" | "recommendations" | "dynamic-questions";
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
      return <span key={key++}>{`[${match[2]}](${match[3]})`}</span>;
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
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
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
  }, [messages, scrollToBottom]);

  const addMessage = useCallback(
    (text: string, isBot: boolean, component?: Message["component"]) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        isBot,
        timestamp: new Date(),
        component,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const simulateTyping = useCallback(async (callback: () => void, duration = 2000) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    setIsTyping(false);
    callback();
  }, []);

  const handleURLSubmit = useCallback(async (url: string) => {
    addMessage(url, false);
    setChatState("analyzing");

    await simulateTyping(() => {
      addMessage(
        "Great! I'm analyzing your website to understand your content themes and audience. This will help me recommend destinations perfect for your content creation needs...",
        true
      );
    });

    // Simulate website analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock website data with more realistic information
    const mockData = {
      url,
      themes: ["travel", "photography", "lifestyle", "adventure"],
      hints: ["blogger", "photographer", "content creator", "influencer"],
      contentType: "Travel & Photography",
      socialLinks: [
        { platform: "Instagram", url: "@travelcreator" },
        { platform: "YouTube", url: "TravelCreatorChannel" },
      ],
      title: "Travel Content Creator",
      description: "Sharing adventures and travel photography from around the world",
      keywords: ["travel", "photography", "adventure", "lifestyle"],
      images: ["/sample1.jpg", "/sample2.jpg"],
      videoLinks: ["youtube.com/sample"],
      language: "English",
      location: "Global",
      brands: ["GoPro", "Adobe", "Tourism Boards"],
      collaborations: ["Hotels", "Airlines", "Tourism Agencies"],
      regionBias: ["Asia", "Europe", "Americas"],
      extractedAt: new Date().toISOString(),
      scrapingMethods: ["Direct fetch", "AI analysis"],
      fallbackUsed: false,
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
          await simulateTyping(() => {
            addMessage(
              `Perfect! I've created your taste profile based on your ${websiteData.contentType} content. Now I'll ask you a few personalized questions to optimize your recommendations. Each question will adapt based on your previous answers:`,
              true
            );
            addMessage("Let's start with your travel preferences:", true, "dynamic-questions");
          }, 2000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error creating taste profile:", error);
        
        // Continue with questions anyway
        setChatState("questions");
        await simulateTyping(() => {
          addMessage(
            "Great! Now let me ask you a few personalized questions to create the best recommendations:",
            true
          );
          addMessage("Let's start with your travel preferences:", true, "dynamic-questions");
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

  const handleQuestionsComplete = useCallback(async (answers: UserAnswers) => {
    setUserAnswers(answers);
    addMessage("Thanks for answering all the questions!", false);
    
    await generateRecommendations(answers);
  }, []);

  const handleQuestionChange = useCallback((question: DynamicQuestionV2, questionNumber: number) => {
    setCurrentQuestionNumber(questionNumber);
    console.log(`Question ${questionNumber}: ${question.text}`);
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
          userPreferences: finalAnswers,
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
          "I've prepared some great recommendations for you based on your profile:",
          true,
          "recommendations"
        );
      }, 2000);
    }
  }, [addMessage, simulateTyping, tasteProfile, websiteData]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage(userMessage, false);

    // Handle conversation after recommendations
    if (chatState === "recommendations" && recommendations) {
      setIsTyping(true);
      
      try {
        const response = await fetch("/api/gemini-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            context: {
              state: chatState,
              websiteData,
              recommendations: recommendations.recommendations,
              userAnswers,
            },
          }),
        });

        const data = await response.json();
        setIsTyping(false);

        if (data.success) {
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
    <div className="flex h-full bg-background">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border/40 shadow-2xl animate-slide-in-left">
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 hover:bg-background border border-border/50"
                onClick={() => setShowMobileSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <SidebarContent
              chatState={chatState}
              currentQuestionIndex={currentQuestionNumber - 1}
              questions={[]}
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
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 pb-24">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                {message.isBot && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                )}
                <div
                  className={`flex-1 max-w-[85%] sm:max-w-[80%] ${
                    message.isBot ? "" : "flex justify-end"
                  }`}
                >
                  {message.component === "url-form" && message.isBot ? (
                    <URLForm onSubmit={handleURLSubmit} />
                  ) : message.component === "confirmation" && message.isBot ? (
                    <ConfirmationScreen
                      data={websiteData!}
                      onConfirm={handleDataConfirmation}
                    />
                  ) : message.component === "dynamic-questions" && message.isBot && websiteData ? (
                    <DynamicQuestionFlow
                      websiteData={websiteData}
                      onComplete={handleQuestionsComplete}
                      onQuestionChange={handleQuestionChange}
                    />
                  ) : message.component === "recommendations" && message.isBot ? (
                    <div className="space-y-4">
                      {recommendations?.recommendations && (
                        <>
                          <Swiper
                            modules={[Pagination]}
                            spaceBetween={20}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            className="w-full"
                            breakpoints={{
                              640: { slidesPerView: 2, spaceBetween: 20 },
                              1024: { slidesPerView: 3, spaceBetween: 30 },
                            }}
                          >
                            {recommendations.recommendations.map((rec, index) => (
                              <SwiperSlide key={index}>
                                <DestinationCard rec={rec} rank={index + 1} />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                          
                          {showEmailSection && (
                            <div className="bg-primary/5 rounded-lg p-4 sm:p-6 border border-primary/20">
                              <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-primary mt-1" />
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <h3 className="font-semibold">Get Your Detailed Report</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Receive a comprehensive PDF report with all recommendations, budget breakdowns, and creator insights.
                                    </p>
                                  </div>
                                  {!reportSent ? (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button onClick={handleSendReport} disabled={!email}>
                                        Send Report
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <CheckCircle2 className="w-5 h-5" />
                                      <span className="text-sm font-medium">Report sent successfully!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-sm sm:text-base ${
                        message.isBot
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {renderMarkdown(message.text)}
                      </div>
                    </div>
                  )}
                </div>
                {!message.isBot && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="bg-muted px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {chatState === "recommendations" && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/95 p-2 sm:p-4">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Quick Actions */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs sm:text-sm"
                    onClick={() => setInputValue(action.text)}
                  >
                    <span className="mr-1.5">{action.icon}</span>
                    <span className="hidden sm:inline">{action.text}</span>
                    <span className="sm:hidden">{action.short}</span>
                  </Button>
                ))}
              </div>

              {/* Input Field */}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about destinations, budgets, or creator opportunities..."
                  className="flex-1 text-sm sm:text-base"
                />
                <Button onClick={handleSendMessage} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;