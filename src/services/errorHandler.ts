// Centralized Error Handling and Fallback System
// Provides comprehensive error handling for all services

export interface ServiceError {
  service: string;
  operation: string;
  error: Error;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FallbackOptions {
  useCache?: boolean;
  retryCount?: number;
  timeout?: number;
  gracefulDegradation?: boolean;
}

class ErrorHandler {
  private errors: ServiceError[] = [];
  private readonly maxErrorHistory = 100;

  logError(service: string, operation: string, error: Error, severity: ServiceError['severity'] = 'medium'): void {
    const serviceError: ServiceError = {
      service,
      operation,
      error,
      timestamp: new Date(),
      severity
    };

    this.errors.push(serviceError);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(-this.maxErrorHistory);
    }

    // Log based on severity
    switch (severity) {
      case 'critical':
        console.error(`[CRITICAL] ${service}.${operation}:`, error);
        break;
      case 'high':
        console.error(`[HIGH] ${service}.${operation}:`, error);
        break;
      case 'medium':
        console.warn(`[MEDIUM] ${service}.${operation}:`, error);
        break;
      case 'low':
        console.info(`[LOW] ${service}.${operation}:`, error);
        break;
    }
  }

  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T> | T,
    service: string,
    operation: string,
    options: FallbackOptions = {}
  ): Promise<T> {
    const { retryCount = 1, timeout = 10000, gracefulDegradation = true } = options;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Set timeout for the operation
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        );

        const result = await Promise.race([
          primaryOperation(),
          timeoutPromise
        ]);

        // Success - clear any previous errors for this operation
        this.clearOperationErrors(service, operation);
        return result;
      } catch (error) {
        const isLastAttempt = attempt === retryCount;
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        this.logError(
          service, 
          operation, 
          errorInstance,
          isLastAttempt ? 'high' : 'medium'
        );

        if (isLastAttempt) {
          if (gracefulDegradation) {
            try {
              const fallbackResult = await fallbackOperation();
              console.warn(`Using fallback for ${service}.${operation}`);
              return fallbackResult;
            } catch (fallbackError) {
              this.logError(
                service,
                `${operation}_fallback`,
                fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
                'critical'
              );
              throw new Error(`Both primary and fallback operations failed for ${service}.${operation}`);
            }
          } else {
            throw errorInstance;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryCount) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error('Unexpected error in withFallback');
  }

  getServiceHealth(): Record<string, { errorCount: number; lastError?: Date; status: 'healthy' | 'degraded' | 'failing' }> {
    const serviceHealth: Record<string, { errorCount: number; lastError?: Date; status: 'healthy' | 'degraded' | 'failing' }> = {};
    
    // Count errors by service in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    
    const services = ['qloo', 'budget', 'creator', 'places', 'factcheck', 'scoring', 'llm'];
    
    services.forEach(service => {
      const serviceErrors = recentErrors.filter(e => e.service === service);
      const errorCount = serviceErrors.length;
      const lastError = serviceErrors.length > 0 ? 
        serviceErrors[serviceErrors.length - 1].timestamp : undefined;
      
      let status: 'healthy' | 'degraded' | 'failing';
      if (errorCount === 0) {
        status = 'healthy';
      } else if (errorCount < 5) {
        status = 'degraded';
      } else {
        status = 'failing';
      }
      
      serviceHealth[service] = { errorCount, lastError, status };
    });
    
    return serviceHealth;
  }

  getRecentErrors(limit: number = 10): ServiceError[] {
    return this.errors
      .slice(-limit)
      .reverse(); // Most recent first
  }

  clearOperationErrors(service: string, operation: string): void {
    this.errors = this.errors.filter(e => 
      !(e.service === service && e.operation === operation)
    );
  }

  clearAllErrors(): void {
    this.errors = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specific fallback generators for common scenarios
  generateFallbackTasteProfile(): { culturalAffinities: string[]; personalityTraits: string[]; tasteVector: Record<string, number>; confidence: number } {
    return {
      culturalAffinities: ['Global Culture'],
      personalityTraits: ['Explorer'],
      tasteVector: {
        adventure: 0.5,
        culture: 0.5,
        luxury: 0.3,
        food: 0.4,
        nature: 0.4,
        urban: 0.3,
        budget: 0.6,
        relaxation: 0.3,
        photography: 0.4,
        social: 0.4
      },
      confidence: 0.6
    };
  }

  generateFallbackBudget(): { flights: { price: number; currency: string; roundTrip: boolean }; accommodation: { pricePerNight: number; totalPrice: number; currency: string; category: string }; livingExpenses: { dailyBudget: number; totalBudget: number; currency: string; breakdown: { meals: number; transport: number; activities: number; miscellaneous: number } }; totalEstimate: { min: number; max: number; currency: string } } {
    return {
      flights: {
        price: 800,
        currency: 'USD',
        roundTrip: true
      },
      accommodation: {
        pricePerNight: 100,
        totalPrice: 700,
        currency: 'USD',
        category: 'mid-range'
      },
      livingExpenses: {
        dailyBudget: 80,
        totalBudget: 560,
        currency: 'USD',
        breakdown: {
          meals: 32,
          transport: 16,
          activities: 24,
          miscellaneous: 8
        }
      },
      totalEstimate: {
        min: 1800,
        max: 2200,
        currency: 'USD'
      }
    };
  }

  generateFallbackRecommendation(destination: string, matchScore: number = 75): Record<string, unknown> {
    return {
      destination,
      matchScore,
      summary: `${destination} offers good potential for content creators based on general travel appeal.`,
      highlights: [
        'Popular travel destination',
        'Good photo opportunities',
        'Content creation potential'
      ],
      detailedDescription: `${destination} is a well-known destination that offers various opportunities for content creation and audience engagement.`,
      contentOpportunities: {
        videoIdeas: ['Local exploration', 'Cultural experiences', 'Food discoveries'],
        photoSpots: ['Scenic viewpoints', 'Local landmarks', 'Cultural sites'],
        storytellingAngles: ['Cultural immersion', 'Travel adventure', 'Local discoveries']
      },
      brandCollaborations: {
        suggestedBrands: ['Travel gear', 'Local brands', 'Tourism boards'],
        collaborationTypes: ['Sponsored content', 'Product reviews'],
        monetizationPotential: 'Moderate potential'
      },
      localCreators: {
        topCollaborators: [],
        networkingOpportunities: ['Local creator communities']
      },
      budgetBreakdown: {
        summary: 'Estimated moderate budget destination',
        costEfficiency: 'Good value for content creation',
        savingTips: ['Book in advance', 'Use local transportation'],
        splurgeRecommendations: ['Unique experiences']
      },
      bestTimeToVisit: {
        months: ['Year-round'],
        reasoning: 'Generally suitable for travel',
        events: []
      },
      practicalInfo: {
        visa: 'Check visa requirements',
        language: 'Local language varies',
        currency: 'Local currency',
        safetyTips: ['General travel safety'],
        culturalTips: ['Respect local customs']
      },
      confidence: 0.6,
      factChecked: false
    };
  }

  // Circuit breaker functionality
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; state: 'closed' | 'open' | 'half-open' }> = new Map();
  
  isCircuitOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;
    
    const now = new Date();
    const timeSinceLastFailure = now.getTime() - breaker.lastFailure.getTime();
    
    // Reset after 5 minutes
    if (timeSinceLastFailure > 5 * 60 * 1000) {
      this.circuitBreakers.set(service, { failures: 0, lastFailure: now, state: 'closed' });
      return false;
    }
    
    return breaker.state === 'open' && breaker.failures >= 5;
  }

  recordCircuitBreakerFailure(service: string): void {
    const breaker = this.circuitBreakers.get(service) || { failures: 0, lastFailure: new Date(), state: 'closed' as const };
    breaker.failures++;
    breaker.lastFailure = new Date();
    
    if (breaker.failures >= 5) {
      breaker.state = 'open';
      console.warn(`Circuit breaker OPEN for service: ${service}`);
    }
    
    this.circuitBreakers.set(service, breaker);
  }
}

export const errorHandler = new ErrorHandler();