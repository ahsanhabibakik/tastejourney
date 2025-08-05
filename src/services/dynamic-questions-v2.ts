// Enhanced Dynamic Question System V2 - LLM-Driven with Budget Awareness
// Generates truly dynamic questions that adapt based on user context and previous answers

import { GeminiService } from './gemini';

interface DynamicQuestionV2 {
  id: string;
  text: string;
  options: string[];
  icon: string;
  multiSelect: boolean;
  priority: number;
  contextAware: boolean;
  adaptiveOptions: boolean;
  metadata?: {
    budgetRange?: { min: number; max: number };
    durationRange?: { min: number; max: number };
    relatedTo?: string[];
  };
}

interface UserContextV2 {
  themes: string[];
  contentType: string;
  hints: string[];
  socialLinks: Array<{ platform: string; url: string }>;
  audienceLocation?: string;
  previousAnswers: Record<string, any>;
  budget?: number;
  duration?: number;
  currency?: string;
}

interface QuestionGenerationPrompt {
  context: UserContextV2;
  questionNumber: number;
  totalQuestions: number;
  previousQuestions: string[];
}

class DynamicQuestionServiceV2 {
  private geminiService: GeminiService;
  private maxQuestions = 5;
  
  constructor() {
    this.geminiService = new GeminiService();
  }

  async generateNextQuestion(
    userContext: UserContextV2, 
    questionNumber: number,
    previousQuestions: string[] = []
  ): Promise<DynamicQuestionV2> {
    console.log('🧠 QUESTIONS V2: Generating context-aware question...');
    console.log('User context:', {
      themes: userContext.themes,
      contentType: userContext.contentType,
      previousAnswers: userContext.previousAnswers,
      budget: userContext.budget,
      currency: userContext.currency
    });

    try {
      // First, determine if we should continue asking questions
      if (questionNumber > this.maxQuestions) {
        return this.createFinalQuestion(userContext);
      }

      // Generate question using LLM based on context
      const prompt = this.buildQuestionGenerationPrompt({
        context: userContext,
        questionNumber,
        totalQuestions: this.maxQuestions,
        previousQuestions
      });

      const result = await this.geminiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the LLM response
      const questionData = this.parseQuestionFromLLM(text, userContext);
      
      // Validate and enhance the question
      const enhancedQuestion = await this.enhanceQuestionWithContext(questionData, userContext);
      
      console.log('✅ QUESTIONS V2: Generated adaptive question:', enhancedQuestion.text);
      console.log('Options:', enhancedQuestion.options);
      
      return enhancedQuestion;
    } catch (error) {
      console.error('❌ QUESTIONS V2: Error generating LLM question:', error);
      // Fallback to smart template-based generation
      return this.generateSmartFallbackQuestion(userContext, questionNumber);
    }
  }

  private buildQuestionGenerationPrompt(params: QuestionGenerationPrompt): string {
    const { context, questionNumber, totalQuestions, previousQuestions } = params;
    
    // Build context summary
    const contextSummary = this.buildContextSummary(context);
    
    return `You are an AI travel recommendation assistant creating personalized questions for a content creator.

CONTEXT:
${contextSummary}

PREVIOUS QUESTIONS ASKED:
${previousQuestions.length > 0 ? previousQuestions.join('\n') : 'None yet'}

TASK: Generate question ${questionNumber} of ${totalQuestions} that will help create the best travel recommendations.

CRITICAL REQUIREMENTS:
1. Questions MUST be contextually aware and build upon previous answers
2. If budget is mentioned, subsequent questions MUST respect that budget constraint
3. Options should be realistic and relevant to the user's profile
4. Each question should provide valuable information for destination selection

OUTPUT FORMAT (JSON):
{
  "question": "The question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
  "reasoning": "Why this question is important given the context",
  "adaptations": "How this question adapts to previous answers"
}

EXAMPLES OF GOOD CONTEXT-AWARE QUESTIONS:
- If budget is $500: "With your $500 budget, which accommodation style do you prefer?" with options like ["Hostels with social atmosphere", "Budget hotels with privacy", "Homestays for cultural immersion", "Camping/outdoor options"]
- If duration is 2 days: "For your weekend trip, what's your main priority?" with options focused on quick experiences

Generate a smart, adaptive question that respects all constraints.`;
  }

