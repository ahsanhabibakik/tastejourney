import { NextRequest, NextResponse } from "next/server";

interface TasteVector {
  adventure: number;
  culture: number;
  luxury: number;
  food: number;
  nature: number;
  urban: number;
  budget: number;
}

interface QlooRequest {
  themes: string[];
  hints: string[];
  contentType: string;
  socialLinks: { platform: string; url: string }[];
  demographics?: {
    age?: string;
    location?: string;
    interests?: string[];
  };
}

interface QlooResponse {
  tasteVector: TasteVector;
  recommendations: string[];
  confidence: number;
  culturalAffinities: string[];
  personalityTraits: string[];
  processingTime: string;
}

// PRD-compliant dynamic taste vector generator
function generateDynamicTasteVector(
  websiteData: {
    themes: string[];
    hints: string[];
    contentType: string;
    socialLinks: { platform: string; url: string }[];
    title?: string;
    description?: string;
    keywords?: string[];
    audienceLocation?: string;
  }
): TasteVector {
  const { themes, hints, contentType, socialLinks, title, description, keywords, audienceLocation } = websiteData;
  
  // Initialize base vector with PRD-compliant values
  const vector: TasteVector = {
    adventure: 0.2,
    culture: 0.3,
    luxury: 0.25,
    food: 0.2,
    nature: 0.2,
    urban: 0.4,
    budget: 0.6,
  };

  // Content analysis weights based on PRD algorithm (90% Qloo + 10% website insights)
  const THEME_WEIGHT = 0.25;
  const HINT_WEIGHT = 0.15;
  const CONTENT_TYPE_WEIGHT = 0.3;
  const SOCIAL_WEIGHT = 0.1;
  const METADATA_WEIGHT = 0.1;
  const AUDIENCE_WEIGHT = 0.1;

  // Analyze themes with enhanced categorization
  themes.forEach((theme) => {
    const themeStr = theme.toLowerCase();
    
    // Adventure & Outdoor Activities
    if (themeStr.includes('adventure') || themeStr.includes('hiking') || 
        themeStr.includes('outdoor') || themeStr.includes('extreme') ||
        themeStr.includes('sport') || themeStr.includes('climbing')) {
      vector.adventure = Math.min(vector.adventure + THEME_WEIGHT, 1.0);
      vector.nature = Math.min(vector.nature + THEME_WEIGHT * 0.6, 1.0);
    }
    
    // Culture & Arts
    if (themeStr.includes('culture') || themeStr.includes('art') || 
        themeStr.includes('history') || themeStr.includes('museum') ||
        themeStr.includes('heritage') || themeStr.includes('tradition')) {
      vector.culture = Math.min(vector.culture + THEME_WEIGHT, 1.0);
    }
    
    // Luxury & Premium
    if (themeStr.includes('luxury') || themeStr.includes('premium') || 
        themeStr.includes('high-end') || themeStr.includes('exclusive') ||
        themeStr.includes('vip') || themeStr.includes('first-class')) {
      vector.luxury = Math.min(vector.luxury + THEME_WEIGHT, 1.0);
      vector.budget = Math.max(vector.budget - THEME_WEIGHT * 0.5, 0.1);
    }
    
    // Food & Culinary
    if (themeStr.includes('food') || themeStr.includes('culinary') || 
        themeStr.includes('restaurant') || themeStr.includes('cooking') ||
        themeStr.includes('cuisine') || themeStr.includes('chef')) {
      vector.food = Math.min(vector.food + THEME_WEIGHT, 1.0);
      vector.culture = Math.min(vector.culture + THEME_WEIGHT * 0.4, 1.0);
    }
    
    // Nature & Environment
    if (themeStr.includes('nature') || themeStr.includes('wildlife') || 
        themeStr.includes('landscape') || themeStr.includes('beach') ||
        themeStr.includes('mountain') || themeStr.includes('forest')) {
      vector.nature = Math.min(vector.nature + THEME_WEIGHT, 1.0);
    }
    
    // Urban & City Life
    if (themeStr.includes('urban') || themeStr.includes('city') || 
        themeStr.includes('metropolitan') || themeStr.includes('nightlife') ||
        themeStr.includes('shopping') || themeStr.includes('architecture')) {
      vector.urban = Math.min(vector.urban + THEME_WEIGHT, 1.0);
    }
    
    // Budget & Backpacking
    if (themeStr.includes('budget') || themeStr.includes('backpack') || 
        themeStr.includes('cheap') || themeStr.includes('hostel') ||
        themeStr.includes('frugal') || themeStr.includes('economical')) {
      vector.budget = Math.min(vector.budget + THEME_WEIGHT, 1.0);
      vector.luxury = Math.max(vector.luxury - THEME_WEIGHT * 0.6, 0.1);
    }

    // Creator-specific themes
    if (themeStr.includes('productivity') || themeStr.includes('educational') ||
        themeStr.includes('tech') || themeStr.includes('business') ||
        themeStr.includes('entrepreneur') || themeStr.includes('digital nomad')) {
      vector.urban = Math.min(vector.urban + THEME_WEIGHT * 0.8, 1.0);
      vector.culture = Math.min(vector.culture + THEME_WEIGHT * 0.6, 1.0);
      vector.luxury = Math.min(vector.luxury + THEME_WEIGHT * 0.4, 1.0);
    }
  });

  // Analyze content type with PRD compliance
  const contentTypeAnalysis = analyzeContentType(contentType);
  Object.keys(contentTypeAnalysis).forEach(key => {
    const k = key as keyof TasteVector;
    const analysisValue = contentTypeAnalysis[k];
    if (analysisValue !== undefined) {
      vector[k] = Math.min(vector[k] + analysisValue * CONTENT_TYPE_WEIGHT, 1.0);
    }
  });

  // Analyze hints for additional context
  hints.forEach(hint => {
    const hintAnalysis = analyzeHint(hint);
    Object.keys(hintAnalysis).forEach(key => {
      const k = key as keyof TasteVector;
      const analysisValue = hintAnalysis[k];
      if (analysisValue !== undefined) {
        vector[k] = Math.min(vector[k] + analysisValue * HINT_WEIGHT, 1.0);
      }
    });
  });

  // Social media platform analysis
  const socialAnalysis = analyzeSocialPlatforms(socialLinks);
  Object.keys(socialAnalysis).forEach(key => {
    const k = key as keyof TasteVector;
    const analysisValue = socialAnalysis[k];
    if (analysisValue !== undefined) {
      vector[k] = Math.min(vector[k] + analysisValue * SOCIAL_WEIGHT, 1.0);
    }
  });

  // Metadata analysis (title, description, keywords)
  const metadataAnalysis = analyzeMetadata(title, description, keywords);
  Object.keys(metadataAnalysis).forEach(key => {
    const k = key as keyof TasteVector;
    const analysisValue = metadataAnalysis[k];
    if (analysisValue !== undefined) {
      vector[k] = Math.min(vector[k] + analysisValue * METADATA_WEIGHT, 1.0);
    }
  });

  // Audience location analysis
  const audienceAnalysis = analyzeAudienceLocation(audienceLocation);
  Object.keys(audienceAnalysis).forEach(key => {
    const k = key as keyof TasteVector;
    const analysisValue = audienceAnalysis[k];
    if (analysisValue !== undefined) {
      vector[k] = Math.min(vector[k] + analysisValue * AUDIENCE_WEIGHT, 1.0);
    }
  });

  // Normalize values to ensure they're between 0 and 1
  Object.keys(vector).forEach((key) => {
    const k = key as keyof TasteVector;
    vector[k] = Math.max(0.05, Math.min(0.95, vector[k]));
  });

  return vector;
}

