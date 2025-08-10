// API Key Validation and Safe Handling
// Prevents errors when API keys are missing or invalid

interface ApiKeyStatus {
  isValid: boolean;
  keyName: string;
  isRequired: boolean;
  fallbackAvailable: boolean;
}

class ApiValidator {
  private keyStatus: Map<string, ApiKeyStatus> = new Map();

  constructor() {
    this.initializeKeyStatus();
  }

  // PRD-compliant scoring with neutral values for missing signals
  calculatePRDScore(signals: any): number {
    const weights = {
      qlooAffinity: 0.45,
      communityEngagement: 0.25, 
      brandCollaboration: 0.15,
      budgetAlignment: 0.10,
      localCreator: 0.05
    };

    // Use neutral values (0.5) for missing signals - DO NOT renormalize weights
    const normalizedSignals = {
      qlooAffinity: this.sanitizeScore(signals.qloo?.affinity ?? 0.5),
      communityEngagement: this.sanitizeScore(this.calculateCommunityEngagement(signals) ?? 0.5),
      brandCollaboration: this.sanitizeScore(signals.brand?.fit ?? 0.5), 
      budgetAlignment: this.sanitizeScore(signals.budget?.alignment ?? 0.5),
      localCreator: this.sanitizeScore(signals.creator?.collaboration ?? 0.5)
    };

    console.log('🎯 SCORING: Using PRD weights with neutral fallbacks:', {
      weights,
      signals: normalizedSignals,
      missingSignals: this.getMissingSignals(signals)
    });

    // Calculate weighted score and ensure valid result
    const totalScore = Object.entries(weights).reduce((score, [key, weight]) => {
      const signalValue = normalizedSignals[key as keyof typeof normalizedSignals];
      return score + (signalValue * weight);
    }, 0);

    return this.sanitizeScore(totalScore);
  }

  // Sanitize scores to prevent NaN and ensure valid range
  private sanitizeScore(score: any): number {
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      console.warn('⚠️ SCORING: Invalid score detected, using neutral value:', score);
      return 0.5; // Neutral fallback
    }
    
    // Clamp to valid range [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  private calculateCommunityEngagement(signals: any): number | null {
    const platformSignals = [];
    
    if (this.isKeyValid('YOUTUBE_API_KEY') && signals.youtube) {
      platformSignals.push(signals.youtube.engagement || 0.5);
    }
    if (this.isKeyValid('INSTAGRAM_ACCESS_TOKEN') && signals.instagram) {
      platformSignals.push(signals.instagram.engagement || 0.5);
    }
    if (this.isKeyValid('TIKTOK_CLIENT_KEY') && signals.tiktok) {
      platformSignals.push(signals.tiktok.engagement || 0.5);
    }

    if (platformSignals.length === 0) {
      console.log('⚠️ ENGAGEMENT: No social platforms available - using neutral');
      return null; // Will use 0.5 neutral value
    }

    return platformSignals.reduce((sum, val) => sum + val, 0) / platformSignals.length;
  }

  private getMissingSignals(signals: any): string[] {
    const missing = [];
    if (!signals.qloo || !this.isKeyValid('QLOO_API_KEY')) missing.push('qloo');
    if (!signals.youtube || !this.isKeyValid('YOUTUBE_API_KEY')) missing.push('youtube');
    if (!signals.budget || !this.isKeyValid('AMADEUS_API_KEY')) missing.push('budget');
    return missing;
  }

  private initializeKeyStatus() {
    const apiKeys = [
      { name: 'GEMINI_API_KEY', required: false, fallback: true },
      { name: 'QLOO_API_KEY', required: false, fallback: true },
      { name: 'YOUTUBE_API_KEY', required: false, fallback: true },
      { name: 'GOOGLE_PLACES_API_KEY', required: false, fallback: true },
      { name: 'AMADEUS_API_KEY', required: false, fallback: true },
      { name: 'AMADEUS_API_SECRET', required: false, fallback: true },
      { name: 'NUMBEO_API_KEY', required: false, fallback: true }
    ];

    apiKeys.forEach(key => {
      const value = process.env[key.name];
      const isValid = value && 
                     value !== 'your_api_key_here' && 
                     value !== 'your_key_here' && 
                     value.length > 10;

      this.keyStatus.set(key.name, {
        isValid: Boolean(isValid),
        keyName: key.name,
        isRequired: key.required,
        fallbackAvailable: key.fallback
      });
    });
  }

  isKeyValid(keyName: string): boolean {
    const status = this.keyStatus.get(keyName);
    return status ? status.isValid : false;
  }

  shouldSkipService(keyName: string): boolean {
    const status = this.keyStatus.get(keyName);
    if (!status) return true;
    
    // Skip if key is invalid and no fallback available
    return !status.isValid && !status.fallbackAvailable;
  }

  canUseFallback(keyName: string): boolean {
    const status = this.keyStatus.get(keyName);
    return status ? status.fallbackAvailable : false;
  }

  getValidationReport(): Record<string, ApiKeyStatus> {
    const report: Record<string, ApiKeyStatus> = {};
    this.keyStatus.forEach((status, key) => {
      report[key] = status;
    });
    return report;
  }

  // Safe API call wrapper
  async safeApiCall<T>(
    keyName: string,
    apiCall: () => Promise<T>,
    fallback: () => T
  ): Promise<T> {
    if (!this.isKeyValid(keyName)) {
      console.warn(`⚠️ API: ${keyName} not valid, using fallback`);
      return fallback();
    }

    try {
      return await apiCall();
    } catch (error) {
      console.error(`❌ API: ${keyName} call failed:`, error);
      
      if (this.canUseFallback(keyName)) {
        console.log(`🔄 API: Using fallback for ${keyName}`);
        return fallback();
      }
      
      throw error;
    }
  }

  // Check if quota exceeded (common with free tiers)
  isQuotaError(error: any): boolean {
    if (!error) return false;
    
    const errorStr = error.toString().toLowerCase();
    const message = error.message?.toLowerCase() || '';
    
    return errorStr.includes('quota') ||
           errorStr.includes('429') ||
           errorStr.includes('too many requests') ||
           message.includes('quota') ||
           message.includes('rate limit');
  }

  // Get safe API key (returns null if not valid)
  getSafeApiKey(keyName: string): string | null {
    if (this.isKeyValid(keyName)) {
      return process.env[keyName] || null;
    }
    return null;
  }
}

export const apiValidator = new ApiValidator();
export type { ApiKeyStatus };