  private buildContextSummary(context: UserContextV2): string {
    const parts: string[] = [];
    
    // Basic profile
    parts.push(`Content Type: ${context.contentType}`);
    parts.push(`Themes: ${context.themes.join(', ')}`);
    
    // Previous answers summary
    if (Object.keys(context.previousAnswers).length > 0) {
      parts.push('\nPREVIOUS ANSWERS:');
      for (const [key, value] of Object.entries(context.previousAnswers)) {
        if (key === 'budget' && typeof value === 'string') {
          // Extract budget number and currency
          const budgetInfo = this.parseBudgetString(value);
          if (budgetInfo) {
            context.budget = budgetInfo.amount;
            context.currency = budgetInfo.currency;
            parts.push(`- Budget: ${budgetInfo.currency}${budgetInfo.amount} (${this.getBudgetCategory(budgetInfo.amount)})`);
          }
        } else if (key === 'duration' && typeof value === 'string') {
          const days = this.parseDurationToDays(value);
          context.duration = days;
          parts.push(`- Duration: ${value} (${days} days)`);
        } else {
          parts.push(`- ${this.formatKey(key)}: ${value}`);
        }
      }
    }
    
    // Constraints
    if (context.budget) {
      parts.push(`\nBUDGET CONSTRAINT: ${context.currency || '$'}${context.budget}`);
      parts.push(`This is a ${this.getBudgetCategory(context.budget)} budget - all suggestions must be realistic for this amount.`);
    }
    
    if (context.duration) {
      parts.push(`DURATION CONSTRAINT: ${context.duration} days`);
    }
    
    return parts.join('\n');
  }

  private parseQuestionFromLLM(llmResponse: string, context: UserContextV2): DynamicQuestionV2 {
    try {
      // Extract JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `q${Date.now()}`,
        text: parsed.question,
        options: parsed.options || [],
        icon: this.selectIconForQuestion(parsed.question, context),
        multiSelect: this.shouldBeMultiSelect(parsed.question),
        priority: 1,
        contextAware: true,
        adaptiveOptions: true,
        metadata: {
          budgetRange: context.budget ? { min: 0, max: context.budget } : undefined,
          durationRange: context.duration ? { min: 1, max: context.duration } : undefined
        }
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw error;
    }
  }

  private async enhanceQuestionWithContext(
    question: DynamicQuestionV2, 
    context: UserContextV2
  ): Promise<DynamicQuestionV2> {
    // Validate options against constraints
    if (context.budget && question.options.length > 0) {
      question.options = this.filterOptionsByBudget(question.options, context.budget, context.currency);
    }
    
    if (context.duration && question.options.length > 0) {
      question.options = this.filterOptionsByDuration(question.options, context.duration);
    }
    
    // Ensure we have at least 3 valid options
    if (question.options.length < 3) {
      question.options = await this.generateAdditionalOptions(question, context);
    }
    
    return question;
  }

  private generateSmartFallbackQuestion(
    context: UserContextV2, 
    questionNumber: number
  ): DynamicQuestionV2 {
    console.log('🔄 QUESTIONS V2: Using smart fallback generation');
    
    // Smart question selection based on what we already know
    const answered = Object.keys(context.previousAnswers);
    
    // Priority order of questions based on context
    if (!answered.includes('budget')) {
      return this.createBudgetQuestion(context);
    }
    
    if (!answered.includes('duration')) {
      return this.createDurationQuestion(context);
    }
    
    if (!answered.includes('style') && context.budget) {
      return this.createBudgetAwareStyleQuestion(context);
    }
    
    if (!answered.includes('priorities') && context.budget && context.duration) {
      return this.createPrioritiesQuestion(context);
    }
    
    if (!answered.includes('accommodation') && context.budget) {
      return this.createAccommodationQuestion(context);
    }
    
    // Default to interests question
    return this.createInterestsQuestion(context);
  }

  private createBudgetQuestion(context: UserContextV2): DynamicQuestionV2 {
    // Detect likely currency based on audience location or previous context
    const currency = this.detectCurrency(context);
    
    return {
      id: 'budget',
      text: 'What\'s your travel budget per person?',
      options: this.generateBudgetOptions(currency),
      icon: '💸',
      multiSelect: false,
      priority: 1,
      contextAware: true,
      adaptiveOptions: true
    };
  }