// Content type analysis based on PRD requirements
function analyzeContentType(contentType: string): Partial<TasteVector> {
  const analysis: Partial<TasteVector> = {};
  const type = contentType.toLowerCase();
  
  if (type.includes('photography') || type.includes('visual')) {
    analysis.culture = 0.3;
    analysis.nature = 0.25;
    analysis.urban = 0.2;
  } else if (type.includes('food') || type.includes('culinary')) {
    analysis.food = 0.4;
    analysis.culture = 0.3;
    analysis.urban = 0.2;
  } else if (type.includes('luxury') || type.includes('lifestyle')) {
    analysis.luxury = 0.4;
    analysis.urban = 0.3;
    analysis.culture = 0.2;
  } else if (type.includes('travel') || type.includes('adventure')) {
    analysis.adventure = 0.4;
    analysis.nature = 0.3;
    analysis.culture = 0.2;
  } else if (type.includes('productivity') || type.includes('educational') || type.includes('tech')) {
    analysis.urban = 0.4;
    analysis.culture = 0.3;
    analysis.luxury = 0.2;
  } else if (type.includes('wellness') || type.includes('health')) {
    analysis.nature = 0.4;
    analysis.culture = 0.2;
    analysis.luxury = 0.2;
  } else if (type.includes('business') || type.includes('entrepreneur')) {
    analysis.urban = 0.4;
    analysis.luxury = 0.3;
    analysis.culture = 0.2;
  }
  
  return analysis;
}

// Hint analysis for additional context
function analyzeHint(hint: string): Partial<TasteVector> {
  const analysis: Partial<TasteVector> = {};
  const hintStr = hint.toLowerCase();
  
  // Pattern matching for various creator types
  const patterns = {
    adventure: ['adventure', 'extreme', 'outdoor', 'hiking', 'climbing', 'sport'],
    culture: ['culture', 'art', 'history', 'museum', 'heritage', 'tradition'],
    luxury: ['luxury', 'premium', 'high-end', 'exclusive', 'vip', 'first-class'],
    food: ['food', 'culinary', 'restaurant', 'cooking', 'cuisine', 'chef'],
    nature: ['nature', 'wildlife', 'landscape', 'beach', 'mountain', 'forest'],
    urban: ['urban', 'city', 'metropolitan', 'nightlife', 'shopping', 'architecture'],
    budget: ['budget', 'backpack', 'cheap', 'hostel', 'frugal', 'economical']
  };
  
  Object.keys(patterns).forEach(category => {
    const categoryPatterns = patterns[category as keyof typeof patterns];
    if (categoryPatterns.some(pattern => hintStr.includes(pattern))) {
      analysis[category as keyof TasteVector] = 0.15;
    }
  });
  
  return analysis;
}

// Social platform analysis
function analyzeSocialPlatforms(socialLinks: { platform: string; url: string }[]): Partial<TasteVector> {
  const analysis: Partial<TasteVector> = {};
  
  socialLinks.forEach(link => {
    const platform = link.platform.toLowerCase();
    
    if (platform.includes('instagram')) {
      analysis.culture = (analysis.culture || 0) + 0.1;
      analysis.food = (analysis.food || 0) + 0.1;
      analysis.luxury = (analysis.luxury || 0) + 0.08;
    } else if (platform.includes('youtube')) {
      analysis.culture = (analysis.culture || 0) + 0.12;
      analysis.adventure = (analysis.adventure || 0) + 0.1;
    } else if (platform.includes('tiktok')) {
      analysis.urban = (analysis.urban || 0) + 0.1;
      analysis.culture = (analysis.culture || 0) + 0.08;
    } else if (platform.includes('linkedin')) {
      analysis.urban = (analysis.urban || 0) + 0.12;
      analysis.luxury = (analysis.luxury || 0) + 0.1;
    }
  });
  
  return analysis;
}

// Metadata analysis (title, description, keywords)
function analyzeMetadata(title?: string, description?: string, keywords?: string[]): Partial<TasteVector> {
  const analysis: Partial<TasteVector> = {};
  const text = [title, description, ...(keywords || [])].join(' ').toLowerCase();
  
  // Creator-specific keyword analysis based on PRD
  const creatorPatterns = {
    productivity: ['productivity', 'efficiency', 'workflow', 'optimization'],
    education: ['education', 'learning', 'tutorial', 'course', 'teaching'],
    business: ['business', 'entrepreneur', 'startup', 'growth', 'strategy'],
    tech: ['technology', 'software', 'digital', 'innovation', 'ai'],
    lifestyle: ['lifestyle', 'wellness', 'health', 'mindfulness', 'balance']
  };
  
  Object.keys(creatorPatterns).forEach(category => {
    const patterns = creatorPatterns[category as keyof typeof creatorPatterns];
    if (patterns.some(pattern => text.includes(pattern))) {
      if (category === 'productivity' || category === 'business' || category === 'tech') {
        analysis.urban = (analysis.urban || 0) + 0.08;
        analysis.luxury = (analysis.luxury || 0) + 0.06;
      } else if (category === 'education') {
        analysis.culture = (analysis.culture || 0) + 0.08;
        analysis.urban = (analysis.urban || 0) + 0.06;
      } else if (category === 'lifestyle') {
        analysis.luxury = (analysis.luxury || 0) + 0.08;
        analysis.nature = (analysis.nature || 0) + 0.06;
      }
    }
  });
  
  return analysis;
}

