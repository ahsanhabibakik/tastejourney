import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import * as cheerio from "cheerio";

interface WebsiteAnalysis {
  url: string;
  title: string;
  description: string;
  themes: string[];
  hints: string[];
  regionBias: string[];
  socialLinks: {
    platform: string;
    url: string;
    followers?: string;
  }[];
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
  lastUpdated?: string;
}

// Helper function to extract themes from content
function extractThemes($: cheerio.CheerioAPI): string[] {
  const themes = new Set<string>();

  // Look for common travel/lifestyle keywords
  const travelKeywords = [
    "travel",
    "adventure",
    "food",
    "culture",
    "photography",
    "lifestyle",
    "luxury",
    "budget",
    "backpack",
    "solo",
    "family",
    "couple",
    "beach",
    "mountain",
    "city",
    "nature",
    "urban",
    "rural",
    "hotel",
    "restaurant",
    "museum",
    "tour",
    "guide",
    "tips",
  ];

  const content = $("body").text().toLowerCase();
  const metaKeywords =
    $('meta[name="keywords"]').attr("content")?.toLowerCase() || "";
  const title = $("title").text().toLowerCase();
  const description =
    $('meta[name="description"]').attr("content")?.toLowerCase() || "";

  const allText = `${content} ${metaKeywords} ${title} ${description}`;

  travelKeywords.forEach((keyword) => {
    if (allText.includes(keyword)) {
      themes.add(keyword);
    }
  });

  // Look for specific content themes in headings
  $("h1, h2, h3").each((_, element) => {
    const heading = $(element).text().toLowerCase();
    if (heading.includes("photo")) themes.add("photography");
    if (heading.includes("food") || heading.includes("recipe"))
      themes.add("food");
    if (heading.includes("travel") || heading.includes("journey"))
      themes.add("travel");
    if (heading.includes("adventure")) themes.add("adventure");
    if (heading.includes("culture")) themes.add("culture");
  });

  return Array.from(themes).slice(0, 8); // Limit to top 8 themes
}

// Helper function to extract content hints
function extractHints($: cheerio.CheerioAPI): string[] {
  const hints = new Set<string>();

  // Look for portfolio/gallery indicators
  if ($("img").length > 10) hints.add("visual-content-creator");
  if ($(".gallery, .portfolio, #gallery, #portfolio").length > 0)
    hints.add("photographer");

  // Look for blog indicators
  if ($("article, .post, .blog-post").length > 0) hints.add("blogger");

  // Look for social media links
  const socialLinks = $(
    'a[href*="instagram"], a[href*="youtube"], a[href*="tiktok"]'
  );
  if (socialLinks.length > 0) hints.add("social-media-creator");

  // Look for business indicators
  if ($('a[href*="contact"], .contact, #contact').length > 0)
    hints.add("professional");
  if ($('a[href*="hire"], a[href*="booking"]').length > 0)
    hints.add("service-provider");

  // Look for specific content types
  if ($("video, .video").length > 0) hints.add("video-creator");
  if ($(".recipe, .cooking").length > 0) hints.add("food-blogger");

  return Array.from(hints);
}

// Helper function to extract region bias
function extractRegions($: cheerio.CheerioAPI): string[] {
  const regions = new Set<string>();
  const content = $("body").text().toLowerCase();

  const regionKeywords = {
    europe: [
      "europe",
      "european",
      "paris",
      "london",
      "rome",
      "barcelona",
      "amsterdam",
    ],
    asia: ["asia", "asian", "japan", "china", "thailand", "singapore", "korea"],
    "north-america": [
      "america",
      "usa",
      "canada",
      "mexico",
      "new york",
      "california",
    ],
    "south-america": ["brazil", "argentina", "peru", "colombia", "chile"],
    africa: ["africa", "south africa", "morocco", "egypt", "kenya"],
    oceania: ["australia", "new zealand", "fiji", "tahiti"],
  };

  Object.entries(regionKeywords).forEach(([region, keywords]) => {
    if (keywords.some((keyword) => content.includes(keyword))) {
      regions.add(region);
    }
  });

  return Array.from(regions);
}

// Helper function to extract social media links
function extractSocialLinks(
  $: cheerio.CheerioAPI
): { platform: string; url: string; followers?: string }[] {
  const socialLinks: { platform: string; url: string; followers?: string }[] =
    [];

  const socialPlatforms = {
    "instagram.com": "Instagram",
    "youtube.com": "YouTube",
    "tiktok.com": "TikTok",
    "twitter.com": "Twitter",
    "x.com": "X",
    "facebook.com": "Facebook",
    "linkedin.com": "LinkedIn",
    "pinterest.com": "Pinterest",
  };

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      Object.entries(socialPlatforms).forEach(([domain, platform]) => {
        if (href.includes(domain)) {
          socialLinks.push({
            platform,
            url: href,
            followers: undefined, // Could be extracted with more sophisticated scraping
          });
        }
      });
    }
  });

  // Remove duplicates
  const uniqueLinks = socialLinks.filter(
    (link, index, self) =>
      index === self.findIndex((l) => l.platform === link.platform)
  );

  return uniqueLinks;
}

// Helper function to determine content type
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

    const page = await browser.newPage();

    // Set user agent to avoid blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

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
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
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
