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
  climate?: string;
  [key: string]: string | undefined;
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

// Enhanced system prompt for travel assistant
const getSystemPrompt = (context?: GeminiRequest['context']) => {
  let basePrompt = `You are an expert AI travel companion and content creation strategist. Your expertise spans:
- Travel destination analysis and personalized recommendations
- Content creator budget optimization and ROI planning
- Brand collaboration opportunities and partnership strategies
- Visual storytelling and content monetization tactics
- Cultural insights and local creator networks
- Seasonal travel planning and audience engagement optimization

Personality: Knowledgeable, concise, and actionable. Provide specific, data-driven insights when possible.

Response Style: Direct and conversational. Give practical advice in 1-3 sentences. Focus on actionable insights that help content creators maximize their travel ROI and audience engagement.`;

  if (context?.websiteData) {
    basePrompt += `\n\nUser Context:
- Website themes: ${context.websiteData.themes?.join(', ') || 'Not specified'}
- Content type: ${context.websiteData.contentType || 'Not specified'}`;
    
    if (context.userAnswers) {
      basePrompt += `\n- User preferences: Budget: ${context.userAnswers.budget || 'Not specified'}, Duration: ${context.userAnswers.duration || 'Not specified'}, Style: ${context.userAnswers.style || 'Not specified'}`;
    }
    
    if (context.recommendations && context.recommendations.length > 0) {
      basePrompt += `\n- Current recommendations: ${context.recommendations.map((r: Recommendation) => r.destination).join(', ')}`;
    }
  }

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

    // Prepare the prompt with context
    const systemPrompt = getSystemPrompt(body.context);
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${body.message}`;

    // Make request to Gemini API with enhanced headers
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 64,
          topP: 0.95,
          maxOutputTokens: 2048,
          candidateCount: 1,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI', details: errorData },
        { status: response.status }
      );
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      message: aiResponse,
      timestamp: new Date().toISOString()
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
