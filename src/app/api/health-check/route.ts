import { NextRequest, NextResponse } from "next/server";
import { cacheService } from "@/services/cache";

interface APIHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'down';
  services: APIHealthStatus[];
  recommendations: string[];
  cacheStatus: {
    size: number;
    memoryUsage: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const services: APIHealthStatus[] = [];
  const recommendations: string[] = [];

  // Check Qloo API
  try {
    const qlooStart = Date.now();
    const qlooApiKey = process.env.QLOO_API_KEY;
    const qlooApiBase = process.env.QLOO_API_URL || 'https://hackathon.api.qloo.com';
    
    if (!qlooApiKey) {
      services.push({
        service: 'Qloo API',
        status: 'down',
        error: 'API key not configured',
        lastChecked: new Date().toISOString()
      });
      recommendations.push('Configure QLOO_API_KEY environment variable');
    } else {
      // Test a lightweight Qloo endpoint
      const response = await fetch(`${qlooApiBase}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${qlooApiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = Date.now() - qlooStart;
      
      if (response.ok) {
        services.push({
          service: 'Qloo API',
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } else {
        services.push({
          service: 'Qloo API',
          status: 'down',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          lastChecked: new Date().toISOString()
        });
        
        if (response.status === 401) {
          recommendations.push('Check QLOO_API_KEY validity - authentication failed');
        } else if (response.status === 429) {
          recommendations.push('Qloo API rate limit exceeded - implement request throttling');
        }
      }
    }
  } catch (error) {
    services.push({
      service: 'Qloo API',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date().toISOString()
    });
    recommendations.push('Qloo API connection failed - check network connectivity');
  }

  // Check Gemini API
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      services.push({
        service: 'Gemini API',
        status: 'down',
        error: 'API key not configured',
        lastChecked: new Date().toISOString()
      });
      recommendations.push('Configure GEMINI_API_KEY environment variable');
    } else {
      // Don't actually test Gemini to avoid using quota
      services.push({
        service: 'Gemini API',
        status: 'healthy',
        error: 'Key configured (not tested to preserve quota)',
        lastChecked: new Date().toISOString()
      });
    }
  } catch (error) {
    services.push({
      service: 'Gemini API',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date().toISOString()
    });
  }

  // Check YouTube API
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      services.push({
        service: 'YouTube API',
        status: 'down',
        error: 'API key not configured',
        lastChecked: new Date().toISOString()
      });
      recommendations.push('Configure YOUTUBE_API_KEY environment variable');
    } else {
      services.push({
        service: 'YouTube API',
        status: 'healthy',
        error: 'Key configured',
        lastChecked: new Date().toISOString()
      });
    }
  } catch (error) {
    services.push({
      service: 'YouTube API',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date().toISOString()
    });
  }

  // Check Instagram API
  try {
    const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!instagramToken) {
      services.push({
        service: 'Instagram API',
        status: 'down',
        error: 'Access token not configured',
        lastChecked: new Date().toISOString()
      });
      recommendations.push('Configure INSTAGRAM_ACCESS_TOKEN environment variable');
    } else {
      services.push({
        service: 'Instagram API',
        status: 'healthy', 
        error: 'Token configured',
        lastChecked: new Date().toISOString()
      });
    }
  } catch (error) {
    services.push({
      service: 'Instagram API',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date().toISOString()
    });
  }

  // Determine overall health
  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;
  
  let overall: 'healthy' | 'degraded' | 'down';
  
  if (healthyServices === totalServices) {
    overall = 'healthy';
  } else if (healthyServices > 0) {
    overall = 'degraded';
    recommendations.push('Some APIs are failing - fallback mechanisms will be used');
  } else {
    overall = 'down';
    recommendations.push('All external APIs are failing - only cached and static data available');
  }

  // Get cache status
  const cacheStats = cacheService.getStats();

  const response: HealthCheckResponse = {
    overall,
    services,
    recommendations,
    cacheStatus: {
      size: cacheStats.size,
      memoryUsage: cacheStats.memoryUsage
    }
  };

  return NextResponse.json(response, {
    status: overall === 'down' ? 503 : 200
  });
}

export async function POST(request: NextRequest) {
  // Force clear cache and retry connections
  try {
    cacheService.clear();
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared and health check reset",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to reset health check" 
      },
      { status: 500 }
    );
  }
}