  private createDurationQuestion(context: UserContextV2): DynamicQuestionV2 {
    const budget = context.budget || 0;
    
    // Adapt duration options based on budget
    let options: string[];
    if (budget < 500) {
      options = ['1 day trip', '2-3 days', '4-5 days', 'One week'];
    } else if (budget < 1000) {
      options = ['2-3 days', '4-7 days', '1-2 weeks', '2-3 weeks'];
    } else {
      options = ['3-5 days', '1 week', '2 weeks', '3-4 weeks', '1+ months'];
    }
    
    return {
      id: 'duration',
      text: context.budget 
        ? `With your ${context.currency || '$'}${context.budget} budget, how long would you like to travel?`
        : 'How long would you like to travel?',
      options,
      icon: '🗓️',
      multiSelect: false,
      priority: 2,
      contextAware: true,
      adaptiveOptions: true
    };
  }

  private createBudgetAwareStyleQuestion(context: UserContextV2): DynamicQuestionV2 {
    const budget = context.budget || 1000;
    const budgetCategory = this.getBudgetCategory(budget);
    
    let options: string[];
    if (budgetCategory === 'budget') {
      options = [
        'Backpacking & hostels',
        'Local experiences & street food',
        'Budget-friendly adventures',
        'Cultural immersion on a budget',
        'Work exchange & volunteering'
      ];
    } else if (budgetCategory === 'mid-range') {
      options = [
        'Comfortable hotels & local dining',
        'Mix of budget and comfort',
        'Guided tours & experiences',
        'Photography-focused travel',
        'Balanced adventure & relaxation'
      ];
    } else {
      options = [
        'Luxury accommodations',
        'Premium experiences',
        'Exclusive access & VIP',
        'High-end culinary journey',
        'Boutique & unique stays'
      ];
    }
    
    return {
      id: 'style',
      text: `What travel style fits your ${context.currency || '$'}${budget} budget best?`,
      options,
      icon: '🌍',
      multiSelect: false,
      priority: 3,
      contextAware: true,
      adaptiveOptions: true,
      metadata: {
        budgetRange: { min: 0, max: budget }
      }
    };
  }

  private createPrioritiesQuestion(context: UserContextV2): DynamicQuestionV2 {
    const budget = context.budget || 1000;
    const duration = context.duration || 7;
    const dailyBudget = Math.floor(budget / duration);
    
    let options: string[];
    if (dailyBudget < 50) {
      options = [
        'Free attractions & nature',
        'Street food & local markets',
        'Public transport & walking tours',
        'Community experiences',
        'Budget photography spots'
      ];
    } else if (dailyBudget < 150) {
      options = [
        'Cultural sites & museums',
        'Local restaurants & cafes',
        'Mix of free and paid attractions',
        'Comfortable transport',
        'Some guided experiences'
      ];
    } else {
      options = [
        'Premium experiences',
        'Fine dining & cocktails',
        'Private tours & guides',
        'Luxury transport',
        'Exclusive access venues'
      ];
    }
    
    const text = duration <= 3 
      ? `For your ${duration}-day trip with ${context.currency || '$'}${budget} budget, what's most important?`
      : `With ${duration} days and ${context.currency || '$'}${budget} budget (${context.currency || '$'}${dailyBudget}/day), what are your priorities?`;
    
    return {
      id: 'priorities',
      text,
      options,
      icon: '🎯',
      multiSelect: true,
      priority: 4,
      contextAware: true,
      adaptiveOptions: true
    };
  }

  private createAccommodationQuestion(context: UserContextV2): DynamicQuestionV2 {
    const budget = context.budget || 1000;
    const duration = context.duration || 7;
    const accommodationBudget = Math.floor((budget * 0.3) / duration); // Assume 30% for accommodation
    
    let options: string[];
    if (accommodationBudget < 20) {
      options = [
        'Hostels (dorms)',
        'Couchsurfing',
        'Camping',
        'Work exchange accommodation',
        'Ultra-budget guesthouses'
      ];
    } else if (accommodationBudget < 50) {
      options = [
        'Private hostel rooms',
        'Budget hotels',
        'Airbnb (shared)',
        'Guesthouses',
        'Homestays'
      ];
    } else if (accommodationBudget < 100) {
      options = [
        'Mid-range hotels',
        'Entire Airbnb apartments',
        'Boutique guesthouses',
        'Business hotels',
        'Serviced apartments'
      ];
    } else {
      options = [
        'Luxury hotels',
        'Resort stays',
        'Premium Airbnb',
        'Boutique hotels',
        'Five-star properties'
      ];
    }
    
    return {
      id: 'accommodation',
      text: `With ~${context.currency || '$'}${accommodationBudget}/night for accommodation, what's your preference?`,
      options,
      icon: '🏨',
      multiSelect: false,
      priority: 5,
      contextAware: true,
      adaptiveOptions: true
    };
  }