// Audience location analysis
function analyzeAudienceLocation(audienceLocation?: string): Partial<TasteVector> {
  const analysis: Partial<TasteVector> = {};
  
  if (!audienceLocation) return analysis;
  
  const location = audienceLocation.toLowerCase();
  
  // Regional preferences based on audience location
  if (location.includes('north america') || location.includes('usa') || location.includes('canada')) {
    analysis.adventure = 0.05;
    analysis.urban = 0.05;
    analysis.luxury = 0.04;
  } else if (location.includes('europe')) {
    analysis.culture = 0.06;
    analysis.luxury = 0.05;
    analysis.urban = 0.04;
  } else if (location.includes('asia')) {
    analysis.culture = 0.05;
    analysis.food = 0.06;
    analysis.urban = 0.04;
  } else if (location.includes('global') || location.includes('worldwide')) {
    // Balanced approach for global audience
    analysis.culture = 0.03;
    analysis.urban = 0.03;
    analysis.adventure = 0.03;
  }
  
  return analysis;
}

// PRD-compliant cultural affinities generation
function generateCulturalAffinities(vector: TasteVector, websiteData: any): string[] {
  const affinities: string[] = [];
  const threshold = 0.4; // Lower threshold for more inclusive recommendations

  // Adventure & Outdoor Culture
  if (vector.adventure > threshold) {
    affinities.push("Adventure Sports", "Outdoor Activities", "Extreme Experiences");
  }
  
  // Cultural Heritage & Arts
  if (vector.culture > threshold) {
    affinities.push("Cultural Heritage", "Museums & Galleries", "Local Traditions", "Historical Sites");
  }
  
  // Luxury & Premium Experiences
  if (vector.luxury > threshold) {
    affinities.push("Luxury Travel", "Fine Dining", "Premium Accommodations", "Exclusive Experiences");
  }
  
  // Culinary Culture
  if (vector.food > threshold) {
    affinities.push("Culinary Exploration", "Local Cuisine", "Food Markets", "Cooking Experiences");
  }
  
  // Nature & Wildlife
  if (vector.nature > threshold) {
    affinities.push("Natural Wonders", "Wildlife Encounters", "Scenic Landscapes", "Eco-Tourism");
  }
  
  // Urban Culture & Architecture
  if (vector.urban > threshold) {
    affinities.push("Urban Exploration", "Modern Architecture", "City Culture", "Metropolitan Life");
  }
  
  // Budget-Conscious Travel
  if (vector.budget > 0.6) {
    affinities.push("Budget Travel", "Local Transportation", "Authentic Experiences", "Value Travel");
  }

  // Content creator specific affinities based on themes
  const themes = websiteData?.themes || [];
  themes.forEach((theme: string) => {
    const themeStr = theme.toLowerCase();
    if (themeStr.includes('productivity') || themeStr.includes('education')) {
      affinities.push("Learning Experiences", "Educational Tourism", "Skill Development");
    }
    if (themeStr.includes('business') || themeStr.includes('entrepreneur')) {
      affinities.push("Business Networking", "Innovation Hubs", "Entrepreneurial Ecosystems");
    }
    if (themeStr.includes('tech') || themeStr.includes('digital')) {
      affinities.push("Tech Innovation", "Digital Nomad Hubs", "Future Cities");
    }
  });

  // Remove duplicates and return top cultural affinities
  const uniqueAffinities = [...new Set(affinities)];
  return uniqueAffinities.slice(0, 8); // Increased limit for more comprehensive profiling
}

// PRD-compliant personality traits generation
function generatePersonalityTraits(vector: TasteVector, websiteData: any): string[] {
  const traits: string[] = [];
  const threshold = 0.5; // Balanced threshold for trait detection

  // Core personality traits based on taste vector
  if (vector.adventure > threshold) {
    traits.push("Adventure Seeker", "Risk Taker");
  }
  if (vector.culture > threshold) {
    traits.push("Culture Enthusiast", "History Buff");
  }
  if (vector.luxury > threshold) {
    traits.push("Quality Appreciator", "Experience Connoisseur");
  }
  if (vector.food > threshold) {
    traits.push("Culinary Explorer", "Taste Adventurer");
  }
  if (vector.nature > threshold) {
    traits.push("Nature Lover", "Environmental Conscious");
  }
  if (vector.urban > threshold) {
    traits.push("City Explorer", "Modern Lifestyle Enthusiast");
  }
  if (vector.budget > 0.6) {
    traits.push("Value Seeker", "Resourceful Traveler");
  }

  // Content creator specific personality traits
  const contentType = websiteData?.contentType?.toLowerCase() || '';
  const themes = websiteData?.themes || [];
  
  // Analyze content type for creator personality
  if (contentType.includes('productivity') || contentType.includes('educational')) {
    traits.push("Knowledge Seeker", "Efficiency Expert", "Learning Enthusiast");
  }
  if (contentType.includes('business') || contentType.includes('entrepreneur')) {
    traits.push("Innovation Driver", "Growth Mindset", "Strategic Thinker");
  }
  if (contentType.includes('lifestyle') || contentType.includes('wellness')) {
    traits.push("Balance Seeker", "Mindful Traveler", "Wellness Advocate");
  }
  if (contentType.includes('tech') || contentType.includes('digital')) {
    traits.push("Tech Enthusiast", "Digital Pioneer", "Future-Oriented");
  }

  // Combination traits for more nuanced profiling
  if (vector.adventure > 0.4 && vector.nature > 0.4) {
    traits.push("Outdoor Adventurer");
  }
  if (vector.culture > 0.4 && vector.food > 0.4) {
    traits.push("Cultural Foodie");
  }
  if (vector.luxury > 0.4 && vector.urban > 0.4) {
    traits.push("Urban Sophisticate");
  }
  if (vector.adventure > 0.4 && vector.culture > 0.4) {
    traits.push("Cultural Explorer");
  }
  if (vector.nature > 0.4 && vector.culture > 0.4) {
    traits.push("Heritage Naturalist");
  }

  // Social media platform based traits
  const socialLinks = websiteData?.socialLinks || [];
  socialLinks.forEach((link: any) => {
    const platform = link.platform.toLowerCase();
    if (platform.includes('youtube')) {
      traits.push("Visual Storyteller", "Content Creator");
    }
    if (platform.includes('instagram')) {
      traits.push("Visual Curator", "Aesthetic Appreciator");
    }
    if (platform.includes('linkedin')) {
      traits.push("Professional Networker", "Industry Thought Leader");
    }
  });

  // Remove duplicates and return top personality traits
  const uniqueTraits = [...new Set(traits)];
  return uniqueTraits.slice(0, 7); // Increased limit for comprehensive profiling
}

