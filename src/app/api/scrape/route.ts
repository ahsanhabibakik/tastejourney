import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`Starting analysis for: ${url}`);
    
    try {
      // Use the enhanced scraper with timeout
      const analysisPromise = analyzeWebsite(url);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout')), 30000) // 30 second timeout
      );
      
      const analysis = await Promise.race([analysisPromise, timeoutPromise]) as Awaited<ReturnType<typeof analyzeWebsite>>;
      
      // Transform social links to the expected format for the frontend
      const socialLinks = analysis.socialLinks.map((link: string) => {
        let platform = 'Unknown';
        if (link.includes('instagram.com')) platform = 'Instagram';
        else if (link.includes('twitter.com') || link.includes('x.com')) platform = 'Twitter';
        else if (link.includes('youtube.com')) platform = 'YouTube';
        else if (link.includes('facebook.com')) platform = 'Facebook';
        else if (link.includes('tiktok.com')) platform = 'TikTok';
        else if (link.includes('linkedin.com')) platform = 'LinkedIn';
        else if (link.includes('pinterest.com')) platform = 'Pinterest';
        else if (link.includes('twitch.tv')) platform = 'Twitch';
        
        return { platform, url: link };
      });

      // Create comprehensive result
      const result = {
        url,
        themes: analysis.themes,
        hints: analysis.hints,
        contentType: analysis.contentType || 'General Content',
        socialLinks,
        title: analysis.title,
        description: analysis.description,
        keywords: analysis.keywords || [],
        images: analysis.images || [],
        videoLinks: analysis.videoLinks || [],
        language: analysis.language || 'en',
        location: analysis.location || '',
        brands: analysis.brands || [],
        collaborations: analysis.collaborations || [],
        regionBias: analysis.regionBias || [],
        contactInfo: (analysis.contactInfo || []).filter((contact: string) => 
          !contact.includes('@') || contact.split('@').length === 2 // Basic email validation
        ).slice(0, 3), // Limit contact info for privacy
        extractedAt: new Date().toISOString(),
        scrapingMethods: ['ScraperAPI', 'Tarvily', 'Direct Fetch', 'Enhanced Parsing']
      };

      console.log(`Successfully analyzed ${url}: found ${result.themes.length} themes, ${result.hints.length} creator hints, ${result.socialLinks.length} social links`);
      
      return NextResponse.json({ success: true, data: result });
      
    } catch (analysisError) {
      console.error("Website analysis failed:", analysisError);
      
      // Fallback to basic mock data based on URL
      const fallbackData = {
        url,
        themes: ["general", "content"],
        hints: ["content-creator"],
        contentType: "General Content",
        socialLinks: [],
        title: `Content from ${validUrl.hostname}`,
        description: "Website content analysis",
        keywords: [],
        images: [],
        videoLinks: [],
        language: 'en',
        location: '',
        brands: [],
        collaborations: [],
        regionBias: [],
        contactInfo: [],
        extractedAt: new Date().toISOString(),
        scrapingMethods: ['Fallback'],
        fallbackUsed: true
      };
      
      return NextResponse.json({ 
        success: true, 
        data: fallbackData,
        warning: "Used fallback data due to scraping limitations"
      });
    }
    
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
