// Simple in-memory cache service for API responses
// In production, use Redis or similar

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  // Generate cache key from parameters
  generateKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as any);
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  // Get cached data if valid
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired
      this.cache.delete(key);
      return null;
    }
    
    console.log(`Cache hit for key: ${key}`);
    return entry.data as T;
  }

  // Set cache data
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
    
    console.log(`Cached data for key: ${key}`);
  }

  // Clear specific cache entry
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  // Purge cache keys containing "New York" origin per instruction #3
  purgeNewYorkOriginCache(): number {
    let purgedCount = 0;
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes('"origin":"New York"') || key.includes('budget:New York')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      purgedCount++;
    });
    
    console.log(`🧹 CACHE: Purged ${purgedCount} cache entries with New York origin`);
    return purgedCount;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: string;
  } {
    const keys = Array.from(this.cache.keys());
    const size = this.cache.size;
    
    // Rough memory estimation
    const memoryBytes = JSON.stringify(Array.from(this.cache.entries())).length;
    const memoryMB = (memoryBytes / 1024 / 1024).toFixed(2);
    
    return {
      size,
      keys,
      memoryUsage: `~${memoryMB} MB`
    };
  }

  // Wrapper for cached function calls
  async cachedCall<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Call function and cache result
    try {
      const result = await fn();
      this.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error(`Error in cached call for ${key}:`, error);
      throw error;
    }
  }

  // Cache decorator for class methods
  cacheMethod(ttl?: number) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const key = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
        
        return cacheService.cachedCall(
          key,
          () => originalMethod.apply(this, args),
          ttl
        );
      };
      
      return descriptor;
    };
  }
}

export const cacheService = new CacheService();

// Specific cache helpers for different services
export const apiCache = {
  // Qloo API cache (30 minutes)
  qloo: (params: any) => {
    const key = cacheService.generateKey('qloo', params);
    return {
      get: <T>() => cacheService.get<T>(key),
      set: <T>(data: T) => cacheService.set(key, data, 30 * 60 * 1000)
    };
  },
  
  // Budget API cache (1 hour)
  budget: (origin: string, destination: string, dates: any) => {
    const key = cacheService.generateKey('budget', { origin, destination, dates });
    return {
      get: <T>() => cacheService.get<T>(key),
      set: <T>(data: T) => cacheService.set(key, data, 60 * 60 * 1000)
    };
  },
  
  // Creator API cache (2 hours)
  creator: (location: string, niche: string) => {
    const key = cacheService.generateKey('creator', { location, niche });
    return {
      get: <T>() => cacheService.get<T>(key),
      set: <T>(data: T) => cacheService.set(key, data, 2 * 60 * 60 * 1000)
    };
  },
  
  // Places API cache (24 hours)
  places: (location: string) => {
    const key = cacheService.generateKey('places', { location });
    return {
      get: <T>() => cacheService.get<T>(key),
      set: <T>(data: T) => cacheService.set(key, data, 24 * 60 * 60 * 1000)
    };
  },
  
  // Recommendations cache (15 minutes)
  recommendations: (userProfile: any, preferences: any) => {
    const key = cacheService.generateKey('recommendations', { 
      themes: userProfile.themes,
      preferences 
    });
    return {
      get: <T>() => cacheService.get<T>(key),
      set: <T>(data: T) => cacheService.set(key, data, 15 * 60 * 1000)
    };
  }
};