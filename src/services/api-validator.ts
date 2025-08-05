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