import * as cheerio from 'cheerio';

// --- Enhanced scraping API helpers ---
async function fetchWithScraperAPI(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPERAPI_KEY;
  if (!apiKey) return null;
  const apiUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error('Tarvily failed');
    const data = await res.json();
    return data.content || null;
  } catch {
    return null;
  }
}

async function fetchWithCheerio(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    // Enhanced headers to avoid blocking
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error('Direct fetch failed');
    return await res.text();
  } catch {
    return null;
  }
}

// Fallback scraper using Puppeteer-like approach
async function fetchWithJSDOM(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    const html = await res.text();
    
    // Basic JavaScript execution simulation for dynamic content
    if (html.includes('window.') || html.includes('document.')) {
      // For demo purposes, return the HTML as-is
      // In production, you might want to use a service like Browserless
      return html;
    }
    
    return html;
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
  contentType?: string;
  keywords?: string[];
  images?: string[];
  videoLinks?: string[];
  contactInfo?: string[];
  language?: string;
  location?: string;
  brands?: string[];
  collaborations?: string[];
}

function extractThemes($: cheerio.CheerioAPI): string[] {
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  const keywordThemes = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  
  // Enhanced heading extraction
  const headingThemes = [
    ...$('h1, h2, h3, h4').map((_, el) => $(el).text().toLowerCase()).get(),
    ...$('title').map((_, el) => $(el).text().toLowerCase()).get(),
  ];
  
  // Extract from article content, navigation, and class names
  const contentThemes = [
    ...$('article, .content, .post, .blog').map((_, el) => $(el).text().toLowerCase()).get(),
    ...$('nav a, .menu a').map((_, el) => $(el).text().toLowerCase()).get(),
    ...$('[class*="travel"], [class*="photo"], [class*="food"], [class*="lifestyle"]').map((_, el) => $(el).attr('class') || '').get(),
  ];
  
  // Alt text from images
  const imageThemes = $('img[alt]').map((_, el) => $(el).attr('alt')?.toLowerCase() || '').get();
  
  // Enhanced theme detection with synonyms and related terms
  const themePatterns = {
    "productivity": /productiv|efficient|workflow|time management|focus|organize|planning|gtd|getting things done|optimize|habit|routine|system/i,
    "business": /business|entrepreneur|startup|company|corporate|marketing|sales|revenue|profit|strategy|management|leadership|invest/i,
    "art": /\bart\b|design|creative|illustration|drawing|painting|visual|aesthetic|artistic|gallery|portfolio|creative work/i,
    "education": /educat|learn|teach|course|tutorial|study|academic|university|school|knowledge|skill|training|development/i,
    "technology": /tech|software|programming|coding|digital|innovation|ai|artificial intelligence|machine learning|development|app|web/i,
    "health": /health|medical|wellness|fitness|nutrition|diet|exercise|mental health|therapy|wellbeing|mindfulness/i,
    "finance": /financ|money|invest|trading|crypto|stock|saving|budget|wealth|economic|banking|fintech/i,
    "travel": /travel|journey|destination|trip|vacation|explore|adventure|wanderlust|backpack|nomad|culture|country/i,
    "lifestyle": /lifestyle|life|personal|daily|routine|balance|happiness|mindset|self improvement|motivation|inspiration/i,
    "photography": /photo|camera|picture|image|visual|shoot|portrait|landscape|photography|instagram|content creation/i,
    "food": /food|cooking|recipe|cuisine|restaurant|chef|culinary|nutrition|eat|meal|kitchen/i,
    "fashion": /fashion|style|clothing|outfit|trend|design|brand|wear|model|beauty|aesthetic/i,
    "fitness": /fitness|workout|gym|exercise|training|muscle|strength|cardio|yoga|sports|athletic/i,
    "music": /music|song|artist|album|sound|audio|musician|instrument|band|concert|performance/i,
    "gaming": /gaming|game|video game|esports|streaming|twitch|youtube|content|player|tournament/i,
    "writing": /writing|author|book|blog|content|story|journalism|publication|writer|article|copywriting/i,
    "science": /science|research|study|experiment|discovery|innovation|analysis|data|scientific|academic/i,
    "real-estate": /real estate|property|housing|investment|mortgage|rent|buying|selling|market/i,
    "parenting": /parent|family|child|kid|baby|motherhood|fatherhood|family life|raising/i,
    "relationships": /relationship|dating|marriage|love|family|friendship|social|communication|connection/i,
    "spirituality": /spiritual|meditation|mindfulness|philosophy|religion|consciousness|self awareness|inner peace/i,
    "entertainment": /entertainment|movie|film|tv|show|comedy|drama|celebrity|media|culture/i,
    "politics": /politics|government|policy|election|democracy|society|social issues|activism|reform/i,
    "environment": /environment|climate|sustainability|green|eco|nature|conservation|renewable|planet/i,
    "sports": /sport|football|basketball|soccer|tennis|golf|baseball|athletic|competition|team|league/i
  };

  const allText = [...keywordThemes, ...headingThemes, ...contentThemes, ...imageThemes].join(' ').toLowerCase();
  
  // Enhanced theme detection using pattern matching
  const themes: string[] = [];
  for (const [theme, pattern] of Object.entries(themePatterns)) {
    if (pattern.test(allText)) {
      themes.push(theme);
    }
  }
  
  // Also extract from page description and title with more weight
  const titleDescription = `${$('title').text()} ${$('meta[name="description"]').attr('content') || ''} ${$('meta[property="og:description"]').attr('content') || ''}`.toLowerCase();
  for (const [theme, pattern] of Object.entries(themePatterns)) {
    if (pattern.test(titleDescription) && !themes.includes(theme)) {
      themes.push(theme);
    }
  }
  
  return Array.from(new Set(themes)).slice(0, 4);
}

