import { NextRequest, NextResponse } from "next/server";
import { cacheService } from "@/services/cache";

export async function POST(request: NextRequest) {
  try {
    // Get cache stats before clearing
    const statsBefore = cacheService.getStats();
    
    // Clear the cache
    cacheService.clear();
    
    // Get stats after clearing
    const statsAfter = cacheService.getStats();
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      before: statsBefore,
      after: statsAfter
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = cacheService.getStats();
    
    return NextResponse.json({
      success: true,
      cacheStats: stats
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get cache stats" 
      },
      { status: 500 }
    );
  }
}