import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ScraperAPI key not set" }, { status: 500 });
    }
    const targetUrl = encodeURIComponent(url);
    const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${targetUrl}`;
    const response = await fetch(scraperUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from ScraperAPI" }, { status: 500 });
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title and description
    const title = $("title").text() || "Untitled Website";
    const description = $('meta[name="description"]').attr("content") || "";

    // Extract themes from keywords and headings
    const keywords = $('meta[name="keywords"]').attr("content") || '';
    const keywordThemes = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const headingThemes = [
      ...$("h1").map((_, el) => $(el).text().toLowerCase()).get(),
      ...$("h2").map((_, el) => $(el).text().toLowerCase()).get(),
      ...$("h3").map((_, el) => $(el).text().toLowerCase()).get(),
    ];
    // Simple theme extraction
    const possibleThemes = ["travel", "photography", "adventure", "culture", "food", "lifestyle", "fashion", "luxury", "urban", "nature", "beach", "cultural"];
    const themes = Array.from(new Set([...keywordThemes, ...headingThemes].filter(t => possibleThemes.some(pt => t.includes(pt)))));

    // Extract hints (roles, creator types)
    const hints: string[] = [];
    if (/photograph(er|y)/i.test(html)) hints.push("photographer");
    if (/content\s*creator/i.test(html)) hints.push("content-creator");
    if (/blogger/i.test(html)) hints.push("blogger");
    if (/influencer/i.test(html)) hints.push("influencer");
    if (/travel/i.test(html)) hints.push("traveler");
    if (/food/i.test(html)) hints.push("foodie");

    // Guess content type
    let contentType = "General";
    if (themes.includes("photography")) contentType = "Photography";
    else if (themes.includes("food")) contentType = "Food";
    else if (themes.includes("travel")) contentType = "Travel";
    else if (themes.includes("fashion")) contentType = "Fashion";

    // Extract social links
    const socialLinks: { platform: string; url: string }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (/instagram\.com\//i.test(href)) socialLinks.push({ platform: "Instagram", url: href });
      if (/twitter\.com\//i.test(href)) socialLinks.push({ platform: "Twitter", url: href });
      if (/youtube\.com\//i.test(href)) socialLinks.push({ platform: "YouTube", url: href });
      if (/facebook\.com\//i.test(href)) socialLinks.push({ platform: "Facebook", url: href });
      if (/tiktok\.com\//i.test(href)) socialLinks.push({ platform: "TikTok", url: href });
    });

    // Compose the result object
    const result = {
      url,
      themes,
      hints,
      contentType,
      socialLinks,
      title,
      description,
    };
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("ScraperAPI error:", error);
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 });
  }
}
