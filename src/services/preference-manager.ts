// Preference Manager Service
// Handles optimistic updates, delta changes, and smooth UX for preference editing

interface PreferenceState {
  answers: Record<string, any>;
  lastRecommendationAnswers?: Record<string, any>;
  isDirty: boolean;
  isOptimisticUpdate: boolean;
}

interface PreferenceDelta {
  changed: Record<string, { old: any; new: any }>;
  added: Record<string, any>;
  removed: string[];
}

class PreferenceManager {
  private state: PreferenceState = {
    answers: {},
    isDirty: false,
    isOptimisticUpdate: false
  };

  private listeners: Array<(state: PreferenceState) => void> = [];

  // Update a single preference with optimistic UI
  updatePreference(questionId: string, newValue: any, isOptimistic = false): void {
    const oldValue = this.state.answers[questionId];
    
    this.state = {
      ...this.state,
      answers: {
        ...this.state.answers,
        [questionId]: newValue
      },
      isDirty: true,
      isOptimisticUpdate: isOptimistic
    };

    // Notify listeners for UI updates
    this.notifyListeners();

    // Log the change for debugging/analytics
    console.log('🔄 PREFERENCE: Updated', {
      questionId,
      oldValue,
      newValue,
      isOptimistic,
      dailyBudgetImpact: this.calculateDailyBudgetImpact(questionId, newValue)
    });
  }

  // Batch update multiple preferences
  updateMultiplePreferences(updates: Record<string, any>, isOptimistic = false): void {
    this.state = {
      ...this.state,
      answers: {
        ...this.state.answers,
        ...updates
      },
      isDirty: true,
      isOptimisticUpdate: isOptimistic
    };

    this.notifyListeners();
    
    console.log('🔄 PREFERENCE: Batch updated', {
      updatedKeys: Object.keys(updates),
      isOptimistic
    });
  }

  // Calculate what changed since last recommendation generation
  calculateDelta(): PreferenceDelta {
    const lastAnswers = this.state.lastRecommendationAnswers || {};
    const currentAnswers = this.state.answers;

    const delta: PreferenceDelta = {
      changed: {},
      added: {},
      removed: []
    };

    // Find changed values
    Object.keys(currentAnswers).forEach(key => {
      if (lastAnswers[key] !== undefined && lastAnswers[key] !== currentAnswers[key]) {
        delta.changed[key] = {
          old: lastAnswers[key],
          new: currentAnswers[key]
        };
      } else if (lastAnswers[key] === undefined) {
        delta.added[key] = currentAnswers[key];
      }
    });

    // Find removed values
    Object.keys(lastAnswers).forEach(key => {
      if (currentAnswers[key] === undefined) {
        delta.removed.push(key);
      }
    });

    return delta;
  }

  // Check if we should do a full regeneration or incremental update
  shouldDoFullRegeneration(): boolean {
    const delta = this.calculateDelta();
    
    // Full regeneration if budget or duration changed (major impact)
    const majorChangeKeys = ['budget', 'duration'];
    const hasMajorChange = majorChangeKeys.some(key => 
      delta.changed[key] || delta.added[key] || delta.removed.includes(key)
    );

    if (hasMajorChange) {
      console.log('🔄 PREFERENCE: Major change detected, full regeneration needed');
      return true;
    }

    // Full regeneration if too many changes
    const totalChanges = Object.keys(delta.changed).length + Object.keys(delta.added).length + delta.removed.length;
    if (totalChanges >= 3) {
      console.log('🔄 PREFERENCE: Multiple changes detected, full regeneration needed');
      return true;
    }

    return false;
  }

  // Get optimized API payload (full or delta)
  getAPIPayload(): { type: 'full' | 'delta'; data: any } {
    if (this.shouldDoFullRegeneration()) {
      return {
        type: 'full',
        data: {
          answers: this.state.answers,
          regenerationType: 'full'
        }
      };
    } else {
      const delta = this.calculateDelta();
      return {
        type: 'delta',
        data: {
          delta,
          currentAnswers: this.state.answers,
          regenerationType: 'incremental'
        }
      };
    }
  }

