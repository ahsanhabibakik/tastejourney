"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, Bot, User, Wand2 } from "lucide-react";
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
  climate?: string;
  [key: string]: string | undefined;
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
}

const questions = [
  {
    id: "budget",
    text: "💸 What's your budget range for this trip?",
    options: ["$500-1000", "$1000-2500", "$2500-5000", "$5000+"],
    icon: "💸",
  },
  {
    id: "duration",
    text: "🗓️ How long would you like to travel?",
    options: ["1-3 days", "4-7 days", "1-2 weeks", "2+ weeks"],
    icon: "🗓️",
  },
  {
    id: "style",
    text: "🌍 What's your preferred travel style?",
    options: ["Adventure", "Luxury", "Cultural", "Beach", "Urban"],
    icon: "🌍",
  },
  {
    id: "contentFocus",
    text: "📸 What type of content do you focus on?",
    options: ["Photography", "Food", "Lifestyle", "Adventure"],
    icon: "📸",
  },
  {
    id: "climate",
    text: "☀️ Do you have any preferred or avoided climates/regions?",
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

  const handleQuestionAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
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
              climate: finalAnswers.climate || "No preference",
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
    <div className="flex flex-col h-[calc(100vh-73px)] bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Enhanced Chat Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                AI Travel Companion
                <Sparkles className="h-4 w-4 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground">
                {chatState === "initial" && "Ready to analyze your website"}
                {chatState === "analyzing" && "Analyzing your content..."}
                {chatState === "confirmation" && "Reviewing extracted data"}
                {chatState === "profiling" && "Building your taste profile..."}
                {chatState === "questions" && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                {chatState === "generating" && "Generating recommendations..."}
                {chatState === "recommendations" && "Recommendations ready!"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                <MessageSquare className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 animate-fade-in ${
                  message.isBot ? "justify-start" : "justify-end flex-row-reverse"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isBot 
                    ? "bg-primary/10 border-2 border-primary/20" 
                    : "bg-muted border-2 border-border"
                }`}>
                  {message.isBot ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`group relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]`}>
                  <div
                    className={`
                      px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
                      ${message.isBot
                        ? "bg-card border border-border/50 hover:border-border"
                        : "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                      }
                    `}
                  >
                    {message.isBot && (
                      <div className="flex items-center gap-2 mb-2 opacity-70">
                        <Wand2 className="h-3 w-3" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">
                      {message.text}
                    </p>
                  </div>
                  
                  {/* Timestamp on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

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
                            const isSelected = userAnswers[questions[currentQuestionIndex].id] === option;
                            return (
                              <Button
                                key={index}
                                variant={isSelected ? "default" : "outline"}
                                className={`w-full justify-start text-left p-4 h-auto transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" 
                                    : "hover:bg-muted/50 hover:border-primary/30"
                                }`}
                                onClick={() => handleQuestionAnswer(option)}
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected 
                                      ? "border-primary-foreground bg-primary-foreground" 
                                      : "border-muted-foreground"
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                  </div>
                                  <span className="font-medium">{option}</span>
                                </div>
                              </Button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}


                {message.component === "recommendations" &&
                  chatState === "recommendations" && recommendations?.recommendations && (
                    <div className="mt-4 w-full">
                      <h3 className="text-lg font-semibold mb-4">
                        Your Recommended Destinations
                      </h3>
                      
                      {/* Responsive Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                          <div
                            key={i}
                            className="bg-card border border-border rounded-lg overflow-hidden"
                          >
                            {rec.image && (
                              <Image 
                                src={rec.image} 
                                alt={rec.destination}
                                width={400}
                                height={160}
                                className="w-full h-40 object-cover" 
                              />
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-base mb-2">
                                {rec.destination}
                              </h4>
                              
                              {rec.highlights && rec.highlights.length > 0 && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {rec.highlights.join(', ')}
                                </p>
                              )}
                              
                              <div className="space-y-1 text-sm">
                                {rec.budget?.range && (
                                  <div>
                                    <span className="font-medium">Budget:</span> {rec.budget.range}
                                  </div>
                                )}
                                {rec.bestMonths && rec.bestMonths.length > 0 && (
                                  <div>
                                    <span className="font-medium">Best Time:</span> {rec.bestMonths.join(', ')}
                                  </div>
                                )}
                                {rec.engagement?.potential && (
                                  <div>
                                    <span className="font-medium">Engagement:</span> {rec.engagement.potential}
                                  </div>
                                )}
                              </div>
                              
                              {rec.tags && rec.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {rec.tags.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
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

      {/* Enhanced Bottom Input Area */}
      {chatState === "recommendations" && (
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {!reportSent ? (
              <div className="py-6 space-y-6">
                {/* Enhanced PDF Report Section */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📧</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-base mb-1 text-foreground">
                          Get Your Detailed PDF Report
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive analysis with cost breakdowns, contacts & guides
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full sm:w-64 h-11"
                        type="email"
                      />
                      <Button 
                        onClick={handleSendReport} 
                        disabled={!email}
                        className="h-11 px-6 font-medium"
                      >
                        Send Report
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Chat Input */}
                <div className="relative group">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about these recommendations..."
                    className="w-full pr-14 h-12 text-base border-2 transition-all duration-200 focus:border-primary/50 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 transition-all duration-200 hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "More destinations",
                    "Budget breakdown", 
                    "Collaboration tips",
                    "Best travel times"
                  ].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="text-xs hover:bg-primary/10 hover:border-primary/30"
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
            ) : (
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl shadow-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">
                      Report Successfully Sent!
                    </p>
                    <p className="text-xs text-green-600">
                      Check your email (and spam folder) for the PDF
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
