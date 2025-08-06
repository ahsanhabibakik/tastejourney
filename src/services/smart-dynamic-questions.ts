// Smart Dynamic Question System - Logic-based, Budget-aware, No LLM dependency
// Highly optimized for accurate budget constraints and realistic recommendations

interface SmartQuestion {
  id: string;
  text: string;
  options: string[];
  icon: string;
  multiSelect: boolean;
  priority: number;
  budgetSensitive: boolean;
  durationSensitive: boolean;
  validation?: (answer: any, context: QuestionContext) => { valid: boolean; message?: string };
}

interface QuestionContext {
  themes: string[];
  contentType: string;
  hints: string[];
  socialLinks: Array<{ platform: string; url: string }>;
  audienceLocation?: string;
  previousAnswers: Record<string, any>;
  budget?: number;
  currency?: string;
  duration?: number;
  dailyBudget?: number;
}

interface BudgetConstraint {
  currency: string;
  amount: number;
  category: 'ultra-budget' | 'budget' | 'mid-range' | 'premium' | 'luxury';
  dailyAmount: number;
  maxDuration: number;
}

class SmartDynamicQuestionService {
  private questions: SmartQuestion[] = [
    // Question 1: Trip Length (PRD requirement)
    {
      id: 'duration',
      text: 'Preferred trip length?',
      options: [], // Dynamic options
      icon: '🗓️',
      multiSelect: false,
      priority: 1,
      budgetSensitive: false,
      durationSensitive: false
    },

    // Question 2: Budget (PRD requirement)  
    {
      id: 'budget',
      text: 'Rough budget per person (US$)?',
      options: [], // Dynamic based on location
      icon: '💸',
      multiSelect: false,
      priority: 2,
      budgetSensitive: false,
      durationSensitive: true,
      validation: (answer, context) => {
        const budget = this.parseBudgetAmount(answer);
        if (budget < 50) {
          return { valid: false, message: 'Budget too low for travel recommendations' };
        }
        return { valid: true };
      }
    },

    // Question 3: Content Format (PRD requirement)
    {
      id: 'contentFormat',
      text: 'Primary content format?',
      options: [], // Based on content type
      icon: '📸',
      multiSelect: false,
      priority: 3,
      budgetSensitive: true,
      durationSensitive: true
    },

    // Question 4: Climate/Regions (PRD requirement)
    {
      id: 'climate',
      text: 'Preferred or avoided climates/regions?',
      options: [], // Climate options
      icon: '🌍',
      multiSelect: true,
      priority: 4,
      budgetSensitive: true,
      durationSensitive: true
    }
  ];

  async generateNextQuestion(
    context: QuestionContext,
    questionNumber: number
  ): Promise<SmartQuestion | null> {
    console.log('🧠 SMART QUESTIONS: Generating question', questionNumber);
    console.log('Context:', {
      budget: context.budget,
      currency: context.currency,
      duration: context.duration,
      dailyBudget: context.dailyBudget
    });

    // Complete after 4 questions (per PRD)
    if (questionNumber > 4) {
      return null;
    }

    // Get the base question
    const baseQuestion = this.questions[questionNumber - 1];
    if (!baseQuestion) {
      return null;
    }

    // Create customized question
    const customQuestion: SmartQuestion = {
      ...baseQuestion,
      text: this.customizeQuestionText(baseQuestion, context),
      options: this.generateOptionsForQuestion(baseQuestion, context)
    };

    console.log('✅ Generated question:', customQuestion.text);
    console.log('Options:', customQuestion.options);

    return customQuestion;
  }

  private customizeQuestionText(question: SmartQuestion, context: QuestionContext): string {
    const { budget, currency, duration } = context;

    switch (question.id) {
      case 'duration':
        return 'Preferred trip length?';
      
      case 'budget':
        if (duration) {
          return `Rough budget per person (US$) for your ${duration}-day trip?`;
        }
        return 'Rough budget per person (US$)?';
      
      case 'contentFormat':
        return 'Primary content format?';
      
      case 'climate':
        return 'Preferred or avoided climates/regions?';
      
      default:
        return question.text;
    }
  }

  private generateOptionsForQuestion(question: SmartQuestion, context: QuestionContext): string[] {
    switch (question.id) {
      case 'duration':
        return this.generateDurationOptions(context);
      
      case 'budget':
        return this.generateBudgetOptions(context);
      
      case 'contentFormat':
        return this.generateContentFormatOptions(context);
      
      case 'climate':
        return this.generateClimateOptions(context);
      
      default:
        return question.options;
    }
  }

  private generateBudgetOptions(context: QuestionContext): string[] {
    const currency = this.detectCurrency(context);
    
    // Different ranges based on likely currency and location
    let ranges: Array<{ min: number; max: number }>;
    
    if (currency === '৳') { // Bangladesh Taka
      ranges = [
        { min: 500, max: 1000 },
        { min: 1000, max: 2500 },
        { min: 2500, max: 5000 },
        { min: 5000, max: 10000 },
        { min: 10000, max: 20000 }
      ];
    } else if (currency === '₹') { // Indian Rupee
      ranges = [
        { min: 3000, max: 8000 },
        { min: 8000, max: 15000 },
        { min: 15000, max: 30000 },
        { min: 30000, max: 60000 },
        { min: 60000, max: 120000 }
      ];
    } else { // USD and others
      ranges = [
        { min: 200, max: 500 },
        { min: 500, max: 1000 },
        { min: 1000, max: 2500 },
        { min: 2500, max: 5000 },
        { min: 5000, max: 10000 }
      ];
    }

    return ranges.map(range => 
      `${currency}${range.min}-${range.max}`
    ).concat(['Custom amount']);
  }