  // Mark current state as "used for recommendations"
  markAsUsedForRecommendations(): void {
    this.state = {
      ...this.state,
      lastRecommendationAnswers: { ...this.state.answers },
      isDirty: false,
      isOptimisticUpdate: false
    };
    
    console.log('✅ PREFERENCE: Marked current state as baseline for recommendations');
  }

  // Smart validation with budget constraints
  validatePreference(questionId: string, value: any): { valid: boolean; warning?: string; suggestion?: string } {
    const answers = { ...this.state.answers, [questionId]: value };
    
    if (questionId === 'duration' && answers.budget) {
      const budgetAmount = this.extractBudgetAmount(answers.budget);
      const durationDays = this.parseDurationToDays(value);
      const dailyBudget = budgetAmount / durationDays;
      
      if (dailyBudget < 30) {
        return {
          valid: false,
          warning: `With ${value}, your daily budget would be only $${dailyBudget.toFixed(0)}`,
          suggestion: 'Consider shorter duration or higher budget'
        };
      }
      
      if (dailyBudget < 50) {
        return {
          valid: true,
          warning: `Daily budget: $${dailyBudget.toFixed(0)} (budget travel)`,
          suggestion: 'Recommendations will focus on budget-friendly options'
        };
      }
    }

    if (questionId === 'budget' && answers.duration) {
      const budgetAmount = this.extractBudgetAmount(value);
      const durationDays = this.parseDurationToDays(answers.duration);
      const dailyBudget = budgetAmount / durationDays;
      
      if (dailyBudget > 500) {
        return {
          valid: true,
          warning: `Daily budget: $${dailyBudget.toFixed(0)} (luxury travel)`,
          suggestion: 'You can afford premium experiences and accommodations'
        };
      }
    }

    return { valid: true };
  }

  // Calculate budget impact of a change
  private calculateDailyBudgetImpact(questionId: string, newValue: any): string | null {
    if (questionId !== 'budget' && questionId !== 'duration') return null;

    const currentBudget = questionId === 'budget' ? newValue : this.state.answers.budget;
    const currentDuration = questionId === 'duration' ? newValue : this.state.answers.duration;

    if (!currentBudget || !currentDuration) return null;

    const budgetAmount = this.extractBudgetAmount(currentBudget);
    const durationDays = this.parseDurationToDays(currentDuration);
    const dailyBudget = Math.floor(budgetAmount / durationDays);

    return `$${dailyBudget}/day`;
  }

  private extractBudgetAmount(budgetString: string): number {
    const match = budgetString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1000;
  }

  private parseDurationToDays(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    if (lowerDuration.includes('week')) {
      const weeks = parseInt(lowerDuration) || 1;
      return weeks * 7;
    }
    return parseInt(lowerDuration) || 7;
  }

  // Subscription for UI updates
  subscribe(listener: (state: PreferenceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Getters
  get currentAnswers(): Record<string, any> {
    return { ...this.state.answers };
  }

  get isDirty(): boolean {
    return this.state.isDirty;
  }

  get isOptimistic(): boolean {
    return this.state.isOptimisticUpdate;
  }

  // Initialize with existing answers
  initialize(answers: Record<string, any>): void {
    this.state = {
      answers: { ...answers },
      lastRecommendationAnswers: { ...answers },
      isDirty: false,
      isOptimisticUpdate: false
    };

    console.log('🎯 PREFERENCE: Initialized with', Object.keys(answers).length, 'preferences');
  }

  // Reset to clean state
  reset(): void {
    this.state = {
      answers: {},
      isDirty: false,
      isOptimisticUpdate: false
    };
    this.notifyListeners();
  }
}

export const preferenceManager = new PreferenceManager();
export type { PreferenceState, PreferenceDelta };