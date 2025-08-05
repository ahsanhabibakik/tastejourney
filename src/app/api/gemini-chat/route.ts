import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface WebsiteData {
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
}

interface Recommendation {
  id: number;
  destination: string;
  country: string;
  matchScore: number;
  image: string;
  highlights: string[];
  budget: {
    range: string;
    breakdown: string;
    currency: string;
  };
}

interface UserAnswers {
  budget?: string;
  duration?: string;
  style?: string;
  contentFocus?: string;

  climate?: string | string[];
  [key: string]: string | string[] | undefined;

}

interface GeminiRequest {
  message: string;
  context?: {
    chatState?: string;
    websiteData?: WebsiteData;
    recommendations?: Recommendation[];
    userAnswers?: UserAnswers;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Enhanced system prompt with comprehensive travel expertise
const getSystemPrompt = (context?: GeminiRequest['context']) => {
  let basePrompt = `You are TasteJourney AI - an expert travel strategist and content creation advisor with deep expertise in:

🎯 CORE SPECIALIZATIONS:
- Travel destination analysis with Qloo Taste AI™ integration
- Content creator monetization and brand partnership strategies  
- Local creator community networking and collaboration opportunities
- Budget optimization with real-time cost analysis (flights, hotels, living expenses)
- Seasonal content planning and audience engagement maximization
- Cultural immersion strategies and authentic storytelling angles
- Video/photo content opportunities and Instagram-worthy spot identification
- Fact-checked travel information with confidence scoring

🧠 KNOWLEDGE BASE:
- Global destination trends and creator hotspots
- Platform-specific content strategies (YouTube, Instagram, TikTok)
- Brand collaboration rates and partnership opportunities
- Local creator communities and networking events
- Budget breakdowns with cost-efficiency analysis
- Visa requirements, safety tips, and cultural etiquette
- Best travel months and seasonal event calendars
- Photography locations and content creation logistics

💬 RESPONSE STYLE:
- Knowledgeable yet conversational and engaging
- Specific, actionable advice with concrete numbers when possible
- Focus on ROI and monetization potential
- Include practical next steps and implementation tips
- Reference specific tools, apps, or resources when helpful
- Balance inspiration with realistic planning

🎨 CONTENT OPTIMIZATION:
- Suggest specific video ideas and photography angles
- Recommend hashtags and content themes
- Identify brand collaboration opportunities
- Provide cost-benefit analysis for content investments
- Suggest creator collaboration strategies`;

  if (context?.websiteData) {
    basePrompt += `\n\n📊 USER PROFILE ANALYSIS:
- Content Themes: ${context.websiteData.themes?.join(', ') || 'General travel content'}
- Content Format: ${context.websiteData.contentType || 'Mixed media'}
- Audience Location: ${context.websiteData.location || 'Global'}
- Website URL: ${context.websiteData.url || 'Not provided'}`;
    
    if (context.websiteData.socialLinks?.length > 0) {
      basePrompt += `\n- Social Platforms: ${context.websiteData.socialLinks.map(link => link.platform).join(', ')}`;
    }
    
    if (context.userAnswers) {
      basePrompt += `\n\n🎯 TRAVEL PREFERENCES:
- Budget Range: ${context.userAnswers.budget || 'Not specified'}
- Trip Duration: ${context.userAnswers.duration || 'Flexible'}
- Travel Style: ${context.userAnswers.style || 'Mixed'}
- Content Focus: ${context.userAnswers.contentFocus || 'General'}
- Climate Preference: ${context.userAnswers.climate || 'Any'}`;
    }
    
    if (context.recommendations && context.recommendations.length > 0) {
      basePrompt += `\n\n🌍 CURRENT RECOMMENDATIONS:
${context.recommendations.map((r: Recommendation, index) => 
  `${index + 1}. ${r.destination} (Match: ${r.matchScore}%, Budget: ${r.budget?.range || 'TBD'})`
).join('\n')}`;
    }
  }

  basePrompt += `\n\n🎯 RESPONSE GUIDELINES:
- Provide specific, actionable advice (not generic tips)
- Include numbers, costs, or metrics when possible
- Suggest 2-3 concrete next steps
- Reference the user's content themes and preferences
- Focus on monetization and audience growth opportunities
- Keep responses concise but comprehensive (2-4 sentences max)`;

  return basePrompt;
};

export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequest = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Enhanced processing: Check if this is a destination-specific question
    const isDestinationQuery = await checkForDestinationSpecificQuery(body.message, body.context);
    
    let aiResponse: string;
    let responseMetadata: any = {
      enhanced: false,
      processingMethod: 'standard'
    };

    if (isDestinationQuery.isDestinationSpecific && body.context?.websiteData) {
      // Use advanced Gemini service for destination-specific queries
      try {
        const enhancedResponse = await getEnhancedDestinationResponse(
          body.message,

          isDestinationQuery.destination || 'Unknown',

          body.context
        );
        aiResponse = enhancedResponse.response;
        responseMetadata = {
          enhanced: true,
          processingMethod: 'advanced-gemini-service',
          destination: isDestinationQuery.destination,
          features: enhancedResponse.features
        };
      } catch (enhancedError) {
        console.warn('Enhanced processing failed, falling back to standard:', enhancedError);
        aiResponse = await getStandardResponse(body.message, body.context);
        responseMetadata.processingMethod = 'standard-fallback';
      }
    } else {
      // Use standard processing for general queries
      aiResponse = await getStandardResponse(body.message, body.context);
    }

    return NextResponse.json({
      success: true,
      message: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: responseMetadata
    });

  } catch (error) {
    console.error('Gemini API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Standard Gemini API response
async function getStandardResponse(message: string, context?: GeminiRequest['context']): Promise<string> {
  const systemPrompt = getSystemPrompt(context);
  const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

      'X-Goog-Api-Key': GEMINI_API_KEY || '',

    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 2048,
        candidateCount: 1,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response generated from AI');
  }

  return data.candidates[0].content.parts[0].text;
}

// Enhanced destination-specific response using advanced Gemini service
async function getEnhancedDestinationResponse(
  message: string, 
  destination: string, 
  context?: GeminiRequest['context']
): Promise<{ response: string; features: string[] }> {
  // Import the enhanced Gemini service
  const { geminiService } = await import('@/services/gemini');

  if (!context?.websiteData) {
    throw new Error('Website data required for enhanced processing');
  }

  // Generate comprehensive destination analysis
  const destinationData = await geminiService.generateDynamicRecommendation({
    userProfile: {
      website: context.websiteData.url || '',
      contentThemes: context.websiteData.themes || [],
      audienceInterests: context.websiteData.hints || [],
      contentType: context.websiteData.contentType || 'Mixed',
      audienceLocation: context.websiteData.location || 'Global'
    },
    tasteProfile: null,
    destination: {
      name: destination,
      country: destination.split(',')[1]?.trim() || 'Unknown'
    },

    userPreferences: {
      budget: context.userAnswers?.budget,
      travelStyle: context.userAnswers?.style,
      duration: context.userAnswers?.duration,
      contentType: context.userAnswers?.contentFocus,
      climate: Array.isArray(context.userAnswers?.climate) 
        ? context.userAnswers.climate 
        : context.userAnswers?.climate 
          ? [context.userAnswers.climate] 
          : undefined
    }

  });

  // Create enhanced response based on user question and destination data
  const enhancedPrompt = `Based on comprehensive destination analysis, answer this question about ${destination}:

QUESTION: ${message}

DESTINATION ANALYSIS:
- Match Score: ${destinationData.matchScore}%
- Summary: ${destinationData.summary}
- Content Opportunities: ${JSON.stringify(destinationData.contentOpportunities)}
- Brand Collaborations: ${JSON.stringify(destinationData.brandCollaborations)}
- Local Creators: ${JSON.stringify(destinationData.localCreators)}
- Budget Info: ${JSON.stringify(destinationData.budgetBreakdown)}
- Best Time to Visit: ${JSON.stringify(destinationData.bestTimeToVisit)}
- Practical Info: ${JSON.stringify(destinationData.practicalInfo)}

USER CONTEXT:
- Content Themes: ${context?.websiteData?.themes?.join(', ') || 'General'}
- Content Type: ${context?.websiteData?.contentType || 'Mixed'}

Provide a specific, actionable answer that references the destination analysis data. Include concrete numbers, opportunities, or recommendations when possible.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    }),
  });

  if (!response.ok) {
    throw new Error(`Enhanced Gemini API failed: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No enhanced response generated');
  }

  return {
    response: data.candidates[0].content.parts[0].text,
    features: [
      'Comprehensive destination analysis',
      'Content opportunity mapping',
      'Brand collaboration insights',
      'Local creator networking',
      'Budget optimization',
      'Seasonal planning'
    ]
  };
}

// Check if query is destination-specific
async function checkForDestinationSpecificQuery(
  message: string, 
  context?: GeminiRequest['context']
): Promise<{ isDestinationSpecific: boolean; destination?: string }> {
  // Simple pattern matching for destination queries
  const destinationPatterns = [
    /\b(Tokyo|Bali|Lisbon|Mexico City|Istanbul|Barcelona|Bangkok|Cape Town|Dubai|Paris|London|New York|Rome)\b/i,
    /\b(Japan|Indonesia|Portugal|Mexico|Turkey|Spain|Thailand|South Africa|UAE|France|UK|USA|Italy)\b/i
  ];

  // Check if current recommendations contain destinations mentioned in query
  if (context?.recommendations) {
    for (const rec of context.recommendations) {
      if (message.toLowerCase().includes(rec.destination.toLowerCase()) || 
          message.toLowerCase().includes(rec.country.toLowerCase())) {
        return {
          isDestinationSpecific: true,
          destination: rec.destination
        };
      }
    }
  }

  // Check for general destination patterns
  for (const pattern of destinationPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        isDestinationSpecific: true,
        destination: match[0]
      };
    }
  }

  return { isDestinationSpecific: false };
}
