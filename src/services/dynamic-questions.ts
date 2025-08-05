// Dynamic Question System - PRD Compliant Implementation
// Generates context-aware questions based on user profile and website analysis

interface DynamicQuestion {
  id: string;
  text: string;
  options: string[];
  icon: string;
  multiSelect: boolean;
  priority: number;
  dependsOn?: Array<{
    questionId: string;
    operator: 'equals' | 'includes' | 'greater' | 'less';
    value: any;
  }>;
  validator?: (answer: any) => boolean;
  llmAssist?: boolean;
  promptTemplate?: string;
}

interface UserContext {
  themes: string[];
  contentType: string;
  hints: string[];
  socialLinks: Array<{ platform: string; url: string }>;
  audienceLocation?: string;
  previousAnswers?: Record<string, any>;
}

class DynamicQuestionService {
  private questionBank: DynamicQuestion[] = [
    // Budget questions (priority 1 - most important)
    {
      id: 'budget',
      text: 'What\'s your travel budget range?',
      options: ['$300-500', '$500-1000', '$1000-2500', '$2500-5000', '$5000+', 'Custom amount'],
      icon: '💸',
      multiSelect: false,
      priority: 1,
      validator: (answer) => answer && answer.length > 0
    },
    
    // Duration questions (priority 2)
    {
      id: 'duration',
      text: 'How long would you like to travel?',
      options: ['1-3 days', '4-7 days', '1-2 weeks', '2-4 weeks', '1+ months'],
      icon: '🗓️',
      multiSelect: false,
      priority: 2
    },
    
    // Content-specific questions (dynamic based on website analysis)
    {
      id: 'contentFocus',
      text: 'What type of content do you focus on creating?',
      options: [], // Will be populated dynamically
      icon: '📸',
      multiSelect: false,
      priority: 3,
      promptTemplate: 'Based on your website analysis showing {themes}, what content type best describes your focus?'
    },
    
    // Style questions (adaptive based on content type)
    {
      id: 'style',
      text: 'What\'s your preferred travel style?',
      options: [], // Will be populated dynamically
      icon: '🌍',
      multiSelect: false,
      priority: 4
    },
    
    // Climate questions (conditional)
    {
      id: 'climate',
      text: 'Select climate preferences (choose all that apply):',
      options: [
        'Tropical/Sunny',
        'Mild/Temperate', 
        'Cold/Snowy',
        'Desert/Arid',
        'No preference',
        'Avoid hot weather',
        'Avoid cold weather',
        'Avoid rainy season'
      ],
      icon: '☀️',
      multiSelect: true,
      priority: 5
    },
    
    // Brand collaboration questions (for business-focused creators)
    {
      id: 'brandCollaboration',
      text: 'Are you interested in brand collaboration opportunities?',
      options: ['Yes, actively seeking', 'Open to opportunities', 'Not interested', 'Only specific brands'],
      icon: '🤝',
      multiSelect: false,
      priority: 6,
      dependsOn: [
        { questionId: 'contentFocus', operator: 'includes', value: ['Business', 'Lifestyle', 'Fashion', 'Food'] }
      ]
    },
    
    // Creator networking questions
    {
      id: 'creatorNetworking',
      text: 'How important is connecting with local creators?',
      options: ['Very important', 'Somewhat important', 'Not important', 'Only if convenient'],
      icon: '👥',
      multiSelect: false,
      priority: 7
    },
    
    // Audience engagement questions  
    {
      id: 'audienceEngagement',
      text: 'What type of content gets the most engagement from your audience?',
      options: [], // Will be populated based on website analysis
      icon: '📈',
      multiSelect: true,
      priority: 8,
      llmAssist: true
    },
    
    // Specific interest questions (based on themes)
    {
      id: 'specificInterests',
      text: 'Based on your content themes, which interests you most?',
      options: [], // Dynamically generated
      icon: '🎯',
      multiSelect: true,
      priority: 9,
      promptTemplate: 'Your website shows interests in {themes}. Which specific aspects would you like to explore while traveling?'
    }
  ];

  async generateQuestionsForUser(userContext: UserContext): Promise<DynamicQuestion[]> {
    console.log('🧠 QUESTIONS: Generating dynamic questions based on user context...');
    console.log('User context:', { themes: userContext.themes, contentType: userContext.contentType });
    
    // Clone question bank and customize for user
    const customizedQuestions = await Promise.all(
      this.questionBank.map(async (question) => {
        const customized = { ...question };
        
        // Customize options based on user context
        if (question.id === 'contentFocus') {
          customized.options = this.generateContentFocusOptions(userContext);
          customized.text = this.personalizeQuestionText(question.promptTemplate || question.text, userContext);
        } else if (question.id === 'style') {
          customized.options = this.generateStyleOptions(userContext);
        } else if (question.id === 'audienceEngagement') {
          customized.options = await this.generateEngagementOptions(userContext);
        } else if (question.id === 'specificInterests') {
          customized.options = this.generateSpecificInterestOptions(userContext);
          customized.text = this.personalizeQuestionText(question.promptTemplate || question.text, userContext);
        }
        
        return customized;
      })
    );
    
    // Filter questions based on dependencies and relevance
    const relevantQuestions = this.filterRelevantQuestions(customizedQuestions, userContext);
    
    // Sort by priority
    const sortedQuestions = relevantQuestions.sort((a, b) => a.priority - b.priority);
    
    console.log(`✅ QUESTIONS: Generated ${sortedQuestions.length} personalized questions`);
    console.log('Questions:', sortedQuestions.map(q => `${q.id}: ${q.text}`));
    
    return sortedQuestions;
  }