  private createInterestsQuestion(context: UserContextV2): DynamicQuestionV2 {
    const themes = context.themes.join(' ').toLowerCase();
    const contentType = context.contentType.toLowerCase();
    
    let options: string[] = [];
    
    if (themes.includes('photo') || contentType.includes('photo')) {
      options.push('Photography hotspots', 'Golden hour locations', 'Unique architecture');
    }
    
    if (themes.includes('food') || contentType.includes('food')) {
      options.push('Local cuisine', 'Street food tours', 'Cooking classes');
    }
    
    if (themes.includes('adventure') || themes.includes('outdoor')) {
      options.push('Hiking & trekking', 'Water activities', 'Extreme sports');
    }
    
    if (themes.includes('culture') || themes.includes('history')) {
      options.push('Museums & galleries', 'Historical sites', 'Local traditions');
    }
    
    if (themes.includes('business') || themes.includes('tech')) {
      options.push('Coworking spaces', 'Tech hubs', 'Networking events');
    }
    
    // Add budget-appropriate general options
    const budget = context.budget || 1000;
    if (budget < 500) {
      options.push('Free walking tours', 'Public markets', 'Street art');
    } else {
      options.push('Guided experiences', 'Workshop classes', 'Special events');
    }
    
    // Limit to 6 most relevant options
    options = [...new Set(options)].slice(0, 6);
    
    return {
      id: 'interests',
      text: 'Which experiences interest you most for content creation?',
      options,
      icon: '🎯',
      multiSelect: true,
      priority: 6,
      contextAware: true,
      adaptiveOptions: true
    };
  }

  private createFinalQuestion(context: UserContextV2): DynamicQuestionV2 {
    return {
      id: 'final',
      text: 'Any specific requirements or preferences I should know about?',
      options: [
        'Visa-free destinations only',
        'Direct flights preferred',
        'Vegetarian/Vegan friendly',
        'LGBTQ+ friendly',
        'Family-friendly',
        'Solo traveler safety',
        'Accessibility needs',
        'None - I\'m flexible!'
      ],
      icon: '📝',
      multiSelect: true,
      priority: 10,
      contextAware: true,
      adaptiveOptions: false
    };
  }