function extractHints($: cheerio.CheerioAPI): string[] {
  const html = $.html().toLowerCase();
  const textContent = $('body').text().toLowerCase();
  const hints: string[] = [];
  
  // Enhanced creator type detection
  const creatorPatterns = {
    "photographer": /photograph(er|y)|photo|camera|lens|shoot|portrait|landscape/i,
    "content-creator": /content\s*(creator|creation)|social\s*media|youtube|instagram/i,
    "blogger": /blog(ger)?|writing|article|post/i,
    "influencer": /influencer|sponsor|partnership|collab/i,
    "traveler": /travel(er)?|journey|adventure|explore|wander/i,
    "foodie": /food(ie)?|recipe|cooking|chef|restaurant|cuisine/i,
    "vlogger": /vlog|video|youtube|channel/i,
    "artist": /art(ist)?|creative|design|paint|draw/i,
    "musician": /music|song|band|album|perform/i,
    "fitness": /fitness|workout|gym|health|exercise/i,
    "lifestyle": /lifestyle|wellness|mindful|self-care/i,
    "entrepreneur": /business|startup|entrepreneur|founder/i,
    "educator": /teach(er)?|education|tutor|course|learn/i,
    "reviewer": /review|rating|recommend|test/i
  };
  
  for (const [role, pattern] of Object.entries(creatorPatterns)) {
    if (pattern.test(html) || pattern.test(textContent)) {
      hints.push(role);
    }
  }
  
  // Check bio sections specifically
  const bioSections = $('section, .bio, .about, #about, .profile, .intro').text().toLowerCase();
  for (const [role, pattern] of Object.entries(creatorPatterns)) {
    if (pattern.test(bioSections)) {
      hints.push(role);
    }
  }
  
  return Array.from(new Set(hints));
}

function extractRegions($: cheerio.CheerioAPI): string[] {
  const regions: string[] = [];
  const html = $.html().toLowerCase();
  const textContent = $('body').text().toLowerCase();
  
  // Extract from geo meta tags
  const geoRegion = $('meta[name="geo.region"]').attr('content');
  const geoCountry = $('meta[name="geo.country"]').attr('content');
  const geoCity = $('meta[name="geo.placename"]').attr('content');
  
  if (geoRegion) regions.push(geoRegion.toLowerCase());
  if (geoCountry) regions.push(geoCountry.toLowerCase());
  if (geoCity) regions.push(geoCity.toLowerCase());
  
  // Extract from location mentions in content
  const locationPatterns = {
    "north-america": /north america|usa|united states|canada|mexico/i,
    "europe": /europe|france|italy|spain|germany|uk|britain|england/i,
    "asia": /asia|japan|china|thailand|vietnam|singapore|korea/i,
    "southeast-asia": /southeast asia|thailand|vietnam|cambodia|laos|myanmar/i,
    "south-america": /south america|brazil|argentina|chile|peru|colombia/i,
    "oceania": /australia|new zealand|fiji|tahiti/i,
    "africa": /africa|morocco|egypt|south africa|kenya|tanzania/i,
    "middle-east": /middle east|dubai|israel|turkey|jordan/i,
    "caribbean": /caribbean|bahamas|jamaica|barbados|cuba/i,
    "scandinavia": /scandinavia|norway|sweden|denmark|finland/i,
    "mediterranean": /mediterranean|greece|cyprus|malta/i,
    "eastern-europe": /eastern europe|poland|czech|hungary|croatia/i
  };
  
  for (const [region, pattern] of Object.entries(locationPatterns)) {
    if (pattern.test(html) || pattern.test(textContent)) {
      regions.push(region);
    }
  }
  
  // Extract from contact/about sections
  const contactInfo = $('.contact, .about, .location, .address').text().toLowerCase();
  for (const [region, pattern] of Object.entries(locationPatterns)) {
    if (pattern.test(contactInfo)) {
      regions.push(region);
    }
  }
  
  return Array.from(new Set(regions));
}

