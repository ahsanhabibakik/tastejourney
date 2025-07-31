import * as cheerio from 'cheerio';

// --- Scraping API helpers for live/hackathon deployment ---
async function fetchWithScraperAPI(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPERAPI_KEY;
  if (!apiKey) return null;
  const apiUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('ScraperAPI failed');
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchWithTarvily(url: string): Promise<string | null> {
  const apiKey = process.env.TARVILY_KEY;
  if (!apiKey) return null;
  const apiUrl = `https://api.tarvily.com/scrape?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Tarvily failed');
    const data = await res.json();
    return data.content || null;
  } catch {
    return null;
  }
}

async function fetchWithCheerio(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Direct fetch failed');
    return await res.text();
  } catch {
    return null;
  }
}

export interface WebsiteAnalysis {
  themes: string[];
  hints: string[];
  regionBias: string[];
  socialLinks: string[];
  title: string;
  description: string;
}

function extractThemes($: cheerio.CheerioAPI): string[] {
  // Example: extract from meta keywords and headings
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  const keywordThemes = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const headingThemes = [
    ...$('h1').map((_, el) => $(el).text().toLowerCase()).get(),
    ...$('h2').map((_, el) => $(el).text().toLowerCase()).get(),
    ...$('h3').map((_, el) => $(el).text().toLowerCase()).get(),
  ];
  const possibleThemes = ["travel", "photography", "adventure", "culture", "food", "lifestyle", "fashion", "luxury", "urban", "nature", "beach", "cultural"];
  return Array.from(new Set([...keywordThemes, ...headingThemes].filter(t => possibleThemes.some(pt => t.includes(pt)))));
}

function extractHints($: cheerio.CheerioAPI): string[] {
  const html = $.html();
  const hints: string[] = [];
  if (/photograph(er|y)/i.test(html)) hints.push("photographer");
  if (/content\s*creator/i.test(html)) hints.push("content-creator");
  if (/blogger/i.test(html)) hints.push("blogger");
  if (/influencer/i.test(html)) hints.push("influencer");
  if (/travel/i.test(html)) hints.push("traveler");
  if (/food/i.test(html)) hints.push("foodie");
  return hints;
}

function extractRegions($: cheerio.CheerioAPI): string[] {
  // Placeholder: could use geo meta tags or content
  return [];
}

function extractSocialLinks($: cheerio.CheerioAPI): string[] {
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/instagram\.com\//i.test(href)) links.push(href);
    if (/twitter\.com\//i.test(href)) links.push(href);
    if (/youtube\.com\//i.test(href)) links.push(href);
    if (/facebook\.com\//i.test(href)) links.push(href);
    if (/tiktok\.com\//i.test(href)) links.push(href);
  });
  return links;
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  let html: string | null = null;
  html = await fetchWithScraperAPI(url);
  if (!html) html = await fetchWithTarvily(url);
  if (!html) html = await fetchWithCheerio(url);
  if (!html) throw new Error('All scraping methods failed');

  const $ = cheerio.load(html);
  return {
    themes: extractThemes($),
    hints: extractHints($),
    regionBias: extractRegions($),
    socialLinks: extractSocialLinks($),
    title:
      $('title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      '',
    description: $('meta[name="description"]').attr('content') || ''
  };
}
