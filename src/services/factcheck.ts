// Fact-checking Service using Wikipedia and Wikidata APIs
// Based on PRD requirements for hallucination checking and accuracy assurance

export interface FactCheckResult {
  claim: string;
  verified: boolean;
  confidence: number; // 0-1
  sources: {
    title: string;
    url: string;
    snippet: string;
    relevanceScore: number;
  }[];
  contradictions?: string[];
  supportingEvidence?: string[];
}

export interface LocationFactCheck {
  destination: string;
  facts: {
    location: FactCheckResult;
    climate: FactCheckResult;
    attractions: FactCheckResult;
    safety: FactCheckResult;
    currency: FactCheckResult;
    language: FactCheckResult;
  };
  overallConfidence: number;
}

class FactCheckService {
  private wikipediaBaseUrl: string;
  private wikidataBaseUrl: string;

  constructor() {
    this.wikipediaBaseUrl = 'https://en.wikipedia.org/api/rest_v1';
    this.wikidataBaseUrl = 'https://www.wikidata.org/w/api.php';
  }

  async verifyDestinationFacts(
    destination: string,
    claims: {
      location?: string;
      climate?: string;
      attractions?: string[];
      safety?: string;
      currency?: string;
      language?: string;
    }
  ): Promise<LocationFactCheck> {
    try {
      const factChecks = await Promise.all([
        this.verifyLocationClaim(destination, claims.location),
        this.verifyClimateClaim(destination, claims.climate),
        this.verifyAttractionsClaim(destination, claims.attractions),
        this.verifySafetyClaim(destination, claims.safety),
        this.verifyCurrencyClaim(destination, claims.currency),
        this.verifyLanguageClaim(destination, claims.language)
      ]);

      const [location, climate, attractions, safety, currency, language] = factChecks;
      
      const overallConfidence = this.calculateOverallConfidence([
        location, climate, attractions, safety, currency, language
      ]);

      return {
        destination,
        facts: {
          location,
          climate,
          attractions,
          safety,
          currency,
          language
        },
        overallConfidence
      };
    } catch (error) {
      console.error('Error verifying destination facts:', error);
      return this.getFallbackFactCheck(destination, claims);
    }
  }