// PRD-compliant smart destination recommendations with scoring
function generatePRDCompliantRecommendations(vector: TasteVector, websiteData: any): string[] {
  const recommendations: Map<string, number> = new Map();
  const threshold = 0.3; // Lower threshold for broader recommendations

  // Define destination scoring based on PRD algorithm components
  const destinationScores = {
    // Adventure destinations
    "Queenstown, New Zealand": { adventure: 0.9, nature: 0.8, luxury: 0.6, urban: 0.3 },
    "Costa Rica": { adventure: 0.8, nature: 0.9, culture: 0.6, budget: 0.7 },
    "Nepal (Kathmandu & Pokhara)": { adventure: 0.9, culture: 0.8, nature: 0.8, budget: 0.8 },
    "Patagonia, Chile": { adventure: 0.9, nature: 0.9, luxury: 0.4, culture: 0.5 },
    
    // Cultural destinations
    "Kyoto, Japan": { culture: 0.9, luxury: 0.7, urban: 0.6, food: 0.8 },
    "Rome, Italy": { culture: 0.9, food: 0.8, luxury: 0.6, urban: 0.7 },
    "Istanbul, Turkey": { culture: 0.9, food: 0.7, urban: 0.8, budget: 0.6 },
    "Marrakech, Morocco": { culture: 0.9, adventure: 0.6, food: 0.7, budget: 0.7 },
    "Cusco, Peru": { culture: 0.9, adventure: 0.7, nature: 0.7, budget: 0.8 },
    
    // Luxury destinations
    "Dubai, UAE": { luxury: 0.9, urban: 0.8, culture: 0.6, food: 0.7 },
    "Monaco": { luxury: 0.9, urban: 0.7, culture: 0.5, nature: 0.4 },
    "Santorini, Greece": { luxury: 0.8, nature: 0.7, culture: 0.6, food: 0.7 },
    "Maldives": { luxury: 0.9, nature: 0.8, adventure: 0.6, culture: 0.3 },
    "Aspen, USA": { luxury: 0.8, adventure: 0.7, nature: 0.8, urban: 0.4 },
    
    // Food destinations
    "Tokyo, Japan": { food: 0.9, culture: 0.8, urban: 0.9, luxury: 0.7 },
    "Paris, France": { food: 0.9, culture: 0.9, luxury: 0.8, urban: 0.8 },
    "Bangkok, Thailand": { food: 0.9, culture: 0.7, urban: 0.7, budget: 0.8 },
    "Lima, Peru": { food: 0.8, culture: 0.7, adventure: 0.6, budget: 0.7 },
    "Mumbai, India": { food: 0.8, culture: 0.8, urban: 0.8, budget: 0.9 },
    
    // Nature destinations
    "Iceland": { nature: 0.9, adventure: 0.8, culture: 0.6, luxury: 0.5 },
    "Norwegian Fjords": { nature: 0.9, adventure: 0.7, luxury: 0.6, culture: 0.5 },
    "Banff, Canada": { nature: 0.9, adventure: 0.8, luxury: 0.6, culture: 0.4 },
    "Yellowstone, USA": { nature: 0.9, adventure: 0.7, culture: 0.5, budget: 0.6 },
    
    // Urban destinations
    "New York, USA": { urban: 0.9, culture: 0.8, food: 0.8, luxury: 0.7 },
    "London, UK": { urban: 0.9, culture: 0.9, food: 0.7, luxury: 0.7 },
    "Singapore": { urban: 0.9, food: 0.8, luxury: 0.7, culture: 0.6 },
    "Barcelona, Spain": { urban: 0.8, culture: 0.8, food: 0.8, adventure: 0.5 },
    "Berlin, Germany": { urban: 0.8, culture: 0.8, food: 0.6, budget: 0.7 },
    
    // Budget-friendly destinations
    "Vietnam": { budget: 0.9, food: 0.8, culture: 0.7, adventure: 0.6 },
    "Portugal": { budget: 0.8, culture: 0.8, food: 0.7, nature: 0.6 },
    "Czech Republic": { budget: 0.8, culture: 0.8, urban: 0.6, food: 0.6 },
    "Guatemala": { budget: 0.9, culture: 0.7, adventure: 0.7, nature: 0.7 },
    "India": { budget: 0.9, culture: 0.9, food: 0.8, adventure: 0.6 },
    
    // Creator-specific destinations
    "Tel Aviv, Israel": { urban: 0.8, culture: 0.7, food: 0.8, luxury: 0.6 },
    "Austin, USA": { urban: 0.7, culture: 0.6, food: 0.7, budget: 0.7 },
    "Copenhagen, Denmark": { urban: 0.8, culture: 0.7, food: 0.7, luxury: 0.6 },
    "Melbourne, Australia": { urban: 0.8, culture: 0.7, food: 0.8, adventure: 0.5 },
    "Lisbon, Portugal": { urban: 0.7, culture: 0.8, food: 0.7, budget: 0.8 },
    "Amsterdam, Netherlands": { urban: 0.8, culture: 0.8, food: 0.6, luxury: 0.6 },
    
    // Tech/Business hubs
    "San Francisco, USA": { urban: 0.9, luxury: 0.7, culture: 0.6, food: 0.7 },
    "Zurich, Switzerland": { urban: 0.7, luxury: 0.9, culture: 0.6, nature: 0.6 },
    "Seoul, South Korea": { urban: 0.9, culture: 0.7, food: 0.8, luxury: 0.6 },
    "Stockholm, Sweden": { urban: 0.8, culture: 0.7, luxury: 0.6, nature: 0.6 }
  };

  // Calculate scores for each destination using PRD algorithm
  Object.entries(destinationScores).forEach(([destination, scores]) => {
    let totalScore = 0;
    
    // Apply PRD scoring weights (simplified version)
    // Qloo Affinity (45% weight) - based on taste vector alignment
    const qlooAffinity = Object.keys(scores).reduce((sum, key) => {
      const vectorKey = key as keyof TasteVector;
      return sum + (vector[vectorKey] * scores[vectorKey as keyof typeof scores]);
    }, 0) / Object.keys(scores).length;
    
    totalScore += qlooAffinity * 0.45;
    
    // Community Engagement (25% weight) - estimated based on destination popularity
    const engagementScore = destination.includes('Tokyo') || destination.includes('Paris') || destination.includes('New York') ? 0.8 : 0.6;
    totalScore += engagementScore * 0.25;
    
    // Brand Collaboration Fit (15% weight) - based on luxury and urban scores
    const luxuryScore = 'luxury' in scores ? scores.luxury : 0.3;
    const urbanScore = 'urban' in scores ? scores.urban : 0.3;
    const brandScore = luxuryScore * 0.6 + urbanScore * 0.4;
    totalScore += brandScore * 0.15;
    
    // Budget Alignment (10% weight) - based on budget preferences
    const budgetValue = 'budget' in scores ? scores.budget : 0.5;
    const budgetScore = vector.budget > 0.6 ? budgetValue : (1 - budgetValue);
    totalScore += budgetScore * 0.10;
    
    // Creator Collaboration Potential (5% weight) - based on urban and culture scores
    const cultureScore = 'culture' in scores ? scores.culture : 0.3;
    const creatorScore = urbanScore * 0.6 + cultureScore * 0.4;
    totalScore += creatorScore * 0.05;
    
    recommendations.set(destination, totalScore);
  });

  // Content creator specific recommendations
  const themes = websiteData?.themes || [];
  const contentType = websiteData?.contentType?.toLowerCase() || '';
  
  themes.forEach((theme: string) => {
    const themeStr = theme.toLowerCase();
    if (themeStr.includes('productivity') || themeStr.includes('business')) {
      // Boost business-friendly destinations
      recommendations.set('Singapore', (recommendations.get('Singapore') || 0) + 0.1);
      recommendations.set('Zurich, Switzerland', (recommendations.get('Zurich, Switzerland') || 0) + 0.1);
      recommendations.set('Tokyo, Japan', (recommendations.get('Tokyo, Japan') || 0) + 0.1);
    }
    if (themeStr.includes('tech') || themeStr.includes('digital')) {
      recommendations.set('San Francisco, USA', (recommendations.get('San Francisco, USA') || 0) + 0.1);
      recommendations.set('Seoul, South Korea', (recommendations.get('Seoul, South Korea') || 0) + 0.1);
      recommendations.set('Tel Aviv, Israel', (recommendations.get('Tel Aviv, Israel') || 0) + 0.1);
    }
    if (themeStr.includes('wellness') || themeStr.includes('health')) {
      recommendations.set('Costa Rica', (recommendations.get('Costa Rica') || 0) + 0.1);
      recommendations.set('Bali, Indonesia', 0.7);
      recommendations.set('Rishikesh, India', 0.6);
    }
  });

  // Sort by score and return top recommendations
  const sortedRecommendations = Array.from(recommendations.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([destination]) => destination)
    .slice(0, 12); // Increased limit for better variety

  return sortedRecommendations;
}

