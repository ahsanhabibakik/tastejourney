import { NextRequest, NextResponse } from 'next/server';
import { dynamicQuestionServiceV2 } from '@/services/dynamic-questions-v2';
import { ErrorHandler } from '@/services/errorHandler';

export async function POST(request: NextRequest) {
  const errorHandler = new ErrorHandler('dynamic-questions-api');
  
  return errorHandler.withFallback(async () => {
    try {
      const body = await request.json();
      const { userContext, questionNumber = 1, previousQuestions = [] } = body;

      if (!userContext) {
        return NextResponse.json(
          { success: false, error: 'User context is required' },
          { status: 400 }
        );
      }

      console.log('🎯 DYNAMIC QUESTIONS API: Generating question', questionNumber);
      console.log('Context:', {
        themes: userContext.themes,
        contentType: userContext.contentType,
        previousAnswers: userContext.previousAnswers,
        budget: userContext.budget
      });

      // Generate the next question
      const question = await dynamicQuestionServiceV2.generateNextQuestion(
        userContext,
        questionNumber,
        previousQuestions
      );

      console.log('✅ Generated question:', question.text);
      console.log('Options:', question.options);

      return NextResponse.json({
        success: true,
        question,
        metadata: {
          questionNumber,
          isContextAware: question.contextAware,
          hasAdaptiveOptions: question.adaptiveOptions,
          budgetConstraint: userContext.budget,
          durationConstraint: userContext.duration
        }
      });
    } catch (error) {
      console.error('❌ Dynamic questions API error:', error);
      
      // Return a fallback question on error
      const fallbackQuestion = {
        id: 'fallback_' + Date.now(),
        text: 'What type of travel experience are you looking for?',
        options: [
          'Adventure & outdoor activities',
          'Cultural exploration',
          'Relaxation & wellness',
          'Food & culinary experiences',
          'Photography & sightseeing'
        ],
        icon: '🌍',
        multiSelect: false,
        priority: 1,
        contextAware: false,
        adaptiveOptions: false
      };

      return NextResponse.json({
        success: true,
        question: fallbackQuestion,
        metadata: {
          questionNumber: 1,
          isFallback: true
        }
      });
    }
  }, async () => {
    // Final fallback
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate dynamic question',
        fallbackAvailable: true
      },
      { status: 500 }
    );
  });
}