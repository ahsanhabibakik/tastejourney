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
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1").map((_, el) => $(el).text()).get();
    const h2 = $("h2").map((_, el) => $(el).text()).get();
    const h3 = $("h3").map((_, el) => $(el).text()).get();
    return NextResponse.json({ url, title, description, h1, h2, h3 });
  } catch (error) {
    console.error("ScraperAPI error:", error);
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 });
  }
}