  // Helper methods
  private parseBudgetString(budgetStr: string): { amount: number; currency: string } | null {
    // Handle various formats: "$500", "500 USD", "500", "300-500", "৳500", "₹5000"
    const patterns = [
      /^([₹₽¥€£$৳])\s*(\d+)(?:-\d+)?/,  // Currency symbol first
      /^(\d+)(?:-(\d+))?\s*([A-Z]{3}|[₹₽¥€£$৳])?/,  // Number first with optional currency
      /^(\d+)$/  // Just number
    ];
    
    for (const pattern of patterns) {
      const match = budgetStr.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          // Currency symbol is first
          return {
            amount: parseInt(match[2]),
            currency: match[1]
          };
        } else {
          // Number is first
          const amount = parseInt(match[1]);
          const currency = match[3] || '$';
          return { amount, currency };
        }
      }
    }
    
    return null;
  }

  private parseDurationToDays(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    
    if (lowerDuration.includes('day')) {
      const match = lowerDuration.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }
    
    if (lowerDuration.includes('week')) {
      const match = lowerDuration.match(/(\d+)/);
      const weeks = match ? parseInt(match[1]) : 1;
      return weeks * 7;
    }
    
    if (lowerDuration.includes('month')) {
      const match = lowerDuration.match(/(\d+)/);
      const months = match ? parseInt(match[1]) : 1;
      return months * 30;
    }
    
    // Default parsing
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 7;
  }

  private getBudgetCategory(amount: number): 'budget' | 'mid-range' | 'luxury' {
    if (amount < 750) return 'budget';
    if (amount < 2500) return 'mid-range';
    return 'luxury';
  }

  private detectCurrency(context: UserContextV2): string {
    // Check previous answers
    if (context.previousAnswers.currency) {
      return context.previousAnswers.currency;
    }
    
    // Check audience location
    const location = context.audienceLocation?.toLowerCase() || '';
    
    if (location.includes('bangladesh') || location.includes('dhaka')) return '৳';
    if (location.includes('india')) return '₹';
    if (location.includes('euro') || location.includes('eu')) return '€';
    if (location.includes('uk') || location.includes('pound')) return '£';
    if (location.includes('japan')) return '¥';
    
    // Default to USD
    return '$';
  }

  private generateBudgetOptions(currency: string): string[] {
    const ranges = [
      { min: 300, max: 500 },
      { min: 500, max: 1000 },
      { min: 1000, max: 2000 },
      { min: 2000, max: 5000 },
      { min: 5000, max: 10000 }
    ];
    
    return ranges.map(range => 
      `${currency}${range.min}-${range.max}`
    ).concat(['Custom amount']);
  }

  private selectIconForQuestion(questionText: string, context: UserContextV2): string {
    const lowerText = questionText.toLowerCase();
    
    if (lowerText.includes('budget') || lowerText.includes('cost')) return '💸';
    if (lowerText.includes('duration') || lowerText.includes('long') || lowerText.includes('days')) return '🗓️';
    if (lowerText.includes('style') || lowerText.includes('type')) return '🌍';
    if (lowerText.includes('accommodation') || lowerText.includes('stay')) return '🏨';
    if (lowerText.includes('food') || lowerText.includes('cuisine')) return '🍽️';
    if (lowerText.includes('priority') || lowerText.includes('important')) return '🎯';
    if (lowerText.includes('climate') || lowerText.includes('weather')) return '☀️';
    if (lowerText.includes('creator') || lowerText.includes('collab')) return '👥';
    if (lowerText.includes('brand') || lowerText.includes('partner')) return '🤝';
    
    return '❓';
  }

  private shouldBeMultiSelect(questionText: string): boolean {
    const multiSelectKeywords = [
      'choose all',
      'select all',
      'which of these',
      'interests',
      'priorities',
      'preferences',
      'requirements'
    ];
    
    const lowerText = questionText.toLowerCase();
    return multiSelectKeywords.some(keyword => lowerText.includes(keyword));
  }

  private filterOptionsByBudget(options: string[], budget: number, currency?: string): string[] {
    // Remove options that are clearly outside budget range
    return options.filter(option => {
      const lowerOption = option.toLowerCase();
      
      // Check for luxury keywords if budget is low
      if (budget < 1000) {
        const luxuryKeywords = ['luxury', 'premium', 'five-star', 'exclusive', 'vip', 'high-end'];
        if (luxuryKeywords.some(keyword => lowerOption.includes(keyword))) {
          return false;
        }
      }
      
      // Check for budget keywords if budget is high
      if (budget > 5000) {
        const budgetKeywords = ['budget', 'cheap', 'hostel', 'backpack', 'dorm'];
        if (budgetKeywords.some(keyword => lowerOption.includes(keyword))) {
          return false;
        }
      }
      
      return true;
    });
  }

  private filterOptionsByDuration(options: string[], duration: number): string[] {
    return options.filter(option => {
      const lowerOption = option.toLowerCase();
      
      // Remove month-long options for short trips
      if (duration <= 7 && lowerOption.includes('month')) {
        return false;
      }
      
      // Remove day trip options for long trips
      if (duration > 14 && lowerOption.includes('day trip')) {
        return false;
      }
      
      return true;
    });
  }

  private async generateAdditionalOptions(
    question: DynamicQuestionV2,
    context: UserContextV2
  ): Promise<string[]> {
    // Generate contextually appropriate options
    const existingOptions = question.options;
    const needed = Math.max(4, existingOptions.length) - existingOptions.length;
    
    if (needed <= 0) return existingOptions;
    
    // Add smart defaults based on question type
    const questionId = question.id.toLowerCase();
    const additionalOptions: string[] = [];
    
    if (questionId.includes('style')) {
      additionalOptions.push('Flexible - mix of everything', 'Whatever gives best content');
    }
    
    if (questionId.includes('priority')) {
      additionalOptions.push('Meeting other creators', 'Unique experiences');
    }
    
    if (questionId.includes('accommodation')) {
      additionalOptions.push('Depends on the destination', 'Open to suggestions');
    }
    
    return [...existingOptions, ...additionalOptions.slice(0, needed)];
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

export const dynamicQuestionServiceV2 = new DynamicQuestionServiceV2();
export type { DynamicQuestionV2, UserContextV2 };