// PRD-compliant confidence calculation based on data quality
function calculatePRDCompliantConfidence(websiteData: any): number {
  let confidence = 0.4; // Base confidence for PRD compliance
  
  const { themes, hints, contentType, socialLinks, title, description, keywords } = websiteData;

  // Theme quality and quantity (25% of confidence)
  if (themes && themes.length > 0) {
    confidence += Math.min(themes.length * 0.04, 0.15);
    
    // Bonus for specific, detailed themes
    const specificThemes = themes.filter((theme: string) => 
      theme.length > 5 && !['travel', 'lifestyle', 'blog'].includes(theme.toLowerCase())
    );
    confidence += Math.min(specificThemes.length * 0.02, 0.1);
  }

  // Hint quality and context (20% of confidence)
  if (hints && hints.length > 0) {
    confidence += Math.min(hints.length * 0.03, 0.12);
    
    // Bonus for creator-specific hints
    const creatorHints = ['content creator', 'influencer', 'youtuber', 'blogger', 'educator', 'entrepreneur'];
    if (hints.some((hint: string) => creatorHints.some(ch => hint.toLowerCase().includes(ch)))) {
      confidence += 0.08;
    }
  }

  // Content type specificity (15% of confidence)
  if (contentType && contentType.length > 3) {
    confidence += 0.08;
    
    // Higher confidence for specific content types
    const specificTypes = ['productivity', 'educational', 'business', 'tech', 'culinary', 'photography'];
    if (specificTypes.some(type => contentType.toLowerCase().includes(type))) {
      confidence += 0.07;
    }
  }

  // Social media presence (15% of confidence)
  if (socialLinks && socialLinks.length > 0) {
    confidence += Math.min(socialLinks.length * 0.03, 0.12);
    
    // Bonus for major platforms
    const majorPlatforms = ['youtube', 'instagram', 'tiktok', 'linkedin'];
    const majorPlatformCount = socialLinks.filter((link: any) => 
      majorPlatforms.some(platform => link.platform.toLowerCase().includes(platform))
    ).length;
    confidence += Math.min(majorPlatformCount * 0.02, 0.08);
  }

  // Website metadata quality (15% of confidence)
  let metadataScore = 0;
  if (title && title.length > 10) metadataScore += 0.03;
  if (description && description.length > 50) metadataScore += 0.04;
  if (keywords && keywords.length > 3) metadataScore += 0.03;
  confidence += Math.min(metadataScore, 0.1);

  // Data consistency bonus (10% of confidence)
  const consistencyBonus = calculateDataConsistency(websiteData);
  confidence += consistencyBonus * 0.1;

  // Ensure confidence is within PRD-compliant range
  return Math.max(0.3, Math.min(confidence, 0.92)); // Cap at 92% for realistic confidence
}

// Calculate data consistency across different inputs
function calculateDataConsistency(websiteData: any): number {
  const { themes, hints, contentType, socialLinks } = websiteData;
  let consistency = 0;
  
  // Check theme-content type alignment
  if (themes && contentType) {
    const contentTypeLower = contentType.toLowerCase();
    const alignedThemes = themes.filter((theme: string) => {
      const themeLower = theme.toLowerCase();
      return contentTypeLower.includes(themeLower) || themeLower.includes(contentTypeLower.split(' ')[0]);
    });
    consistency += Math.min(alignedThemes.length / themes.length, 0.3);
  }
  
  // Check social platform consistency
  if (socialLinks && socialLinks.length > 1) {
    // Bonus for having multiple consistent platforms
    consistency += 0.2;
  }
  
  // Check hint-theme consistency
  if (hints && themes) {
    const consistentHints = hints.filter((hint: string) => 
      themes.some((theme: string) => 
        hint.toLowerCase().includes(theme.toLowerCase()) || 
        theme.toLowerCase().includes(hint.toLowerCase())
      )
    );
    consistency += Math.min(consistentHints.length / Math.max(hints.length, 1), 0.3);
  }
  
  return Math.min(consistency, 1.0);
}

