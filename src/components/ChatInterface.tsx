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
    text: "What's your budget range for this trip?",
    options: ["$500-1000", "$1000-2500", "$2500-5000", "$5000+"],
    icon: "💸",
    multiSelect: false,
  },
  {
    id: "duration",
    text: "How long would you like to travel?",
    options: ["1-3 days", "4-7 days", "1-2 weeks", "2+ weeks"],
    icon: "🗓️",
    multiSelect: false,
  },
  {
    id: "style",
    text: "What's your preferred travel style?",
    options: ["Adventure", "Luxury", "Cultural", "Beach", "Urban"],
    icon: "🌍",
    multiSelect: false,
  },
  {
    id: "contentFocus",
    text: "What type of content do you focus on?",
    options: ["Photography", "Food", "Lifestyle", "Adventure"],
    icon: "📸",
    multiSelect: false,
  },
  {
    id: "climate",
    text: "Select all climate preferences that apply (you can choose multiple):",
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedClimates, setSelectedClimates] = useState<string[]>([]);

  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

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


  // Handle ESC key for closing mobile sidebar
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [showMobileSidebar, setShowMobileSidebar]);


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
          
          // Load dynamic questions based on user context
          console.log('🧠 QUESTIONS: Loading dynamic questions for user...');
          try {
            const userContext = {
              themes: websiteData.themes,
              contentType: websiteData.contentType,
              hints: websiteData.hints,
              socialLinks: websiteData.socialLinks,
              audienceLocation: websiteData.location || 'Global',
              previousAnswers: {}
            };
            
            const questions = await dynamicQuestionService.generateQuestionsForUser(userContext);
            setDynamicQuestions(questions);
            setQuestionsLoaded(true);
            console.log(`✅ QUESTIONS: Loaded ${questions.length} dynamic questions`);
            
            setChatState("questions");
            setCurrentQuestionIndex(0);
            await simulateTyping(() => {
              addMessage(
                `Perfect! I've created your taste profile based on your ${websiteData.contentType} content. Now I'll ask you smart questions that adapt to your answers:`,
                true
              );
              addMessage("Let's start with your budget-aware travel planning:", true, "questions");
            }, 2000);
          } catch (questionError) {
            console.error("Error loading dynamic questions:", questionError);
            // Fallback to basic questions
            const fallbackQuestions = await dynamicQuestionService.generateQuestionsForUser({
              themes: ['travel'],
              contentType: 'Mixed',
              hints: [],
              socialLinks: [],
              audienceLocation: 'Global'
            });
            setDynamicQuestions(fallbackQuestions);
            setQuestionsLoaded(true);
            
            setChatState("questions");
            setCurrentQuestionIndex(0);
            await simulateTyping(() => {
              addMessage(
                "Perfect! I've created your taste profile. Now I'll ask you smart questions that adapt to your budget and preferences:",
                true
              );
              addMessage("Let's start with your travel planning:", true, "questions");
            }, 2000);
          }
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error creating taste profile:", error);
        
        // Load fallback questions even when taste profiling fails
        try {
          const fallbackQuestions = await dynamicQuestionService.generateQuestionsForUser({
            themes: websiteData?.themes || ['travel'],
            contentType: websiteData?.contentType || 'Mixed',
            hints: websiteData?.hints || [],
            socialLinks: websiteData?.socialLinks || [],
            audienceLocation: 'Global'
          });
          setDynamicQuestions(fallbackQuestions);
          setQuestionsLoaded(true);
          
          setChatState("questions");
          setCurrentQuestionIndex(0);
          await simulateTyping(() => {
            addMessage(
              "Great! Now let me ask you smart questions that adapt to your preferences:",
              true
            );
            addMessage("Let's start with your travel planning:", true, "questions");
          }, 1500);
        } catch (fallbackError) {
          console.error("Error loading fallback questions:", fallbackError);
          setChatState("questions");
          setQuestionsLoaded(false);
        }
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

  const handleQuestionChange = useCallback((question: DynamicQuestionV2, questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1); // Convert to 0-based index
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
      
      // Set fallback recommendations data
      const fallbackRecommendations = {
        recommendations: [
          {
            id: 1,
            destination: "Bali, Indonesia",
            country: "Indonesia",
            matchScore: 92,
            image: "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400",
            highlights: [
              "Perfect for adventure & cultural content creation",
              "180+ active travel creators in region",
              "25+ brand partnerships opportunities available"
            ],
            budget: {
              range: "$1,200 - $1,800 for 7 days",
              breakdown: "Accommodation: $60-80/night • Food: $20-30/day • Activities: $40-60/day",
              costEfficiency: "Excellent value for content creation ROI"
            },
            engagement: {
              potential: "Very High",
              reason: "Strong alignment with adventure & cultural content preferences"
            },
            creatorDetails: {
              totalActiveCreators: 182,
              topCreators: [
                { name: "BaliBound", followers: "85K", niche: "Adventure Travel", collaboration: "Content partnerships available" }
              ],
              collaborationOpportunities: ["Creator meetups monthly", "Brand partnerships", "Cultural exchange programs"],
              brandPartnerships: [
                { brand: "Bali Tourism Board", type: "Content Partnership", status: "Available" },
                { brand: "Indonesian Hotels", type: "Sponsored Content", status: "Active" },
                { brand: "Adventure Gear Co", type: "Product Placement", status: "Available" }
              ]
            },
            tags: ["adventure", "culture", "budget-friendly", "instagram-worthy", "food", "beach", "spiritual"],
            bestMonths: ["April-May", "September-October"]
          },
          {
            id: 2,
            destination: "Lisbon, Portugal",
            country: "Portugal",
            matchScore: 88,
            image: "https://images.pexels.com/photos/1534630/pexels-photo-1534630.jpeg?auto=compress&cs=tinysrgb&w=400",
            highlights: [
              "Emerging creative hub with vibrant arts scene",
              "120+ digital nomads & content creators",
              "Affordable European base for creators"
            ],
            budget: {
              range: "$1,500 - $2,200 for 7 days",
              breakdown: "Accommodation: $70-100/night • Food: $25-35/day • Activities: $30-50/day",
              costEfficiency: "Best value in Western Europe"
            },
            engagement: {
              potential: "High",
              reason: "Perfect for European travel content and cultural exploration"
            },
            creatorDetails: {
              totalActiveCreators: 125,
              topCreators: [
                { name: "LisbonLens", followers: "62K", niche: "City Photography", collaboration: "Co-working spaces available" }
              ],
              collaborationOpportunities: ["Creator co-working spaces", "Photography walks", "Food tour collaborations"],
              brandPartnerships: [
                { brand: "Visit Portugal", type: "Tourism Campaign", status: "Available" },
                { brand: "Portuguese Wines", type: "Tasting Events", status: "Active" },
                { brand: "Nomad Co-working", type: "Space Partnership", status: "Available" }
              ]
            },
            tags: ["europe", "culture", "architecture", "food", "coastal", "budget-friendly", "digital-nomad"],
            bestMonths: ["May-June", "September-October"]
          },
          {
            id: 3,
            destination: "Dubai, UAE",
            country: "United Arab Emirates",
            matchScore: 85,
            image: "https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400",
            highlights: [
              "Ultimate luxury content creation destination",
              "200+ influencers & brand partnerships",
              "Year-round content opportunities"
            ],
            budget: {
              range: "$2,500 - $4,000 for 7 days",
              breakdown: "Accommodation: $150-250/night • Food: $50-80/day • Activities: $80-150/day",
              costEfficiency: "High investment, high return potential"
            },
            engagement: {
              potential: "Exceptional",
              reason: "Perfect for luxury lifestyle and aspirational content"
            },
            creatorDetails: {
              totalActiveCreators: 210,
              topCreators: [
                { name: "DubaiDreams", followers: "125K", niche: "Luxury Travel", collaboration: "Hotel partnerships available" }
              ],
              collaborationOpportunities: ["Luxury brand events", "Hotel partnerships", "Desert experiences"],
              brandPartnerships: [
                { brand: "Dubai Tourism", type: "Luxury Campaign", status: "Available" },
                { brand: "Emirates Airlines", type: "Travel Partnership", status: "Active" },
                { brand: "Luxury Hotels Group", type: "Accommodation Deal", status: "Premium" },
                { brand: "Desert Safari Co", type: "Experience Package", status: "Available" }
              ]
            },
            tags: ["luxury", "modern", "desert", "shopping", "architecture", "year-round", "instagram"],
            bestMonths: ["November-March"]
          }
        ],
        totalCount: 3,
        metadata: {
          fallback: true,
          processingTime: Date.now(),
          apiVersion: 'fallback-v1',
          message: 'Using cached recommendations due to temporary service issue'
        }
      };
      
      setRecommendations(fallbackRecommendations);
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

  const handleSmartQuestionsComplete = useCallback(async (answers: Record<string, any>) => {
    setUserAnswers(answers);
    addMessage("Thanks for answering all the questions! Your answers will help me create perfect recommendations.", false);
    
    console.log('🎯 Smart questions completed with answers:', answers);
    await generateRecommendations(answers);
  }, [generateRecommendations, addMessage]);

  const handleQuestionAnswer = useCallback(async (answer: string) => {
    if (!questionsLoaded || dynamicQuestions.length === 0) {
      console.error('Questions not loaded yet');
      return;
    }
    
    const currentQuestion = dynamicQuestions[currentQuestionIndex];
    
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

    // Check if there are more questions
    if (currentQuestionIndex < dynamicQuestions.length - 1) {
      // Get next question using dynamic question service
      const nextQuestion = await dynamicQuestionService.getNextQuestion(
        dynamicQuestions.slice(currentQuestionIndex + 1),
        newAnswers
      );
      
      if (nextQuestion) {
        setCurrentQuestionIndex((prev) => prev + 1);
        await simulateTyping(() => {
          addMessage(nextQuestion.text, true, "questions");
        });
      } else {
        // No more relevant questions, generate recommendations
        await generateRecommendations(newAnswers);
      }
    } else {
      await generateRecommendations(newAnswers);
    }
  }, [currentQuestionIndex, userAnswers, addMessage, simulateTyping, handleClimateSelection, generateRecommendations, questionsLoaded, dynamicQuestions]);

  const handleClimateConfirm = useCallback(async () => {
    if (selectedClimates.length === 0 || !questionsLoaded || dynamicQuestions.length === 0) return;
    
    const climateAnswerText = selectedClimates.join(", ");
    addMessage(climateAnswerText, false);
    
    const newAnswers = {
      ...userAnswers,
      climate: selectedClimates,
    };
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < dynamicQuestions.length - 1) {
      const nextQuestion = await dynamicQuestionService.getNextQuestion(
        dynamicQuestions.slice(currentQuestionIndex + 1),
        newAnswers
      );
      
      if (nextQuestion) {
        setCurrentQuestionIndex((prev) => prev + 1);
        await simulateTyping(() => {
          addMessage(nextQuestion.text, true, "questions");
        });
      } else {
        await generateRecommendations(newAnswers);
      }
    } else {
      await generateRecommendations(newAnswers);
    }
  }, [selectedClimates, userAnswers, currentQuestionIndex, addMessage, simulateTyping, generateRecommendations, questionsLoaded, dynamicQuestions]);


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
    <div className="flex h-full bg-background">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border/40 shadow-2xl animate-slide-in-left">
            {/* Close Button */}
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
              currentQuestionIndex={currentQuestionIndex}

              questions={questionsLoaded ? dynamicQuestions : []}

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
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-card/60 backdrop-blur-lg border-r border-border/40 shadow-lg h-full flex-shrink-0">
        <SidebarContent
          chatState={chatState}
          currentQuestionIndex={currentQuestionIndex}

          questions={questionsLoaded ? dynamicQuestions : []}

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
      <div className="flex flex-col flex-1 max-w-[100vw]">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin overscroll-contain">
          <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <div
                    className={`flex items-start gap-2 sm:gap-3 animate-fade-in ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {message.isBot && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div className={`group relative ${message.isBot ? 'max-w-[90%] sm:max-w-[85%] md:max-w-[80%]' : 'max-w-[85%] sm:max-w-[80%] md:max-w-[70%]'}`}>
                      <div
                        className={`
                          px-4 py-3 shadow-sm transition-all duration-150 hover:shadow-md
                          ${message.isBot
                            ? "bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl rounded-bl-sm text-foreground"
                            : "bg-gradient-to-br from-primary to-primary/90 rounded-2xl rounded-br-sm text-primary-foreground shadow-primary/10"
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 border border-primary/30 flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-white" />
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

                  {message.component === "smart-questions" && message.isBot && websiteData ? (
                    <SmartQuestionFlow
                      websiteData={websiteData}
                      onComplete={handleSmartQuestionsComplete}
                    />
                  ) : message.component === "questions" &&
                    chatState === "questions" && (
                      <div>
                        {questionsLoaded && dynamicQuestions.length > 0 ? (
                        <div className="mt-6 w-full animate-slide-up">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500 ease-out relative"
                                style={{ width: `${((currentQuestionIndex + 1) / dynamicQuestions.length) * 100}%` }}
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
                                {dynamicQuestions.length}
                              </span>
                            </div>
                          </div>
                        
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-6 shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-2xl">
                                  {dynamicQuestions[currentQuestionIndex]?.icon || '❓'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-foreground mb-1">
                                  {dynamicQuestions[currentQuestionIndex]?.text || 'Loading question...'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {dynamicQuestions[currentQuestionIndex]?.multiSelect 
                                    ? 'You can choose multiple options'
                                    : 'Choose the option that best describes your preference'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        
                          <div className="grid gap-3">
                            {dynamicQuestions[currentQuestionIndex]?.options?.map(
                              (option: string, index: number) => {
                                const currentQuestion = dynamicQuestions[currentQuestionIndex];
                                const isMultiSelect = currentQuestion?.multiSelect;
                                const isSelected = isMultiSelect 
                                  ? selectedClimates.includes(option)
                                  : userAnswers[currentQuestion?.id] === option;
                                
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
                            ) || <div className="text-center text-muted-foreground">Loading options...</div>}
                            
                            {dynamicQuestions[currentQuestionIndex]?.multiSelect && selectedClimates.length > 0 && (
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
                      ) : (
                        <div className="mt-6 w-full animate-slide-up text-center">
                          <div className="bg-muted/30 rounded-xl p-6">
                            <div className="text-muted-foreground mb-2">Loading personalized questions...</div>
                          </div>
                        </div>
                      )}
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
                              <div className="grid grid-cols-3 gap-6">
                                {recommendations.recommendations.map((rec: Recommendation, i: number) => (
                                  <div
                                    key={i}
                                    className="group bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                                  >
                                    <div className="relative overflow-hidden h-48">
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
                                    
                                    <div className="p-4 space-y-3">
                                      {rec.highlights && rec.highlights.length > 0 && (
                                        <div className="space-y-1">
                                          {rec.highlights.slice(0, 3).map((highlight, idx) => (
                                            <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                              <span className="text-primary mt-0.5">•</span>
                                              <span className="leading-relaxed">{highlight}</span>
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                      
                                      <div className="space-y-2">
                                        {rec.budget?.range && (
                                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                            <span className="text-base">💰</span>
                                            <div className="flex-1">
                                              <p className="text-xs text-muted-foreground">Budget</p>
                                              <p className="text-sm font-medium">{rec.budget.range}</p>
                                            </div>
                                          </div>
                                        )}
                                        {rec.engagement?.potential && (
                                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                            <span className="text-base">📈</span>
                                            <div className="flex-1">
                                              <p className="text-xs text-muted-foreground">Engagement</p>
                                              <p className="text-sm font-medium">{rec.engagement.potential}</p>
                                            </div>
                                          </div>
                                        )}
                                        {rec.bestMonths && rec.bestMonths.length > 0 && (
                                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                            <span className="text-base">📅</span>
                                            <div className="flex-1">
                                              <p className="text-xs text-muted-foreground">Best Time</p>
                                              <p className="text-sm font-medium">{rec.bestMonths.join(', ')}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {rec.creatorDetails && (
                                        <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-primary">
                                              🎯 Creator Hub
                                            </span>
                                            <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                              {rec.creatorDetails.totalActiveCreators}+ Active
                                            </span>
                                          </div>
                                          
                                          {rec.creatorDetails.topCreators.slice(0, 1).map((creator, idx) => (
                                            <div key={idx} className="bg-background/60 p-2 rounded-lg">
                                              <div className="text-sm font-semibold text-foreground">{creator.name}</div>
                                              <div className="text-xs text-muted-foreground">{creator.niche} • {creator.followers}</div>
                                            </div>
                                          ))}
                                          
                                          {rec.creatorDetails.collaborationOpportunities && (
                                            <div className="mt-2 pt-2 border-t border-primary/10">
                                              <p className="text-xs text-muted-foreground">Opportunities:</p>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {rec.creatorDetails.collaborationOpportunities.slice(0, 2).map((opp, idx) => (
                                                  <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    {opp}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {rec.tags && rec.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                          {rec.tags.slice(0, 4).map((tag: string) => (
                                            <span key={tag} className="bg-secondary/50 text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
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
                <div className="flex items-start gap-3 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card/90 backdrop-blur-sm border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm max-w-[200px]">
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
        <div className="flex-none bg-background">
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 space-y-3">
              {chatState === "recommendations" && showEmailSection && (
                <div className="transition-all duration-300 ease-in-out">
                  {!reportSent ? (
                    <div id="email-report-section" className="bg-card border border-border/50 rounded-xl p-4 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base text-foreground">
                              Get Your Travel Report
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Detailed PDF with all recommendations
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
                          className="w-full h-11 text-[15px] bg-background border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 px-4 rounded-lg transition-all"
                          type="email"
                        />
                        <Button 
                          onClick={handleSendReport} 
                          disabled={!email || isTyping}
                          className="w-full h-11 font-medium text-[15px] bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all rounded-lg"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="hidden xs:inline">Send PDF Report</span>
                          <span className="xs:hidden">Send Report</span>
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-base">📄</span>
                          <span>Complete recommendations & budget breakdown</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-base">🎯</span>
                          <span>Creator collaboration insights</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id="email-report-section" className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-4 transition-all duration-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-base text-emerald-800">
                              Report Sent Successfully!
                            </p>
                            <p className="text-sm text-emerald-600 mt-0.5 truncate">
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
                
              <div className="relative flex items-center gap-2">
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
                  className="w-full pr-12 h-12 text-[15px] bg-card border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 px-4 rounded-xl transition-all"
                  disabled={isTyping || chatState === "analyzing" || chatState === "profiling" || chatState === "generating"}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || chatState === "analyzing" || chatState === "profiling" || chatState === "generating"}
                  size="icon"
                  className="absolute right-2 h-8 w-8 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
                  
                {chatState === "recommendations" && (
                  <div className="mt-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {quickActions.map((action) => (
                        <Button
                          key={action.text}
                          variant="outline"
                          size="sm"
                          className="text-sm px-3 py-2 h-9 bg-card/50 border-border/40 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm flex-shrink-0 whitespace-nowrap rounded-lg transition-all"
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
  );
};

export default ChatInterface;