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
    // Question 1: Budget (Always first)
    {
      id: 'budget',
      text: 'What\'s your total travel budget?',
      options: [], // Dynamic based on location
      icon: '💸',
      multiSelect: false,
      priority: 1,
      budgetSensitive: false,
      durationSensitive: false,
      validation: (answer, context) => {
        const budget = this.parseBudgetAmount(answer);
        if (budget < 50) {
          return { valid: false, message: 'Budget too low for travel recommendations' };
        }
        return { valid: true };
      }
    },

    // Question 2: Duration (Budget-aware)
    {
      id: 'duration',
      text: 'How long would you like to travel?',
      options: [], // Dynamic based on budget
      icon: '🗓️',
      multiSelect: false,
      priority: 2,
      budgetSensitive: true,
      durationSensitive: false,
      validation: (answer, context) => {
        const days = this.parseDurationToDays(answer);
        const dailyBudget = context.budget ? context.budget / days : 0;
        if (dailyBudget < 20) {
          return { 
            valid: false, 
            message: `With your budget, ${days} days would mean only ${context.currency || '$'}${dailyBudget.toFixed(0)}/day. Consider shorter duration.` 
          };
        }
        return { valid: true };
      }
    },

    // Question 3: Travel Style (Budget + Duration aware)
    {
      id: 'style',
      text: 'What travel style fits your budget?',
      options: [], // Dynamic based on daily budget
      icon: '🌍',
      multiSelect: false,
      priority: 3,
      budgetSensitive: true,
      durationSensitive: true
    },

    // Question 4: Priorities (Highly contextual)
    {
      id: 'priorities',
      text: 'What are your top priorities?',
      options: [], // Based on daily budget and content type
      icon: '🎯',
      multiSelect: true,
      priority: 4,
      budgetSensitive: true,
      durationSensitive: true
    },

    // Question 5: Accommodation (Budget-aware)
    {
      id: 'accommodation',
      text: 'Preferred accommodation type?',
      options: [], // Based on accommodation budget (30% of total)
      icon: '🏨',
      multiSelect: false,
      priority: 5,
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

    // Complete after 5 questions
    if (questionNumber > 5) {
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
      case 'budget':
        return 'What\'s your total travel budget?';
      
      case 'duration':
        if (budget) {
          return `With your ${currency}${budget} budget, how long would you like to travel?`;
        }
        return question.text;
      
      case 'style':
        if (context.dailyBudget) {
          const category = this.getBudgetCategory(context.dailyBudget);
          return `With ${currency}${context.dailyBudget}/day (${category}), what travel style do you prefer?`;
        }
        return question.text;
      
      case 'priorities':
        if (duration && context.dailyBudget) {
          return `For your ${duration}-day trip with ${currency}${context.dailyBudget}/day, what matters most?`;
        }
        return question.text;
      
      case 'accommodation':
        if (context.dailyBudget) {
          const accomBudget = Math.floor(context.dailyBudget * 0.3);
          return `With ~${currency}${accomBudget}/night for accommodation, what do you prefer?`;
        }
        return question.text;
      
      default:
        return question.text;
    }
  }

  private generateOptionsForQuestion(question: SmartQuestion, context: QuestionContext): string[] {
    switch (question.id) {
      case 'budget':
        return this.generateBudgetOptions(context);
      
      case 'duration':
        return this.generateDurationOptions(context);
      
      case 'style':
        return this.generateStyleOptions(context);
      
      case 'priorities':
        return this.generatePriorityOptions(context);
      
      case 'accommodation':
        return this.generateAccommodationOptions(context);
      
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
    const { budget, currency } = context;
    
    if (!budget) {
      return ['1-2 days', '3-5 days', '1 week', '2 weeks', '1 month'];
    }

    // Calculate realistic duration options based on budget
    const options: string[] = [];
    
    // Minimum daily budget thresholds
    const minDailyBudgets = {
      ultraBudget: 25,  // $25/day minimum
      budget: 50,       // $50/day minimum
      midRange: 100,    // $100/day minimum
      premium: 200      // $200/day minimum
    };

    // Convert to local currency if needed
    const multiplier = this.getCurrencyMultiplier(currency || '$');
    const adjustedMinimums = Object.fromEntries(
      Object.entries(minDailyBudgets).map(([key, value]) => [key, value * multiplier])
    );

    // Calculate max days for each category
    const maxDays = {
      ultraBudget: Math.floor(budget / adjustedMinimums.ultraBudget),
      budget: Math.floor(budget / adjustedMinimums.budget),
      midRange: Math.floor(budget / adjustedMinimums.midRange),
      premium: Math.floor(budget / adjustedMinimums.premium)
    };

    // Add realistic options
    if (maxDays.premium >= 1) options.push('1 day');
    if (maxDays.premium >= 2) options.push('2 days');
    if (maxDays.midRange >= 3) options.push('3-4 days');
    if (maxDays.midRange >= 5) options.push('5-7 days');
    if (maxDays.budget >= 7) options.push('1 week');
    if (maxDays.budget >= 10) options.push('10 days');
    if (maxDays.budget >= 14) options.push('2 weeks');
    if (maxDays.ultraBudget >= 21) options.push('3 weeks');
    if (maxDays.ultraBudget >= 30) options.push('1 month');

    // Ensure at least 3 options
    if (options.length < 3) {
      const days = Math.floor(budget / (adjustedMinimums.budget * 0.7)); // More flexible
      options.push(`${Math.max(1, Math.floor(days * 0.5))} days`);
      options.push(`${Math.max(2, Math.floor(days * 0.7))} days`);
      options.push(`${Math.max(3, days)} days`);
    }

    return [...new Set(options)].slice(0, 6);
  }

  private generateStyleOptions(context: QuestionContext): string[] {
    const dailyBudget = context.dailyBudget || 50;
    const category = this.getBudgetCategory(dailyBudget);
    
    const stylesByCategory = {
      'ultra-budget': [
        'Backpacking & hostels',
        'Local experiences',
        'Street food adventures',
        'Free walking tours',
        'Couchsurfing culture'
      ],
      'budget': [
        'Budget-friendly exploration',
        'Local transport & food',
        'Hostel socializing',
        'Free attractions focus',
        'Authentic local experiences'
      ],
      'mid-range': [
        'Comfortable travel',
        'Mix of experiences',
        'Good hotels & local food',
        'Some guided tours',
        'Balanced adventure & comfort'
      ],
      'premium': [
        'Quality accommodations',
        'Curated experiences',
        'Fine dining occasions',
        'Private transportation',
        'Exclusive access'
      ],
      'luxury': [
        'Luxury accommodations',
        'VIP experiences',
        'Fine dining focus',
        'Private guides',
        'Exclusive venues'
      ]
    };

    return stylesByCategory[category] || stylesByCategory['budget'];
  }

  private generatePriorityOptions(context: QuestionContext): string[] {
    const dailyBudget = context.dailyBudget || 50;
    const themes = context.themes.join(' ').toLowerCase();
    
    const options: string[] = [];
    
    // Budget-appropriate base options
    if (dailyBudget < 40) {
      options.push('Free attractions & nature');
      options.push('Street food & markets');
      options.push('Walking tours');
      options.push('Local transportation');
    } else if (dailyBudget < 100) {
      options.push('Cultural sites & museums');
      options.push('Local restaurants');
      options.push('Public attractions');
      options.push('Some guided experiences');
    } else if (dailyBudget < 200) {
      options.push('Premium attractions');
      options.push('Quality dining');
      options.push('Private transportation');
      options.push('Guided tours');
    } else {
      options.push('Exclusive experiences');
      options.push('Fine dining');
      options.push('VIP access');
      options.push('Private guides');
    }

    // Add theme-based options
    if (themes.includes('photography')) {
      options.push('Photography opportunities');
    }
    if (themes.includes('food')) {
      options.push('Culinary experiences');
    }
    if (themes.includes('adventure')) {
      options.push('Adventure activities');
    }
    if (themes.includes('culture')) {
      options.push('Cultural immersion');
    }
    if (themes.includes('business')) {
      options.push('Networking opportunities');
    }

    return [...new Set(options)].slice(0, 8);
  }

  private generateAccommodationOptions(context: QuestionContext): string[] {
    const dailyBudget = context.dailyBudget || 50;
    const accomBudget = Math.floor(dailyBudget * 0.3); // 30% of daily budget
    
    const options: string[] = [];
    
    if (accomBudget < 15) {
      options.push('Hostels (shared rooms)');
      options.push('Couchsurfing');
      options.push('Camping');
      options.push('Ultra-budget guesthouses');
    } else if (accomBudget < 40) {
      options.push('Private hostel rooms');
      options.push('Budget hotels');
      options.push('Guesthouses');
      options.push('Shared Airbnb');
    } else if (accomBudget < 80) {
      options.push('Mid-range hotels');
      options.push('Private Airbnb');
      options.push('Boutique guesthouses');
      options.push('Business hotels');
    } else if (accomBudget < 150) {
      options.push('Quality hotels');
      options.push('Upscale Airbnb');
      options.push('Boutique hotels');
      options.push('Resort properties');
    } else {
      options.push('Luxury hotels');
      options.push('Premium resorts');
      options.push('Five-star properties');
      options.push('Exclusive accommodations');
    }

    return options.slice(0, 6);
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
    const multipliers = {
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

    if (questionId === 'duration' && newContext.budget) {
      const days = this.parseDurationToDays(answer);
      newContext.duration = days;
      newContext.dailyBudget = Math.floor(newContext.budget / days);
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
}

export const smartDynamicQuestionService = new SmartDynamicQuestionService();
export type { SmartQuestion, QuestionContext };