// Helper function to get tag IDs from Qloo /v2/tags endpoint
async function getQlooTagIds(themes: string[]): Promise<string[]> {
  const tagIds: string[] = [];
  
  for (const theme of themes.slice(0, 3)) { // Limit to first 3 themes to avoid too many requests
    try {
      const url = `${process.env.QLOO_API_URL}/v2/tags?filter.query=${encodeURIComponent(theme)}`;
      console.log(`Fetching tags for "${theme}": ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY!,
          'Accept': 'application/json',
          'User-Agent': 'TasteJourney/1.0'
        }
      });
      
      console.log(`Tag lookup for "${theme}": ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Tag data for "${theme}":`, JSON.stringify(data, null, 2));
        
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const tagId = data.results[0].id;
          console.log(`Found tag ID for "${theme}": ${tagId}`);
          tagIds.push(tagId);
        } else {
          console.log(`No tags found for "${theme}"`);
        }
      } else {
        const errorText = await response.text();
        console.warn(`Tag lookup failed for "${theme}": ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.warn(`Failed to get tag ID for "${theme}":`, error);
    }
  }
  
  return tagIds;
}

// Real Qloo API integration with enhanced error handling
// See Qloo API docs: https://docs.qloo.com/
async function callQlooAPI(request: QlooRequest): Promise<QlooResponse> {
  // Validate environment variables
  if (!process.env.QLOO_API_KEY || !process.env.QLOO_API_URL) {
    throw new Error('Missing required Qloo API configuration: QLOO_API_KEY and QLOO_API_URL must be set');
  }

  // First, try to get valid tag IDs for our themes
  console.log('Getting tag IDs for themes:', request.themes);
  const tagIds = await getQlooTagIds(request.themes);
  console.log('Retrieved tag IDs:', tagIds);

  // Try Qloo API endpoints with official URN format filter.type values from hackathon documentation
  const endpoints: Array<{path: string, method: string, filterType?: string}> = [
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:destination' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:place' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:brand' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:movie' },
    { path: '/v2/insights', method: 'GET', filterType: 'urn:entity:tv_show' },
  ];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const endpointDesc = endpoint.filterType 
        ? `${endpoint.path} (${endpoint.method}, filter.type=${endpoint.filterType})`
        : `${endpoint.path} (${endpoint.method})`;
      console.log(`Trying Qloo endpoint: ${process.env.QLOO_API_URL}${endpointDesc}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Prepare request configuration
      const requestConfig: RequestInit = {
        method: endpoint.method,
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'TasteJourney/1.0'
        },
        signal: controller.signal
      };

      // Add body and content-type for POST requests
      if (endpoint.method === 'POST') {
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Type': 'application/json'
        };
        requestConfig.body = JSON.stringify({
          content_themes: request.themes,
          content_hints: request.hints,
          content_type: request.contentType,
          social_profiles: request.socialLinks,
          demographics: request.demographics,
          // Alternative payload formats for different API versions
          input: {
            themes: request.themes,
            hints: request.hints,
            contentType: request.contentType,
            interests: request.themes
          },
          // Additional fields that Qloo might expect
          preferences: {
            themes: request.themes,
            hints: request.hints
          }
        });
      }

      // Build URL with query parameters for GET requests
      let url = `${process.env.QLOO_API_URL}${endpoint.path}`;
      
      if (endpoint.method === 'GET') {
        const params = new URLSearchParams();
        
        // REQUIRED: filter.type parameter (official URN format)
        if (endpoint.filterType) {
          params.append('filter.type', endpoint.filterType);
        }
        
        // REQUIRED: At least one valid signal or filter parameter (per hackathon docs)
        // Use actual tag IDs if we got them, otherwise use theme-based approach
        if (tagIds.length > 0) {
          // Use valid tag IDs (this is the preferred approach)
          params.append('signal.interests.tags', tagIds.join(','));
          console.log('Using tag IDs for signal.interests.tags:', tagIds);
        } else {
          console.log('No tag IDs found, using theme-based signals');
          
          // Convert themes to appropriate signal parameters based on successful test
          const themeKeywords = request.themes.join(',');
          params.append('signal.interests.tags', themeKeywords);
          console.log('Added signal.interests.tags:', themeKeywords);
        }
        
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, requestConfig);

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`Success with endpoint ${endpointDesc}:`, JSON.stringify(data, null, 2));
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from Qloo API');
        }
        
        // Parse Qloo API response - handle actual hackathon API format
        const entities = data.results?.entities || [];
        const destinations = entities.map((entity: Record<string, unknown>) => entity.name).slice(0, 8);
        
        // Extract taste vector from entity tags and properties
        const tasteVector = generateTasteVectorFromEntities(entities, request.themes);
        
        // Extract cultural affinities from entity tags
        const culturalAffinities = extractCulturalAffinities(entities);
        
        // Generate personality traits based on destinations and preferences
        const personalityTraits = generatePersonalityFromDestinations(destinations, request.themes);
        
        return {
          tasteVector,
          recommendations: destinations,
          confidence: Math.min(Math.max(0.85, 0), 1), // High confidence for real API data
          culturalAffinities,
          personalityTraits,
          processingTime: `Qloo API via ${endpointDesc}`
        };
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        const errorMsg = `HTTP ${response.status}: ${errorText}`;
        errors.push(`${endpointDesc} - ${errorMsg}`);
        console.warn(`Failed endpoint ${endpointDesc}: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const endpointDesc = endpoint.filterType 
        ? `${endpoint.path} (${endpoint.method}, filter.type=${endpoint.filterType})`
        : `${endpoint.path} (${endpoint.method})`;
      errors.push(`${endpointDesc} - ${errorMsg}`);
      console.warn(`Error with endpoint ${endpointDesc}:`, errorMsg);
    }
  }

  // All endpoints failed
  const finalError = new Error(`All Qloo API endpoints failed. Errors: ${errors.join('; ')}`);
  console.error('Qloo API integration failed:', finalError.message);
  throw finalError;
}

// Helper functions for parsing Qloo API responses

// Generate taste vector from Qloo entities
function generateTasteVectorFromEntities(entities: Record<string, unknown>[], themes: string[]): TasteVector {
  const vector = generateDynamicTasteVector({
    themes,
    hints: [],
    contentType: '',
    socialLinks: []
  }); // Start with base vector
  
  // Analyze entity tags to refine taste vector
  entities.forEach(entity => {
    const tags = (entity.tags as Record<string, unknown>[]) || [];
    const popularity = (entity.popularity as number) || 0;
    const query = entity.query as Record<string, unknown> | undefined;
    const affinity = (query?.affinity as number) || 0;
    
    tags.forEach((tag: Record<string, unknown>) => {
      const tagName = (tag.name as string)?.toLowerCase() || '';
      const weight = (popularity + affinity) / 2;
      
      if (tagName.includes('outdoor') || tagName.includes('adventure')) {
        vector.adventure = Math.min(vector.adventure + (weight * 0.3), 1.0);
      }
      if (tagName.includes('culture') || tagName.includes('art') || tagName.includes('history')) {
        vector.culture = Math.min(vector.culture + (weight * 0.3), 1.0);
      }
      if (tagName.includes('luxury') || tagName.includes('premium')) {
        vector.luxury = Math.min(vector.luxury + (weight * 0.3), 1.0);
      }
      if (tagName.includes('food') || tagName.includes('culinary')) {
        vector.food = Math.min(vector.food + (weight * 0.3), 1.0);
      }
      if (tagName.includes('nature') || tagName.includes('scenic') || tagName.includes('beach')) {
        vector.nature = Math.min(vector.nature + (weight * 0.3), 1.0);
      }
      if (tagName.includes('urban') || tagName.includes('city')) {
        vector.urban = Math.min(vector.urban + (weight * 0.3), 1.0);
      }
    });
  });
  
  return vector;
}