  private generateContentFocusOptions(userContext: UserContext): string[] {
    const baseOptions = ['Photography', 'Food', 'Lifestyle', 'Adventure'];
    const themeBasedOptions: Record<string, string[]> = {
      'photography': ['Photography', 'Visual Arts', 'Street Photography', 'Landscape Photography'],
      'food': ['Food & Culinary', 'Restaurant Reviews', 'Cooking', 'Local Cuisine'],
      'travel': ['Travel Blogging', 'Adventure Travel', 'Cultural Exploration', 'Budget Travel'],
      'lifestyle': ['Lifestyle', 'Fashion', 'Wellness', 'Personal Development'],
      'business': ['Business Travel', 'Entrepreneurship', 'Networking', 'Professional Development'],
      'technology': ['Tech Reviews', 'Digital Nomad', 'Innovation', 'Startup Culture'],
      'culture': ['Cultural Exploration', 'History', 'Art & Museums', 'Local Traditions'],
      'adventure': ['Adventure Sports', 'Outdoor Activities', 'Extreme Sports', 'Nature Exploration']
    };
    
    const customOptions = new Set<string>();
    
    // Add options based on user themes
    userContext.themes.forEach(theme => {
      const lowerTheme = theme.toLowerCase();
      Object.keys(themeBasedOptions).forEach(key => {
        if (lowerTheme.includes(key) || key.includes(lowerTheme)) {
          themeBasedOptions[key].forEach(option => customOptions.add(option));
        }
      });
    });
    
    // Add base options if no specific matches
    if (customOptions.size === 0) {
      baseOptions.forEach(option => customOptions.add(option));
    }
    
    // Always include the detected content type
    if (userContext.contentType) {
      customOptions.add(userContext.contentType);
    }
    
    return Array.from(customOptions).slice(0, 6); // Limit to 6 options
  }

  private generateStyleOptions(userContext: UserContext): string[] {
    const baseOptions = ['Adventure', 'Luxury', 'Cultural', 'Beach', 'Urban'];
    const contentTypeOptions: Record<string, string[]> = {
      'photography': ['Visual/Scenic', 'Street Photography', 'Landscape', 'Architecture'],
      'food': ['Culinary Tours', 'Street Food', 'Fine Dining', 'Local Markets'],
      'adventure': ['Outdoor Adventure', 'Extreme Sports', 'Nature Exploration', 'Active Travel'],
      'luxury': ['Luxury Travel', 'Premium Experiences', 'High-end Accommodations', 'Exclusive Access'],
      'business': ['Business Class', 'Networking Events', 'Professional Development', 'Executive Travel'],
      'budget': ['Budget-Friendly', 'Backpacking', 'Hostel Culture', 'Local Experiences']
    };
    
    const themes = userContext.themes.join(' ').toLowerCase();
    const contentType = userContext.contentType.toLowerCase();
    
    // Determine style options based on content analysis
    let styleOptions = [...baseOptions];
    
    Object.keys(contentTypeOptions).forEach(key => {
      if (themes.includes(key) || contentType.includes(key)) {
        styleOptions = [...styleOptions, ...contentTypeOptions[key]];
      }
    });
    
    return Array.from(new Set(styleOptions)).slice(0, 6);
  }

  private async generateEngagementOptions(userContext: UserContext): Promise<string[]> {
    const baseOptions = [
      'Behind-the-scenes content',
      'Travel tips and guides',
      'Photo/video content',
      'Personal stories',
      'Educational content',
      'Interactive Q&A'
    ];
    
    // Use LLM to analyze user's content for engagement patterns
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return baseOptions;
      }
      
