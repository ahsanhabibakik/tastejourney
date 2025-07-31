"use client";


import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
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
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`
                    max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]
                    px-4 py-3 rounded-xl
                    ${message.isBot
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed">
                    {message.text}
                  </p>

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
                    <div className="mt-4 w-full">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {currentQuestionIndex + 1}/{questions.length}
                        </span>
                      </div>
                      
                      {/* Current Question */}
                      <div className="bg-background border border-border rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {questions[currentQuestionIndex].icon}
                          </span>
                          <h3 className="font-medium text-base">
                            {questions[currentQuestionIndex].text}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Options */}
                      <div className="space-y-2">
                        {questions[currentQuestionIndex].options.map(
                          (option, index) => (
                            <Button
                              key={index}
                              variant={userAnswers[questions[currentQuestionIndex].id] === option ? "default" : "outline"}
                              className="w-full justify-start text-left"
                              onClick={() => handleQuestionAnswer(option)}
                            >
                              {option}
                            </Button>
                          )
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
              <div className="flex justify-start">
                <div className="max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] px-4 py-3 rounded-xl bg-muted">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      {chatState === "recommendations" && (
        <div className="border-t bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {!reportSent ? (
              <div className="py-4 space-y-4">
                {/* PDF Report Section */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">
                        Get PDF Report
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Receive detailed analysis via email
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Your email"
                        className="w-full sm:w-48"
                        type="email"
                      />
                      <Button 
                        onClick={handleSendReport} 
                        disabled={!email}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about these recommendations..."
                    className="w-full pr-12"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg">
                  <span>✅</span>
                  <span className="text-sm font-medium">
                    Report sent! Check your email.
                  </span>
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
