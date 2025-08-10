// Service Availability Matrix - ENV-Driven Architecture
// Implements the "No key, no call" principle from the spec

interface ServiceCapability {
  enabled: boolean;
  envKeys: string[];
  fallback: string;
  weight?: number;
}

export class ServiceMatrix {
  private capabilities: Map<string, ServiceCapability> = new Map();
  
  constructor() {
    this.detectCapabilities();
    this.logCapabilityReport();
  }
  
  private detectCapabilities() {
    const services = [
      // Taste vectors (90% weight)
      {
        name: 'qloo',
        envKeys: ['QLOO_API_KEY'],
        fallback: 'content-heuristic',
        weight: 0.45
      },
      
      // Site ingest (10% weight)
      {
        name: 'scraperapi',
        envKeys: ['SCRAPERAPI_KEY'],
        fallback: 'basic-requests'
      },
      
      // Budget: flights/hotels
      {
        name: 'amadeus',
        envKeys: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'],
        fallback: 'heuristic-pricing'
      },
      
      // Living costs
      {
        name: 'numbeo',
        envKeys: ['NUMBEO_API_KEY'],
        fallback: 'cost-bands'
      },
      
      // Engagement: YouTube (25% weight component)
      {
        name: 'youtube',
        envKeys: ['YOUTUBE_API_KEY'],
        fallback: 'omit-signal',
        weight: 0.25
      },
      
      // Engagement: Instagram
      {
        name: 'instagram',
        envKeys: ['INSTAGRAM_ACCESS_TOKEN'],
        fallback: 'omit-signal'
      },
      
      // Engagement: TikTok
      {
        name: 'tiktok',
        envKeys: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
        fallback: 'omit-signal'
      },
      
      // POIs/facts
      {
        name: 'places',
        envKeys: ['GOOGLE_PLACES_API_KEY'],
        fallback: 'osm-nominatim'
      },
      
      // Events
      {
        name: 'ticketmaster',
        envKeys: ['TICKETMASTER_API_KEY'],
        fallback: 'omit-events'
      },
      
      // Creator discovery
      {
        name: 'social_searcher',
        envKeys: ['SOCIAL_SEARCHER_API_KEY'],
        fallback: 'available-platforms'
      },
      
      // Fact-check LLM
      {
        name: 'gemini',
        envKeys: ['GEMINI_API_KEY'],
        fallback: 'retrieval-only'
      },
      
      {
        name: 'openai',
        envKeys: ['OPENAI_API_KEY'],
        fallback: 'retrieval-only'
      },
      
      // Email delivery
      {
        name: 'sendgrid',
        envKeys: ['SENDGRID_API_KEY'],
        fallback: 'gmail-smtp'
      }
    ];
    
    services.forEach(service => {
      const enabled = service.envKeys.every(key => this.hasValidKey(key));
      this.capabilities.set(service.name, {
        enabled,
        envKeys: service.envKeys,
        fallback: service.fallback,
        weight: service.weight
      });
      
      if (!enabled) {
        console.log(`⚠️ SERVICE: ${service.name} disabled - Missing key(s): ${service.envKeys.join(', ')}`);
      }
    });
  }
  
  private hasValidKey(envKey: string): boolean {
    const value = process.env[envKey];
    return Boolean(value && value.trim() !== '' && value !== 'your_key_here');
  }
  
  public isEnabled(serviceName: string): boolean {
    return this.capabilities.get(serviceName)?.enabled ?? false;
  }
  
  public getFallback(serviceName: string): string {
    return this.capabilities.get(serviceName)?.fallback ?? 'unavailable';
  }
  
  public getEnabledServices(): string[] {
    return Array.from(this.capabilities.entries())
      .filter(([_, cap]) => cap.enabled)
      .map(([name, _]) => name);
  }
  
  public getDisabledServices(): string[] {
    return Array.from(this.capabilities.entries())
      .filter(([_, cap]) => !cap.enabled)
      .map(([name, _]) => name);
  }
  
  public logCapabilityReport(): void {
    console.log('\n🚀 SERVICE CAPABILITY REPORT:');
    console.log('✅ Enabled Services:', this.getEnabledServices());
    console.log('❌ Disabled Services:', this.getDisabledServices());
    console.log('🔄 Fallbacks Available:', this.getAvailableFallbacks());
    console.log('');
  }
  
  private getAvailableFallbacks(): string[] {
    return Array.from(this.capabilities.entries())
      .filter(([_, cap]) => !cap.enabled && cap.fallback !== 'unavailable')
      .map(([name, cap]) => `${name}->${cap.fallback}`);
  }
  
  // For monitoring/metrics
  public getCapabilityMetrics() {
    return {
      enabled_count: this.getEnabledServices().length,
      disabled_count: this.getDisabledServices().length,
      fallback_count: this.getAvailableFallbacks().length
    };
  }
}

export const serviceMatrix = new ServiceMatrix();