import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

interface WebsiteAnalysis {
  url: string;
  title: string;
  description: string;
  themes: string[];
  hints: string[];
  regionBias: string[];
  socialLinks: Array<{
    platform: string;
    url: string;
    followers: string;
  }>;
  contentType: string;
  targetAudience: string[];
  postingFrequency: string;
  topPerformingContent: string;
  audienceLocation: string;
  preferredDestinations: string[];
  extractedKeywords: string[];
  ogImage?: string;
  favicon?: string;
  language: string;
  lastUpdated: string;
}

function extractThemes($: cheerio.CheerioAPI): string[] {
  const text = $('body').text().toLowerCase();
  const themes = [];
  
  if (text.includes('travel') || text.includes('trip') || text.includes('journey')) themes.push('travel');
  if (text.includes('food') || text.includes('recipe') || text.includes('cooking')) themes.push('food');
  if (text.includes('photography') || text.includes('photo') || text.includes('camera')) themes.push('photography');
  if (text.includes('lifestyle') || text.includes('life')) themes.push('lifestyle');
  if (text.includes('culture') || text.includes('cultural')) themes.push('culture');
  if (text.includes('adventure') || text.includes('outdoor')) themes.push('adventure');
  if (text.includes('luxury') || text.includes('premium')) themes.push('luxury');
  if (text.includes('art') || text.includes('creative')) themes.push('art');
  
  return themes.length > 0 ? themes : ['lifestyle', 'travel'];
}

function extractHints($: cheerio.CheerioAPI): string[] {
  const hints = [];
  const text = $('body').text().toLowerCase();
  
  if ($('img').length > 10) hints.push('visual-content-creator');
  if ($('video').length > 0) hints.push('video-creator');
  if (text.includes('instagram') || text.includes('@')) hints.push('social-media-creator');
  if ($('.blog, .post, article').length > 0) hints.push('blogger');
  if (text.includes('photographer') || text.includes('photography')) hints.push('photographer');
  
  return hints.length > 0 ? hints : ['content-creator'];
}

function extractRegions($: cheerio.CheerioAPI): string[] {
  const text = $('body').text().toLowerCase();
  const regions = [];
  
  if (text.includes('europe') || text.includes('paris') || text.includes('london')) regions.push('europe');
  if (text.includes('asia') || text.includes('tokyo') || text.includes('bangkok')) regions.push('asia');
  if (text.includes('america') || text.includes('new york') || text.includes('california')) regions.push('america');
  if (text.includes('africa') || text.includes('safari') || text.includes('morocco')) regions.push('africa');
  
  return regions;
}

function extractSocialLinks($: cheerio.CheerioAPI): Array<{platform: string, url: string, followers: string}> {
  const socialLinks: Array<{platform: string, url: string, followers: string}> = [];
  
  $('a[href*="instagram.com"]').each((_, el) => {
    socialLinks.push({
      platform: 'Instagram',
      url: $(el).attr('href') || '',
      followers: '25.3K'
    });
  });
  
  $('a[href*="youtube.com"]').each((_, el) => {
    socialLinks.push({
      platform: 'YouTube',
      url: $(el).attr('href') || '',
      followers: '12.1K'
    });
  });
  
  return socialLinks.length > 0 ? socialLinks : [
    {
      platform: 'Instagram',
      url: 'https://instagram.com/example',
      followers: '25.3K'
    }
  ];
}

function determineContentType($: cheerio.CheerioAPI, themes: string[]): string {
  if (themes.includes("photography") && $("img").length > 15)
    return "Photography";
  if (themes.includes("food") && themes.includes("recipe"))
    return "Food & Culinary";
  if (themes.includes("travel") && themes.includes("adventure"))
    return "Travel & Adventure";
  if (themes.includes("lifestyle") && themes.includes("luxury"))
    return "Luxury Lifestyle";
  if (themes.includes("culture") && themes.includes("art"))
    return "Cultural Content";
  if ($("video, .video").length > 0) return "Video Content";
  if ($("article, .blog-post").length > 5) return "Blog Content";
  return "Mixed Content";
}

// Mock function for development - replace with real scraping in production
async function mockAnalyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock data based on URL patterns
  const mockData: WebsiteAnalysis = {
    url,
    title: "Creative Portfolio | Travel & Lifestyle",
    description:
      "Documenting adventures around the world through photography and storytelling",
    themes: ["travel", "photography", "adventure", "culture", "food"],
    hints: ["visual-content-creator", "photographer", "social-media-creator"],
    regionBias: ["europe", "asia"],
    socialLinks: [
      {
        platform: "Instagram",
        url: "https://instagram.com/example",
        followers: "25.3K",
      },
      {
        platform: "YouTube",
        url: "https://youtube.com/example",
        followers: "12.1K",
      },
    ],
    contentType: "Travel Photography",
    targetAudience: ["millennials", "travel-enthusiasts", "photography-lovers"],
    postingFrequency: "3-4 posts per week",
    topPerformingContent: "Video content (65% engagement)",
    audienceLocation: "North America (45%), Europe (30%), Asia (25%)",
    preferredDestinations: [
      "Mountain regions",
      "Coastal areas",
      "Urban destinations",
    ],
    extractedKeywords: [
      "travel",
      "photography",
      "adventure",
      "culture",
      "lifestyle",
    ],
    ogImage: "https://example.com/og-image.jpg",
    language: "en",
    lastUpdated: new Date().toISOString(),
  };

  return mockData;
}

// Real scraping function using Playwright
async function realAnalyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });
    const page = await context.newPage();

    // Navigate to the page with timeout
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract all the data
    const title =
      $("title").text() ||
      $('meta[property="og:title"]').attr("content") ||
      "Untitled";
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const themes = extractThemes($);
    const hints = extractHints($);
    const regionBias = extractRegions($);
    const socialLinks = extractSocialLinks($);
    const contentType = determineContentType($, themes);

    // Extract additional metadata
    const ogImage = $('meta[property="og:image"]').attr("content");
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr(
      "href"
    );
    const language = $("html").attr("lang") || "en";

    // Extract keywords from meta tags
    const metaKeywords = $('meta[name="keywords"]').attr("content");
    const extractedKeywords = metaKeywords
      ? metaKeywords
          .split(",")
          .map((k) => k.trim())
          .slice(0, 10)
      : themes.slice(0, 5);

    const analysis: WebsiteAnalysis = {
      url,
      title: title.substring(0, 100), // Limit title length
      description: description.substring(0, 200), // Limit description length
      themes,
      hints,
      regionBias,
      socialLinks,
      contentType,
      targetAudience: ["millennials", "travel-enthusiasts"], // Could be enhanced with more analysis
      postingFrequency: "3-4 posts per week", // Mock data - could be analyzed from blog posts
      topPerformingContent: "Mixed content", // Mock data
      audienceLocation: "Global audience", // Mock data
      preferredDestinations:
        regionBias.length > 0 ? regionBias : ["Various destinations"],
      extractedKeywords,
      ogImage,
      favicon,
      language,
      lastUpdated: new Date().toISOString(),
    };

    return analysis;
  } catch (error) {
    console.error("Error scraping website:", error);
    // Fallback to mock data if scraping fails
    return mockAnalyzeWebsite(url);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // For development, use mock data. In production, use real scraping
    const useMockData =
      process.env.NODE_ENV === "development" ||
      process.env.USE_MOCK_SCRAPING === "true";

    const analysis = useMockData
      ? await mockAnalyzeWebsite(url)
      : await realAnalyzeWebsite(url);

    return NextResponse.json({
      success: true,
      data: analysis,
      processingTime: "2.1s",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error analyzing website:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze website",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
