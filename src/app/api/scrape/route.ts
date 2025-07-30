import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Launch browser and set user agent
    const browser = await chromium.launch();
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const html = await page.content();
    await browser.close();

    // Use cheerio to extract data
    const $ = cheerio.load(html);
    // Example: extract title, meta description, and all h1/h2/h3
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1").map((_, el) => $(el).text()).get();
    const h2 = $("h2").map((_, el) => $(el).text()).get();
    const h3 = $("h3").map((_, el) => $(el).text()).get();

    // You can add more extraction logic here based on your project needs

    return NextResponse.json({
      url,
      title,
      description,
      h1,
      h2,
      h3,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 });
  }
}