// Extract cultural affinities from Qloo entities
function extractCulturalAffinities(entities: Record<string, unknown>[]): string[] {
  const affinities = new Set<string>();
  
  entities.forEach(entity => {
    const tags = (entity.tags as Record<string, unknown>[]) || [];
    tags.forEach((tag: Record<string, unknown>) => {
      const tagName = tag.name as string;
      if (tagName && !tagName.includes('Destination')) {
        affinities.add(tagName);
      }
    });
  });
  
  return Array.from(affinities).slice(0, 6);
}

// Generate personality traits from destinations
function generatePersonalityFromDestinations(destinations: string[], themes: string[]): string[] {
  const traits = new Set<string>();
  
  // Add theme-based traits
  themes.forEach(theme => {
    switch (theme.toLowerCase()) {
      case 'adventure':
        traits.add('Adventure Seeker');
        break;
      case 'culture':
        traits.add('Culture Enthusiast');
        break;
      case 'photography':
        traits.add('Visual Storyteller');
        break;
      case 'travel':
        traits.add('Global Explorer');
        break;
      case 'food':
        traits.add('Culinary Explorer');
        break;
    }
  });
  
  // Add destination-based traits
  if (destinations.some(d => d.includes('Beach') || d.includes('Coast'))) {
    traits.add('Beach Lover');
  }
  if (destinations.some(d => d.includes('Mountain') || d.includes('Alps'))) {
    traits.add('Mountain Explorer');
  }
  
  return Array.from(traits).slice(0, 5);
}