  private generateDurationOptions(context: QuestionContext): string[] {
    // Simple duration options as first question
    return [
      '1-2 days (weekend trip)',
      '3-5 days (short getaway)', 
      '1 week (standard vacation)',
      '2 weeks (extended trip)',
      '3-4 weeks (long adventure)',
      '1+ months (extended travel)'
    ];
  }

  private generateContentFormatOptions(context: QuestionContext): string[] {
    const themes = context.themes.join(' ').toLowerCase();
    const contentType = context.contentType.toLowerCase();
    
    const options = [
      'Video content (vlogs, reels)',
      'Photography (Instagram, blog)',
      'Mixed content (photo + video)',
      'Live streaming & stories',
      'Long-form content (YouTube)',
      'Short-form content (TikTok, Shorts)'
    ];
    
    // Prioritize based on existing content type
    if (contentType.includes('video') || contentType.includes('vlog')) {
      return ['Video content (vlogs, reels)', 'Live streaming & stories', 'Long-form content (YouTube)', 'Mixed content (photo + video)', 'Short-form content (TikTok, Shorts)', 'Photography (Instagram, blog)'];
    }
    
    if (contentType.includes('photo') || themes.includes('photography')) {
      return ['Photography (Instagram, blog)', 'Mixed content (photo + video)', 'Video content (vlogs, reels)', 'Short-form content (TikTok, Shorts)', 'Live streaming & stories', 'Long-form content (YouTube)'];
    }
    
    return options;
  }

  private generateClimateOptions(context: QuestionContext): string[] {
    return [
      'Tropical & warm climates',
      'Temperate & mild weather',
      'Cool & mountainous regions',
      'Desert & arid landscapes',
      'Coastal & beach destinations',
      'Urban & city environments',
      'Avoid extreme cold',
      'Avoid extreme heat',
      'No specific preference'
    ];
  }

  // Helper methods
  private parseBudgetAmount(budgetStr: string): number {
    // Remove currency symbols and extract number
    const numMatch = budgetStr.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 0;
  }

  private parseBudgetString(budgetStr: string): { amount: number; currency: string } | null {
    // Handle various formats
    const patterns = [
      /^([₹₽¥€£$৳])\s*(\d+)/,  // Currency first
      /^(\d+)\s*([₹₽¥€£$৳])/,  // Number first
      /^(\d+)$/  // Just number
    ];
    
    for (const pattern of patterns) {
      const match = budgetStr.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          return { amount: parseInt(match[2]), currency: match[1] };
        } else if (pattern === patterns[1]) {
          return { amount: parseInt(match[1]), currency: match[2] };
        } else {
          return { amount: parseInt(match[1]), currency: '$' };
        }
      }
    }
    
    return null;
  }

  private parseDurationToDays(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    
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
    
    // Extract days
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  private detectCurrency(context: QuestionContext): string {
    const location = context.audienceLocation?.toLowerCase() || '';
    
    if (location.includes('bangladesh') || location.includes('dhaka')) return '৳';
    if (location.includes('india')) return '₹';
    if (location.includes('euro') || location.includes('eu')) return '€';
    if (location.includes('uk') || location.includes('pound')) return '£';
    if (location.includes('japan')) return '¥';
    
    return '$'; // Default
  }

  private getCurrencyMultiplier(currency: string): number {
    // Rough conversion multipliers for budget calculations
    const multipliers: Record<string, number> = {
      '৳': 0.01,  // 1 USD = ~100 BDT
      '₹': 0.012, // 1 USD = ~83 INR
      '€': 1.1,   // 1 USD = ~0.9 EUR
      '£': 1.25,  // 1 USD = ~0.8 GBP
      '¥': 0.007, // 1 USD = ~150 JPY
      '$': 1      // Base currency
    };
    
    return multipliers[currency] || 1;
  }

  private getBudgetCategory(dailyBudget: number): 'ultra-budget' | 'budget' | 'mid-range' | 'premium' | 'luxury' {
    if (dailyBudget < 30) return 'ultra-budget';
    if (dailyBudget < 75) return 'budget';
    if (dailyBudget < 150) return 'mid-range';
    if (dailyBudget < 300) return 'premium';
    return 'luxury';
  }

  // Update context with new answer
  updateContext(context: QuestionContext, questionId: string, answer: any): QuestionContext {
    const newContext: QuestionContext = {
      ...context,
      previousAnswers: {
        ...context.previousAnswers,
        [questionId]: answer
      }
    };

    // Update calculated fields
    if (questionId === 'budget') {
      const budgetInfo = this.parseBudgetString(answer);
      if (budgetInfo) {
        newContext.budget = budgetInfo.amount;
        newContext.currency = budgetInfo.currency;
      }
    }

    if (questionId === 'duration') {
      const days = this.parseDurationToDays(answer);
      newContext.duration = days;
      if (newContext.budget) {
        newContext.dailyBudget = Math.floor(newContext.budget / days);
      }
    }

    return newContext;
  }

  // Validate answer against context
  validateAnswer(questionId: string, answer: any, context: QuestionContext): { valid: boolean; message?: string } {
    const question = this.questions.find(q => q.id === questionId);
    if (question?.validation) {
      return question.validation(answer, context);
    }
    return { valid: true };
  }

  // Generate initial questions based on context
  generateInitialQuestions(context: QuestionContext): SmartQuestion[] {
    const baseContext: QuestionContext = {
      ...context,
      previousAnswers: {}
    };

    return this.questions.map(question => ({
      ...question,
      text: this.customizeQuestionText(question, baseContext),
      options: this.generateOptionsForQuestion(question, baseContext)
    }));
  }
}

export const smartDynamicQuestionService = new SmartDynamicQuestionService();
export type { SmartQuestion, QuestionContext };