      const prompt = `Based on this content creator profile:
- Themes: ${userContext.themes.join(', ')}
- Content Type: ${userContext.contentType}
- Hints: ${userContext.hints.join(', ')}

Generate 4-6 specific content types that would likely get high engagement for this creator. Return as a simple JSON array of strings.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const jsonMatch = aiResponse?.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const aiOptions = JSON.parse(jsonMatch[0]);
          return Array.isArray(aiOptions) ? aiOptions : baseOptions;
        }
      }
    } catch (error) {
      console.warn('⚠️ QUESTIONS: Failed to generate AI engagement options:', error instanceof Error ? error.message : String(error));
    }
    
    return baseOptions;
  }

  private generateSpecificInterestOptions(userContext: UserContext): string[] {
    const interestMap: Record<string, string[]> = {
      'photography': ['Architecture photography', 'Portrait sessions', 'Landscape shoots', 'Street photography'],
      'food': ['Local street food', 'Fine dining experiences', 'Cooking classes', 'Food markets'],
      'adventure': ['Hiking trails', 'Water sports', 'Rock climbing', 'Wildlife encounters'],
      'culture': ['Museums and galleries', 'Historical sites', 'Local festivals', 'Traditional crafts'],
      'lifestyle': ['Wellness retreats', 'Fashion scenes', 'Local customs', 'Social experiences'],
      'business': ['Coworking spaces', 'Networking events', 'Industry conferences', 'Startup ecosystems']
    };
    
    const interests = new Set<string>();
    
    userContext.themes.forEach(theme => {
      const lowerTheme = theme.toLowerCase();
      Object.keys(interestMap).forEach(key => {
        if (lowerTheme.includes(key) || key.includes(lowerTheme)) {
          interestMap[key].forEach(interest => interests.add(interest));
        }
      });
    });
    
    return Array.from(interests).slice(0, 8); // Limit to 8 options
  }

  private personalizeQuestionText(template: string, userContext: UserContext): string {
    return template.replace('{themes}', userContext.themes.join(', '));
  }

  private filterRelevantQuestions(questions: DynamicQuestion[], userContext: UserContext): DynamicQuestion[] {
    return questions.filter(question => {
      // Always include core questions (budget, duration)
      if (['budget', 'duration'].includes(question.id)) {
        return true;
      }
      
      // Check dependencies
      if (question.dependsOn) {
        const dependenciesMet = question.dependsOn.every(dep => {
          const answer = userContext.previousAnswers?.[dep.questionId];
          if (!answer) return false;
          
          switch (dep.operator) {
            case 'equals':
              return answer === dep.value;
            case 'includes':
              return Array.isArray(dep.value) ? dep.value.some(v => answer.includes?.(v)) : answer.includes?.(dep.value);
            case 'greater':
              return parseFloat(answer) > dep.value;
            case 'less':
              return parseFloat(answer) < dep.value;
            default:
              return false;
          }
        });
        
        if (!dependenciesMet) {
          console.log(`Filtering out question ${question.id} - dependencies not met`);
          return false;
        }
      }
      
      // Filter based on content relevance
      if (question.id === 'brandCollaboration') {
        const businessOriented = userContext.themes.some(theme => 
          ['business', 'lifestyle', 'fashion', 'food', 'beauty'].includes(theme.toLowerCase())
        );
        if (!businessOriented) {
          console.log(`Filtering out question ${question.id} - not business oriented`);
          return false;
        }
      }
      
      return true;
    });
  }

  // Method to get next question based on current answers
  async getNextQuestion(
    questions: DynamicQuestion[], 
    currentAnswers: Record<string, any>
  ): Promise<DynamicQuestion | null> {
    
    // Find first unanswered question
    for (const question of questions) {
      if (!currentAnswers[question.id]) {
        // Check if dependencies are satisfied
        if (question.dependsOn) {
          const dependenciesMet = question.dependsOn.every(dep => {
            const answer = currentAnswers[dep.questionId];
            if (!answer) return false;
            
            switch (dep.operator) {
              case 'equals':
                return answer === dep.value;
              case 'includes':
                return Array.isArray(dep.value) ? 
                  dep.value.some(v => answer.includes?.(v)) : 
                  answer.includes?.(dep.value);
              default:
                return false;
            }
          });
          
          if (!dependenciesMet) continue;
        }
        
        return question;
      }
    }
    
    return null; // All questions answered
  }

  // Method to validate question constraints
  validateConstraints(answers: Record<string, any>): { valid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    
    // Budget vs Style validation
    if (answers.budget && answers.style) {
      const budget = this.extractBudgetNumber(answers.budget);
      const style = answers.style.toLowerCase();
      
      if (budget < 1000 && style.includes('luxury')) {
        conflicts.push('Luxury travel typically requires a higher budget than selected');
      }
      
      if (budget > 5000 && style.includes('budget')) {
        conflicts.push('Your budget suggests premium options rather than budget travel');
      }
    }
    
    // Duration vs Activities validation
    if (answers.duration && answers.specificInterests) {
      const duration = this.extractDurationDays(answers.duration);
      const interests = Array.isArray(answers.specificInterests) ? answers.specificInterests : [answers.specificInterests];
      
      if (duration <= 3 && interests.length > 4) {
        conflicts.push('Your trip duration may be too short for all selected activities');
      }
    }
    
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  private extractBudgetNumber(budgetString: string): number {
    const match = budgetString.match(/\$?(\d+)/);
    return match ? parseInt(match[1]) : 1500;
  }

  private extractDurationDays(durationString: string): number {
    if (durationString.includes('week')) {
      const weeks = parseInt(durationString) || 1;
      return weeks * 7;
    }
    const days = parseInt(durationString) || 7;
    return days;
  }
}

export const dynamicQuestionService = new DynamicQuestionService();
export type { DynamicQuestion, UserContext };