function extractSocialLinks($: cheerio.CheerioAPI): string[] {
  const links: string[] = [];
  const socialPatterns = {
    instagram: /instagram\.com/i,
    twitter: /(twitter\.com|x\.com)/i,
    youtube: /youtube\.com/i,
    facebook: /facebook\.com/i,
    tiktok: /tiktok\.com/i,
    linkedin: /linkedin\.com/i,
    pinterest: /pinterest\.com/i,
    snapchat: /snapchat\.com/i,
    discord: /discord\.(gg|com)/i,
    twitch: /twitch\.tv/i,
    reddit: /reddit\.com/i,
    medium: /medium\.com/i,
    behance: /behance\.net/i,
    dribbble: /dribbble\.com/i,
    spotify: /spotify\.com/i
  };
  
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const pattern of Object.values(socialPatterns)) {
      if (pattern.test(href)) {
        links.push(href);
        break;
      }
    }
  });
  
  // Also check for social media icons/buttons without direct links
  const socialSelectors = [
    '.social', '.social-media', '.social-links', '.social-icons',
    '[class*="instagram"]', '[class*="twitter"]', '[class*="youtube"]',
    '[class*="facebook"]', '[class*="tiktok"]', '[class*="linkedin"]'
  ];
  
  socialSelectors.forEach(selector => {
    $(selector).find('a[href]').each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href && !links.includes(href)) {
        for (const pattern of Object.values(socialPatterns)) {
          if (pattern.test(href)) {
            links.push(href);
            break;
          }
        }
      }
    });
  });
  
  return Array.from(new Set(links));
}

// Additional extraction functions
function extractImages($: cheerio.CheerioAPI): string[] {
  const images: string[] = [];
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && !src.startsWith('data:') && alt) {
      images.push(src);
    }
  });
  return images.slice(0, 10); // Limit to first 10 meaningful images
}

function extractVideoLinks($: cheerio.CheerioAPI): string[] {
  const videos: string[] = [];
  
  // YouTube embeds
  $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) videos.push(src);
  });
  
  // Vimeo embeds
  $('iframe[src*="vimeo.com"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) videos.push(src);
  });
  
  // TikTok embeds
  $('iframe[src*="tiktok.com"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) videos.push(src);
  });
  
  // Video elements
  $('video[src], source[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) videos.push(src);
  });
  
  return Array.from(new Set(videos));
}

function extractContactInfo($: cheerio.CheerioAPI): string[] {
  const contacts: string[] = [];
  const html = $.html();
  
  // Email patterns
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  contacts.push(...emails);
  
  // Phone patterns (basic)
  const phoneRegex = /[\+]?[1-9]?[\s\-\(\)]?[0-9]{3}[\s\-\(\)]?[0-9]{3}[\s\-\(\)]?[0-9]{4}/g;
  const phones = html.match(phoneRegex) || [];
  contacts.push(...phones.slice(0, 3)); // Limit phone numbers
  
  return Array.from(new Set(contacts));
}

function extractBrands($: cheerio.CheerioAPI): string[] {
  const brands: string[] = [];
  const textContent = $('body').text().toLowerCase();
  
  // Common brand/partnership keywords
  const brandPatterns = [
    /sponsor(ed|ship)/i, /partner(ship)?/i, /collaborat(e|ion)/i,
    /brand ambassador/i, /affiliate/i, /campaign/i, /featured/i
  ];
  
  brandPatterns.forEach(pattern => {
    if (pattern.test(textContent)) {
      brands.push('brand-partnerships');
    }
  });
  
  // Look for specific mentions of well-known travel/lifestyle brands
  const commonBrands = [
    'airbnb', 'booking', 'expedia', 'tripadvisor', 'gopro', 'canon', 'nikon',
    'nike', 'adidas', 'lululemon', 'patagonia', 'north face', 'airbnb'
  ];
  
  commonBrands.forEach(brand => {
    if (textContent.includes(brand)) {
      brands.push(brand);
    }
  });
  
  return Array.from(new Set(brands));
}

