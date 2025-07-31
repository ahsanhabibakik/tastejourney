import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAv_4-Q6LU21xSko8g9XBGAu1CeqNmB8Ew';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiRequest {
  message: string;
  context?: {
    chatState?: string;
    websiteData?: any;
    recommendations?: any[];
    userAnswers?: any;
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
const getSystemPrompt = (context?: any) => {
  const basePrompt = `You are an expert AI travel companion specializing in content creator travel recommendations. You provide personalized, actionable advice for travel content creators looking to monetize their journeys.

Key capabilities:
- Analyze travel preferences and content creation goals
- Provide detailed destination recommendations
- Suggest collaboration opportunities with brands
- Offer budget breakdowns and optimization tips
- Recommend best times to visit for content creation
- Share engagement strategies for different destinations

Always be enthusiastic, knowledgeable, and focus on practical advice that helps creators succeed.`;

  if (context?.websiteData) {
    return basePrompt + `\n\nUser Context:
- Website themes: ${context.websiteData.themes?.join(', ') || 'Not specified'}
- Content type: ${context.websiteData.contentType || 'Not specified'}
- User preferences: ${JSON.stringify(context.userAnswers || {})}`;
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

    // Make request to Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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