  private async verifyLocationClaim(destination: string, claim?: string): Promise<FactCheckResult> {
    if (!claim) {
      return {
        claim: 'No location claim to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    try {
      // Search Wikipedia for the destination
      const searchResults = await this.searchWikipedia(destination);
      
      if (searchResults.length === 0) {
        return {
          claim,
          verified: false,
          confidence: 0.2,
          sources: []
        };
      }

      // Get the first result's content
      const pageContent = await this.getWikipediaPageContent(searchResults[0].title);
      
      const relevanceScore = this.calculateRelevanceScore(claim, pageContent.extract);
      
      return {
        claim,
        verified: relevanceScore > 0.6,
        confidence: relevanceScore,
        sources: [{
          title: searchResults[0].title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchResults[0].title)}`,
          snippet: pageContent.extract.substring(0, 200) + '...',
          relevanceScore
        }]
      };
    } catch (error) {
      console.error('Error verifying location claim:', error);
      return {
        claim,
        verified: false,
        confidence: 0.1,
        sources: []
      };
    }
  }

  private async verifyClimateClaim(destination: string, claim?: string): Promise<FactCheckResult> {
    if (!claim) {
      return {
        claim: 'No climate claim to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    try {
      const searchQuery = `${destination} climate weather`;
      const searchResults = await this.searchWikipedia(searchQuery);
      
      const sources = [];
      let overallRelevance = 0;

      for (const result of searchResults.slice(0, 3)) {
        const pageContent = await this.getWikipediaPageContent(result.title);
        const relevanceScore = this.calculateClimateRelevance(claim, pageContent.extract);
        
        if (relevanceScore > 0.3) {
          sources.push({
            title: result.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
            snippet: this.extractClimateInfo(pageContent.extract),
            relevanceScore
          });
          overallRelevance = Math.max(overallRelevance, relevanceScore);
        }
      }

      return {
        claim,
        verified: overallRelevance > 0.5,
        confidence: overallRelevance,
        sources
      };
    } catch (error) {
      console.error('Error verifying climate claim:', error);
      return {
        claim,
        verified: false,
        confidence: 0.1,
        sources: []
      };
    }
  }

  private async verifyAttractionsClaim(destination: string, claims?: string[]): Promise<FactCheckResult> {
    if (!claims || claims.length === 0) {
      return {
        claim: 'No attractions to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    try {
      const claimText = claims.join(', ');
      const searchQuery = `${destination} attractions tourism landmarks`;
      const searchResults = await this.searchWikipedia(searchQuery);
      
      const sources = [];
      let verifiedCount = 0;

      for (const result of searchResults.slice(0, 3)) {
        const pageContent = await this.getWikipediaPageContent(result.title);
        const relevanceScore = this.calculateAttractionsRelevance(claims, pageContent.extract);
        
        if (relevanceScore > 0.4) {
          sources.push({
            title: result.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
            snippet: this.extractAttractionsInfo(pageContent.extract),
            relevanceScore
          });
          
          if (relevanceScore > 0.6) verifiedCount++;
        }
      }

      const confidence = sources.length > 0 ? verifiedCount / claims.length : 0.1;

      return {
        claim: claimText,
        verified: confidence > 0.5,
        confidence,
        sources
      };
    } catch (error) {
      console.error('Error verifying attractions claim:', error);
      return {
        claim: claims.join(', '),
        verified: false,
        confidence: 0.1,
        sources: []
      };
    }
  }

  private async verifySafetyClaim(destination: string, claim?: string): Promise<FactCheckResult> {
    if (!claim) {
      return {
        claim: 'No safety claim to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    // Safety information is more complex and may require government sources
    // For now, provide a basic Wikipedia check
    return this.basicFactCheck(destination + ' safety travel', claim);
  }

  private async verifyCurrencyClaim(destination: string, claim?: string): Promise<FactCheckResult> {
    if (!claim) {
      return {
        claim: 'No currency claim to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    return this.basicFactCheck(destination + ' currency', claim);
  }

  private async verifyLanguageClaim(destination: string, claim?: string): Promise<FactCheckResult> {
    if (!claim) {
      return {
        claim: 'No language claim to verify',
        verified: true,
        confidence: 0.5,
        sources: []
      };
    }

    return this.basicFactCheck(destination + ' language', claim);
  }

  private async basicFactCheck(searchQuery: string, claim: string): Promise<FactCheckResult> {
    try {
      const searchResults = await this.searchWikipedia(searchQuery);
      
      if (searchResults.length === 0) {
        return {
          claim,
          verified: false,
          confidence: 0.2,
          sources: []
        };
      }

      const pageContent = await this.getWikipediaPageContent(searchResults[0].title);
      const relevanceScore = this.calculateRelevanceScore(claim, pageContent.extract);
      
      return {
        claim,
        verified: relevanceScore > 0.6,
        confidence: relevanceScore,
        sources: [{
          title: searchResults[0].title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchResults[0].title)}`,
          snippet: pageContent.extract.substring(0, 200) + '...',
          relevanceScore
        }]
      };
    } catch (error) {
      console.error('Error in basic fact check:', error);
      return {
        claim,
        verified: false,
        confidence: 0.1,
        sources: []
      };
    }
  }

  private async searchWikipedia(query: string): Promise<Array<{ title: string; snippet: string }>> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          origin: '*',
          srlimit: '5'
        })
      );

      if (!response.ok) {
        throw new Error(`Wikipedia search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.query?.search || [];
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      return [];
    }
  }

  private async getWikipediaPageContent(title: string): Promise<{ extract: string; url: string }> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: title,
          prop: 'extracts',
          exintro: 'true',
          explaintext: 'true',
          exsectionformat: 'plain',
          origin: '*'
        })
      );

      if (!response.ok) {
        throw new Error(`Wikipedia content fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      
      if (pageId === '-1') {
        throw new Error('Page not found');
      }

      return {
        extract: pages[pageId]?.extract || '',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
      };
    } catch (error) {
      console.error('Error getting Wikipedia content:', error);
      return { extract: '', url: '' };
    }
  }

  private calculateRelevanceScore(claim: string, content: string): number {
    const claimWords = claim.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    const matchedWords = claimWords.filter(word => 
      word.length > 2 && contentLower.includes(word)
    );
    
    return matchedWords.length / Math.max(claimWords.length, 1);
  }

  private calculateClimateRelevance(claim: string, content: string): number {
    const climateKeywords = ['climate', 'weather', 'temperature', 'rainfall', 'season', 'tropical', 'temperate', 'humid', 'dry', 'monsoon'];
    const claimLower = claim.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let relevanceScore = this.calculateRelevanceScore(claim, content);
    
    // Boost score if climate-related keywords are found
    const climateMatches = climateKeywords.filter(keyword => 
      claimLower.includes(keyword) && contentLower.includes(keyword)
    );
    
    relevanceScore += (climateMatches.length * 0.1);
    
    return Math.min(relevanceScore, 1);
  }

  private calculateAttractionsRelevance(claims: string[], content: string): number {
    const contentLower = content.toLowerCase();
    let totalRelevance = 0;
    
    claims.forEach(claim => {
      totalRelevance += this.calculateRelevanceScore(claim, content);
    });
    
    // Boost if tourism-related keywords are found
    const tourismKeywords = ['attraction', 'landmark', 'temple', 'museum', 'park', 'beach', 'mountain', 'historic'];
    const tourismMatches = tourismKeywords.filter(keyword => contentLower.includes(keyword));
    
    totalRelevance += (tourismMatches.length * 0.05);
    
    return Math.min(totalRelevance / claims.length, 1);
  }

  private extractClimateInfo(content: string): string {
    const sentences = content.split('.');
    const climateSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('climate') || lower.includes('weather') || lower.includes('temperature');
    });
    
    return climateSentences.slice(0, 2).join('.') + '.' || content.substring(0, 150) + '...';
  }

  private extractAttractionsInfo(content: string): string {
    const sentences = content.split('.');
    const attractionSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('attraction') || lower.includes('landmark') || 
             lower.includes('temple') || lower.includes('museum') ||
             lower.includes('tourism') || lower.includes('visit');
    });
    
    return attractionSentences.slice(0, 2).join('.') + '.' || content.substring(0, 150) + '...';
  }

  private calculateOverallConfidence(factChecks: FactCheckResult[]): number {
    const confidences = factChecks.map(fc => fc.confidence);
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    
    // Lower confidence if any critical facts have very low confidence
    const criticalFactsLowConfidence = factChecks.some(fc => fc.confidence < 0.3);
    
    return criticalFactsLowConfidence ? Math.min(average, 0.6) : average;
  }

  private getFallbackFactCheck(destination: string, claims: Record<string, unknown>): LocationFactCheck {
    return {
      destination,
      facts: {
        location: {
          claim: (claims.location as string) || 'No location claim',
          verified: false,
          confidence: 0.5,
          sources: []
        },
        climate: {
          claim: (claims.climate as string) || 'No climate claim',
          verified: false,
          confidence: 0.5,
          sources: []
        },
        attractions: {
          claim: (claims.attractions as string[])?.join(', ') || 'No attractions claim',
          verified: false,
          confidence: 0.5,
          sources: []
        },
        safety: {
          claim: (claims.safety as string) || 'No safety claim',
          verified: false,
          confidence: 0.5,
          sources: []
        },
        currency: {
          claim: (claims.currency as string) || 'No currency claim',
          verified: false,
          confidence: 0.5,
          sources: []
        },
        language: {
          claim: (claims.language as string) || 'No language claim',
          verified: false,
          confidence: 0.5,
          sources: []
        }
      },
      overallConfidence: 0.5
    };
  }
}

export const factCheckService = new FactCheckService();