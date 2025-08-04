// Rate limiter service for external API calls
// Prevents hitting API quotas and manages request rates

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  service: string;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private requests: Map<string, RequestRecord[]> = new Map();

  constructor() {
    // Configure rate limits for each service
    this.configureLimits();
  }

  private configureLimits() {
    // Based on free tier limits from PRD
    const configs: RateLimitConfig[] = [
      { service: 'qloo', maxRequests: 100, windowMs: 60 * 1000 }, // 100/min
      { service: 'amadeus', maxRequests: 20, windowMs: 60 * 1000 }, // 20/min
      { service: 'youtube', maxRequests: 100, windowMs: 60 * 1000 }, // 100/min
      { service: 'instagram', maxRequests: 200, windowMs: 60 * 60 * 1000 }, // 200/hour
      { service: 'google-places', maxRequests: 100, windowMs: 60 * 1000 }, // 100/min
      { service: 'wikipedia', maxRequests: 200, windowMs: 60 * 1000 }, // 200/min
      { service: 'numbeo', maxRequests: 50, windowMs: 60 * 1000 }, // 50/min
      { service: 'gemini', maxRequests: 60, windowMs: 60 * 1000 }, // 60/min
      { service: 'sendgrid', maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100/day
    ];

    configs.forEach(config => {
      this.limits.set(config.service, config);
    });
  }

  // Check if request is allowed
  async checkLimit(service: string): Promise<boolean> {
    const config = this.limits.get(service);
    if (!config) {
      console.warn(`No rate limit configured for service: ${service}`);
      return true; // Allow if not configured
    }

    const now = Date.now();
    const records = this.requests.get(service) || [];
    
    // Clean old records
    const validRecords = records.filter(r => 
      now - r.timestamp < config.windowMs
    );

    // Count requests in current window
    const requestCount = validRecords.reduce((sum, r) => sum + r.count, 0);

    if (requestCount >= config.maxRequests) {
      console.warn(`Rate limit exceeded for ${service}: ${requestCount}/${config.maxRequests}`);
      return false;
    }

    return true;
  }

  // Record a request
  recordRequest(service: string, count: number = 1) {
    const now = Date.now();
    const records = this.requests.get(service) || [];
    
    // Add new record
    records.push({ timestamp: now, count });
    
    // Keep only recent records
    const config = this.limits.get(service);
    if (config) {
      const validRecords = records.filter(r => 
        now - r.timestamp < config.windowMs * 2 // Keep 2x window for safety
      );
      this.requests.set(service, validRecords);
    }
  }

  // Get remaining requests for a service
  getRemainingRequests(service: string): number {
    const config = this.limits.get(service);
    if (!config) return 999;

    const now = Date.now();
    const records = this.requests.get(service) || [];
    
    const validRecords = records.filter(r => 
      now - r.timestamp < config.windowMs
    );

    const requestCount = validRecords.reduce((sum, r) => sum + r.count, 0);
    return Math.max(0, config.maxRequests - requestCount);
  }

  // Wait if rate limited
  async waitIfLimited(service: string): Promise<void> {
    const canProceed = await this.checkLimit(service);
    if (!canProceed) {
      const config = this.limits.get(service);
      if (!config) return;

      // Calculate wait time
      const records = this.requests.get(service) || [];
      const oldestRecord = records
        .filter(r => Date.now() - r.timestamp < config.windowMs)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (oldestRecord) {
        const waitTime = (oldestRecord.timestamp + config.windowMs) - Date.now();
        if (waitTime > 0) {
          console.log(`Rate limited for ${service}, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  // Decorator for rate-limited methods
  rateLimited(service: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        // Wait if rate limited
        await rateLimiter.waitIfLimited(service);
        
        // Record the request
        rateLimiter.recordRequest(service);
        
        // Call original method
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          // Don't count failed requests against the limit
          rateLimiter.recordRequest(service, -1);
          throw error;
        }
      };
      
      return descriptor;
    };
  }

  // Get rate limit status for all services
  getStatus(): Record<string, {
    limit: number;
    window: string;
    remaining: number;
    resetIn: number;
  }> {
    const status: Record<string, any> = {};
    
    this.limits.forEach((config, service) => {
      const remaining = this.getRemainingRequests(service);
      const records = this.requests.get(service) || [];
      const now = Date.now();
      
      const validRecords = records.filter(r => 
        now - r.timestamp < config.windowMs
      );
      
      let resetIn = 0;
      if (validRecords.length > 0) {
        const oldestRecord = validRecords.sort((a, b) => a.timestamp - b.timestamp)[0];
        resetIn = Math.max(0, (oldestRecord.timestamp + config.windowMs) - now);
      }
      
      status[service] = {
        limit: config.maxRequests,
        window: `${config.windowMs / 1000}s`,
        remaining,
        resetIn: Math.ceil(resetIn / 1000) // seconds
      };
    });
    
    return status;
  }

  // Batch request handler for optimal API usage
  async batchRequests<T>(
    service: string,
    requests: (() => Promise<T>)[],
    batchSize?: number
  ): Promise<T[]> {
    const config = this.limits.get(service);
    const maxBatch = batchSize || (config ? Math.floor(config.maxRequests / 2) : 10);
    
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += maxBatch) {
      const batch = requests.slice(i, i + maxBatch);
      
      // Wait for rate limit
      await this.waitIfLimited(service);
      
      // Execute batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (request) => {
          this.recordRequest(service);
          return request();
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + maxBatch < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

export const rateLimiter = new RateLimiter();

// Service-specific rate limiters
export const apiRateLimits = {
  qloo: () => rateLimiter.checkLimit('qloo'),
  amadeus: () => rateLimiter.checkLimit('amadeus'),
  youtube: () => rateLimiter.checkLimit('youtube'),
  instagram: () => rateLimiter.checkLimit('instagram'),
  googlePlaces: () => rateLimiter.checkLimit('google-places'),
  wikipedia: () => rateLimiter.checkLimit('wikipedia'),
  numbeo: () => rateLimiter.checkLimit('numbeo'),
  gemini: () => rateLimiter.checkLimit('gemini'),
  sendgrid: () => rateLimiter.checkLimit('sendgrid'),
};