import { NextRequest, NextResponse } from 'next/server';

interface FactCheckRequest {
  location: string;
  claims: string[];
  context?: string;
}

interface FactCheckResult {
  claim: string;
  verified: boolean;
  confidence: number;
  sources: string[];
  evidence: string;
  wikidata?: any;
  wikipedia?: any;
}

interface FactCheckResponse {
  location: string;
  overallVerified: boolean;
  confidence: number;
  results: FactCheckResult[];
  sources: string[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { location, claims, context }: FactCheckRequest = await request.json();

    if (!location || !claims || claims.length === 0) {
      return NextResponse.json(
        { error: 'Location and claims are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting fact-check for:', { location, claims: claims.length });

    // Process each claim
    const results: FactCheckResult[] = [];
    const allSources: Set<string> = new Set();

    for (const claim of claims) {
      try {
        const result = await factCheckClaim(location, claim, context);
        results.push(result);
        result.sources.forEach(source => allSources.add(source));
      } catch (error) {
        console.error('❌ Error fact-checking claim:', claim, error);
        results.push({
          claim,
          verified: false,
          confidence: 0.1,
          sources: [],
          evidence: 'Unable to verify due to technical error'
        });
      }
    }

    // Calculate overall confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const overallVerified = avgConfidence >= 0.8;

    const response: FactCheckResponse = {
      location,
      overallVerified,
      confidence: avgConfidence,
      results,
      sources: Array.from(allSources),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Fact-check complete: ${results.length} claims, confidence: ${avgConfidence.toFixed(2)}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Fact-check API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform fact-check' },
      { status: 500 }
    );
  }
}

async function factCheckClaim(location: string, claim: string, context?: string): Promise<FactCheckResult> {
  console.log(`🔍 Fact-checking: "${claim}" for ${location}`);

  try {
    // 1. Search Wikidata for the location
    const locationData = await searchWikidata(location);
    
    // 2. Get Wikipedia content for the location
    const wikipediaContent = await getWikipediaContent(location);
    
    // 3. Verify the claim against the data
    const verification = await verifyClaim(claim, locationData, wikipediaContent, context);
    
    return {
      claim,
      verified: verification.verified,
      confidence: verification.confidence,
      sources: verification.sources,
      evidence: verification.evidence,
      wikidata: locationData,
      wikipedia: wikipediaContent?.extract
    };

  } catch (error) {
    console.error('❌ Error in factCheckClaim:', error);
    return {
      claim,
      verified: false,
      confidence: 0.1,
      sources: [],
      evidence: 'Unable to verify due to data retrieval error'
    };
  }
}

async function searchWikidata(location: string): Promise<any> {
  try {
    // Search for the location entity in Wikidata
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(location)}&language=en&format=json&limit=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.search && data.search.length > 0) {
      const entityId = data.search[0].id;
      
      // Get detailed entity information
      const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json&languages=en`;
      const entityResponse = await fetch(entityUrl);
      const entityData = await entityResponse.json();
      
      return entityData.entities[entityId];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Wikidata search error:', error);
    return null;
  }
}

async function getWikipediaContent(location: string): Promise<any> {
  try {
    // Search for Wikipedia page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(location)}&limit=1&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData[1] && searchData[1].length > 0) {
      const pageTitle = searchData[1][0];
      
      // Get page content
      const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro&explaintext&exsectionformat=plain`;
      const contentResponse = await fetch(contentUrl);
      const contentData = await contentResponse.json();
      
      const pages = contentData.query.pages;
      const pageId = Object.keys(pages)[0];
      
      return {
        title: pageTitle,
        extract: pages[pageId].extract,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Wikipedia content error:', error);
    return null;
  }
}

async function verifyClaim(claim: string, wikidataEntity: any, wikipediaContent: any, context?: string): Promise<{
  verified: boolean;
  confidence: number;
  sources: string[];
  evidence: string;
}> {
  const sources: string[] = [];
  let evidence = '';
  let confidence = 0.1;
  let verified = false;

  try {
    // Collect evidence from sources
    if (wikipediaContent) {
      sources.push(wikipediaContent.url);
      evidence += `Wikipedia: ${wikipediaContent.extract?.substring(0, 500)}...`;
    }

    if (wikidataEntity) {
      sources.push(`https://www.wikidata.org/wiki/${wikidataEntity.id}`);
      
      // Extract key facts from Wikidata
      const claims = wikidataEntity.claims || {};
      const labels = wikidataEntity.labels?.en?.value || '';
      const description = wikidataEntity.descriptions?.en?.value || '';
      
      evidence += ` Wikidata: ${labels} - ${description}`;
    }

    // Simple keyword-based verification
    const claimLower = claim.toLowerCase();
    const evidenceLower = evidence.toLowerCase();
    
    // Extract key terms from the claim
    const claimWords = claimLower.split(/\s+/).filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
    
    // Count matches
    let matches = 0;
    for (const word of claimWords) {
      if (evidenceLower.includes(word)) {
        matches++;
      }
    }
    
    // Calculate confidence based on matches
    if (claimWords.length > 0) {
      const matchRatio = matches / claimWords.length;
      confidence = Math.min(matchRatio * 0.9, 0.9); // Cap at 0.9 for simple verification
      
      if (matchRatio >= 0.6) {
        verified = true;
        confidence = Math.max(confidence, 0.7);
      } else if (matchRatio >= 0.3) {
        confidence = Math.max(confidence, 0.5);
      }
    }
    
    // Boost confidence if multiple sources agree
    if (sources.length > 1 && verified) {
      confidence = Math.min(confidence + 0.1, 0.95);
    }
    
  } catch (error) {
    console.error('❌ Claim verification error:', error);
  }

  return {
    verified,
    confidence,
    sources,
    evidence: evidence || 'No evidence found'
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  
  if (!location) {
    return NextResponse.json(
      { error: 'Location parameter is required' },
      { status: 400 }
    );
  }

  // Simple test endpoint - fact-check basic location info
  const basicClaims = [
    `${location} is a real place`,
    `${location} exists`,
    `${location} is a destination`
  ];

  const factCheckRequest: FactCheckRequest = {
    location,
    claims: basicClaims,
    context: 'Basic location verification'
  };

  // Use POST logic
  const postRequest = new Request('http://localhost/api/fact-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(factCheckRequest)
  });

  return POST(postRequest as any);
}