// Helper function to check Qloo API configuration
function isQlooConfigured(): boolean {
  return !!(process.env.QLOO_API_KEY && process.env.QLOO_API_URL);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      themes, 
      hints, 
      contentType, 
      socialLinks, 
      demographics,
      title,
      description,
      keywords,
      audienceLocation,
      url
    } = body;

    // Enhanced validation for PRD compliance
    if (!themes || !Array.isArray(themes)) {
      return NextResponse.json(
        { error: "themes array is required for taste profiling" },
        { status: 400 }
      );
    }

    if (!hints || !Array.isArray(hints)) {
      return NextResponse.json(
        { error: "hints array is required for content analysis" },
        { status: 400 }
      );
    }

    // Prepare comprehensive website data for PRD-compliant analysis
    const websiteData = {
      themes,
      hints,
      contentType: contentType || "Mixed Content",
      socialLinks: socialLinks || [],
      title: title || '',
      description: description || '',
      keywords: keywords || [],
      audienceLocation: audienceLocation || 'Global',
      url: url || '',
      demographics: demographics || {}
    };

    console.log('🎯 Generating PRD-compliant taste profile...');
    console.log(`Input quality: ${themes.length} themes, ${hints.length} hints, ${(socialLinks || []).length} social links`);
    
    // Log configuration status
    console.log(`Qloo API configured: ${isQlooConfigured()}`);
    if (isQlooConfigured()) {
      console.log(`Qloo API URL: ${process.env.QLOO_API_URL}`);
      console.log(`Qloo API Key present: ${!!process.env.QLOO_API_KEY}`);
    }

    // Prepare Qloo request with enhanced data
    const qlooRequest: QlooRequest = {
      themes,
      hints,
      contentType: websiteData.contentType,
      socialLinks: websiteData.socialLinks,
      demographics: {
        ...demographics,
        audienceLocation: websiteData.audienceLocation,
        contentFocus: themes.slice(0, 3), // Top 3 themes for focus
      },
    };

    // Try real Qloo API first, fallback to PRD-compliant system
    let qlooResponse: QlooResponse;
    let usedRealAPI = false;
    
    if (isQlooConfigured()) {
      try {
        console.log("🔄 Attempting to use real Qloo API for enhanced taste profiling...");
        qlooResponse = await callQlooAPI(qlooRequest);
        console.log("✅ Successfully received data from Qloo API");
        usedRealAPI = true;
        
        // Enhance Qloo response with website-specific insights (PRD: 90% Qloo + 10% website)
        qlooResponse = enhanceQlooResponseWithWebsiteData(qlooResponse, websiteData);
        
      } catch (error) {
        console.log("⚠️ Qloo API failed, using PRD-compliant fallback system:", error);
        qlooResponse = generatePRDCompliantResponse(websiteData);
      }
    } else {
      console.log("🔧 Qloo API not configured, using PRD-compliant system");
      qlooResponse = generatePRDCompliantResponse(websiteData);
    }


    // Simulate realistic processing time based on data complexity
    const processingTime = calculateProcessingTime(websiteData);
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Generate comprehensive metadata for PRD compliance
    const metadata = generatePRDCompliantMetadata(websiteData, qlooResponse, usedRealAPI);

    console.log(`✅ Generated taste profile with ${qlooResponse.confidence.toFixed(2)} confidence`);
    console.log(`📊 Recommendations: ${qlooResponse.recommendations.length}, Cultural Affinities: ${qlooResponse.culturalAffinities.length}`);

    return NextResponse.json({
      success: true,
      data: qlooResponse,
      metadata,
    });
  } catch (error) {
    console.error("❌ Error generating taste profile:", error);
    return NextResponse.json(
      {
        error: "Failed to generate taste profile",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Generate PRD-compliant response using enhanced algorithms
function generatePRDCompliantResponse(websiteData: any): QlooResponse {
  const tasteVector = generateDynamicTasteVector(websiteData);
  
  return {
    tasteVector,
    recommendations: generatePRDCompliantRecommendations(tasteVector, websiteData),
    confidence: calculatePRDCompliantConfidence(websiteData),
    culturalAffinities: generateCulturalAffinities(tasteVector, websiteData),
    personalityTraits: generatePersonalityTraits(tasteVector, websiteData),
    processingTime: "PRD-Compliant AI Analysis"
  };
}

// Enhance Qloo API response with website-specific data (PRD: 90% Qloo + 10% website)
function enhanceQlooResponseWithWebsiteData(qlooResponse: QlooResponse, websiteData: any): QlooResponse {
  const websiteVector = generateDynamicTasteVector(websiteData);
  
  // Blend Qloo response (90%) with website insights (10%)
  const enhancedVector: TasteVector = {
    adventure: qlooResponse.tasteVector.adventure * 0.9 + websiteVector.adventure * 0.1,
    culture: qlooResponse.tasteVector.culture * 0.9 + websiteVector.culture * 0.1,
    luxury: qlooResponse.tasteVector.luxury * 0.9 + websiteVector.luxury * 0.1,
    food: qlooResponse.tasteVector.food * 0.9 + websiteVector.food * 0.1,
    nature: qlooResponse.tasteVector.nature * 0.9 + websiteVector.nature * 0.1,
    urban: qlooResponse.tasteVector.urban * 0.9 + websiteVector.urban * 0.1,
    budget: qlooResponse.tasteVector.budget * 0.9 + websiteVector.budget * 0.1
  };
  
  // Enhance recommendations with website-specific suggestions
  const websiteRecommendations = generatePRDCompliantRecommendations(websiteVector, websiteData);
  const blendedRecommendations = [
    ...qlooResponse.recommendations.slice(0, 8), // Keep top Qloo recommendations
    ...websiteRecommendations.slice(0, 4) // Add website-specific recommendations
  ];
  
  return {
    ...qlooResponse,
    tasteVector: enhancedVector,
    recommendations: [...new Set(blendedRecommendations)].slice(0, 10), // Remove duplicates, limit to 10
    culturalAffinities: generateCulturalAffinities(enhancedVector, websiteData),
    personalityTraits: generatePersonalityTraits(enhancedVector, websiteData),
    processingTime: "Enhanced Qloo API + Website Analysis"
  };
}



// Calculate realistic processing time based on data complexity
function calculateProcessingTime(websiteData: any): number {
  const baseTime = 1000; // 1 second base
  const themeComplexity = (websiteData.themes?.length || 0) * 100;
  const hintComplexity = (websiteData.hints?.length || 0) * 50;
  const socialComplexity = (websiteData.socialLinks?.length || 0) * 150;
  
  const totalTime = baseTime + themeComplexity + hintComplexity + socialComplexity;
  return Math.min(Math.max(totalTime, 800), 3000); // Between 0.8-3 seconds
}

// Generate comprehensive PRD-compliant metadata
function generatePRDCompliantMetadata(websiteData: any, qlooResponse: QlooResponse, usedRealAPI: boolean) {
  return {
    // Input analysis
    inputAnalysis: {
      themes: websiteData.themes?.length || 0,
      hints: websiteData.hints?.length || 0,
      socialPlatforms: websiteData.socialLinks?.length || 0,
      hasMetadata: !!(websiteData.title || websiteData.description),
      audienceScope: websiteData.audienceLocation || 'Unknown'
    },
    
    // PRD compliance metrics
    prdCompliance: {
      qlooIntegration: usedRealAPI ? 'Active' : 'Fallback',
      websiteInsightsWeight: usedRealAPI ? '10%' : '100%',
      algorithmVersion: 'PRD-v1.0',
      scoringComponents: [
        'Qloo Affinity (45%)',
        'Community Engagement (25%)', 
        'Brand Collaboration (15%)',
        'Budget Alignment (10%)',
        'Creator Collaboration (5%)'
      ]
    },
    
    // Quality metrics
    qualityMetrics: {
      confidenceLevel: qlooResponse.confidence > 0.8 ? 'High' : 
                      qlooResponse.confidence > 0.6 ? 'Medium' : 'Low',
      dataRichness: calculateDataRichness(websiteData),
      profileCompleteness: calculateProfileCompleteness(websiteData),
      recommendationDiversity: calculateRecommendationDiversity(qlooResponse.recommendations)
    },
    
    // Processing details
    processing: {
      timestamp: new Date().toISOString(),
      processingMethod: qlooResponse.processingTime,
      apiSource: usedRealAPI ? 'qloo-api-enhanced' : 'prd-compliant-system',
      version: '2.0.0',
      features: ['dynamic-profiling', 'prd-scoring', 'creator-optimization']
    }
  };
}

// Calculate data richness score
function calculateDataRichness(websiteData: any): string {
  let score = 0;
  if ((websiteData.themes?.length || 0) >= 3) score += 25;
  if ((websiteData.hints?.length || 0) >= 2) score += 20;
  if ((websiteData.socialLinks?.length || 0) >= 1) score += 20;
  if (websiteData.title && websiteData.title.length > 10) score += 15;
  if (websiteData.description && websiteData.description.length > 50) score += 20;
  
  return score >= 80 ? 'Rich' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Basic';
}

// Calculate profile completeness
function calculateProfileCompleteness(websiteData: any): string {
  const fields = ['themes', 'hints', 'contentType', 'socialLinks', 'title', 'description'];
  const completedFields = fields.filter(field => {
    const value = websiteData[field];
    return value && (Array.isArray(value) ? value.length > 0 : value.length > 0);
  }).length;
  
  const percentage = (completedFields / fields.length) * 100;
  return percentage >= 90 ? 'Complete' : percentage >= 70 ? 'Good' : percentage >= 50 ? 'Partial' : 'Basic';
}

// Calculate recommendation diversity
function calculateRecommendationDiversity(recommendations: string[]): string {
  if (!recommendations || recommendations.length === 0) return 'None';
  
  const continents = new Set();
  const types = new Set();
  
  recommendations.forEach(rec => {
    // Basic continent detection
    if (rec.includes('Japan') || rec.includes('Korea') || rec.includes('Singapore')) continents.add('Asia');
    else if (rec.includes('Europe') || rec.includes('France') || rec.includes('Italy') || rec.includes('Germany')) continents.add('Europe');
    else if (rec.includes('USA') || rec.includes('Canada') || rec.includes('America')) continents.add('North America');
    else if (rec.includes('Australia') || rec.includes('New Zealand')) continents.add('Oceania');
    else if (rec.includes('Africa') || rec.includes('Morocco')) continents.add('Africa');
    else if (rec.includes('Brazil') || rec.includes('Peru') || rec.includes('Chile')) continents.add('South America');
    
    // Basic type detection
    if (rec.includes('Tokyo') || rec.includes('New York') || rec.includes('London')) types.add('Urban');
    else if (rec.includes('Costa Rica') || rec.includes('Iceland') || rec.includes('Nepal')) types.add('Adventure');
    else if (rec.includes('Dubai') || rec.includes('Monaco') || rec.includes('Maldives')) types.add('Luxury');
  });
  
  const diversityScore = continents.size + types.size;
  return diversityScore >= 6 ? 'High' : diversityScore >= 4 ? 'Good' : diversityScore >= 2 ? 'Moderate' : 'Low';
}