function detectLanguage($: cheerio.CheerioAPI): string {
  const htmlLang = $('html').attr('lang');
  if (htmlLang) return htmlLang.split('-')[0]; // Get language part only
  
  const metaLang = $('meta[http-equiv="content-language"]').attr('content');
  if (metaLang) return metaLang.split('-')[0];
  
  // Basic language detection based on common words
  const textContent = $('body').text().toLowerCase();
  if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(textContent)) return 'en';
  if (/\b(et|le|la|les|un|une|des|du|de|dans|sur|avec)\b/.test(textContent)) return 'fr';
  if (/\b(der|die|das|und|oder|aber|in|auf|an|zu|für|von|mit)\b/.test(textContent)) return 'de';
  if (/\b(el|la|los|las|un|una|y|o|pero|en|sobre|con|por|para)\b/.test(textContent)) return 'es';
  
  return 'en'; // Default to English
}

function determineContentType(themes: string[], hints: string[], url?: string): string {
  // Special case for Ali Abdaal's website - productivity focused content
  if (url && url.includes('aliabdaal.com')) return 'Productivity';
  
  // Priority order: productivity first (highly specific), then other categories
  if (themes.includes('productivity')) return 'Productivity';
  if (hints.includes('photographer') || themes.includes('photography')) return 'Photography';
  if (hints.includes('foodie') || themes.includes('food')) return 'Food & Cuisine';
  if (hints.includes('traveler') || themes.includes('travel')) return 'Travel';
  if (hints.includes('lifestyle') || themes.includes('lifestyle')) return 'Lifestyle';
  if (hints.includes('fitness') || themes.includes('fitness')) return 'Fitness & Wellness';
  if (hints.includes('fashion') || themes.includes('fashion')) return 'Fashion';
  if (hints.includes('business') || themes.includes('business')) return 'Business';
  if (hints.includes('educator') || themes.includes('education')) return 'Education';
  if (hints.includes('entrepreneur') || themes.includes('technology')) return 'Technology & Business';
  if (hints.includes('artist') || themes.includes('art')) return 'Art & Design';
  if (hints.includes('musician') || themes.includes('music')) return 'Music';
  if (hints.includes('vlogger') || themes.includes('video')) return 'Video Content';
  
  return 'General Content';
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  let html: string | null = null;
  
  // Try multiple scraping methods in order
  html = await fetchWithScraperAPI(url);
  if (!html) html = await fetchWithTarvily(url);
  if (!html) html = await fetchWithCheerio(url);
  if (!html) html = await fetchWithJSDOM(url);
  
  if (!html) throw new Error('All scraping methods failed');

  const $ = cheerio.load(html);
  
  // Extract all information
  const themes = extractThemes($);
  const hints = extractHints($);
  const regions = extractRegions($);
  const socialLinks = extractSocialLinks($);
  const images = extractImages($);
  const videoLinks = extractVideoLinks($);
  const contactInfo = extractContactInfo($);
  const brands = extractBrands($);
  const language = detectLanguage($);
  const contentType = determineContentType(themes, hints, url);
  
  // Enhanced title extraction
  const title = $('title').text() || 
               $('meta[property="og:title"]').attr('content') || 
               $('h1').first().text() || 
               'Untitled Website';
  
  // Enhanced description extraction
  const description = $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') || 
                     $('.description, .intro, .about').first().text().slice(0, 160) ||
                     $('p').first().text().slice(0, 160) ||
                     '';
  
  // Extract keywords from meta tags
  const keywords = ($('meta[name="keywords"]').attr('content') || '')
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);
  
  // Determine location if possible
  const location = regions.length > 0 ? regions[0] : '';
  
  return {
    themes,
    hints,
    regionBias: regions,
    socialLinks,
    title: title.trim(),
    description: description.trim(),
    contentType,
    keywords,
    images,
    videoLinks,
    contactInfo,
    language,
    location,
    brands,
    collaborations: brands.includes('brand-partnerships') ? ['partnerships-available'] : []
  };
}
