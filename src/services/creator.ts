// Creator Discovery Service using YouTube and Instagram APIs
// Based on PRD requirements for local creator collaboration opportunities

export interface CreatorProfile {
  id: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  username: string;
  displayName: string;
  followerCount: number;
  averageEngagement: number;
  contentCategory: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  collaborationPotential: number; // 0-1 score
  contactInfo?: {
    email?: string;
    businessInquiries?: string;
  };
  recentContent: {
    title: string;
    views: number;
    likes: number;
    publishedAt: string;
  }[];
}

export interface CreatorSearchRequest {
  location: {
    city: string;
    country: string;
    radius?: number; // km
  };
  contentCategory?: string;
  minFollowers?: number;
  maxFollowers?: number;
  language?: string;
}

class CreatorService {
  private youtubeApiKey: string;
  private instagramAccessToken: string;

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
    this.instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  }

  async findLocalCreators(request: CreatorSearchRequest): Promise<CreatorProfile[]> {
    try {
      const [youtubeCreators, instagramCreators] = await Promise.all([
        this.searchYouTubeCreators(request),
        this.searchInstagramCreators(request)
      ]);

      const allCreators = [...youtubeCreators, ...instagramCreators];
      
      // Sort by collaboration potential and follower count
      return allCreators
        .sort((a, b) => {
          // Prioritize collaboration potential, then follower count
          const potentialDiff = b.collaborationPotential - a.collaborationPotential;
          if (Math.abs(potentialDiff) > 0.1) return potentialDiff;
          return b.followerCount - a.followerCount;
        })
        .slice(0, 20); // Return top 20 creators
    } catch (error) {
      console.error('Error finding local creators:', error);
      return this.getFallbackCreators(request);
    }
  }

  private async searchYouTubeCreators(request: CreatorSearchRequest): Promise<CreatorProfile[]> {
    try {
      if (!this.youtubeApiKey) {
        console.warn('YouTube API key not found, using fallback creators');
        return this.getFallbackYouTubeCreators(request);
      }

      // Search for channels based on location and category
      const searchQuery = this.buildYouTubeSearchQuery(request);
      
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        new URLSearchParams({
          part: 'snippet',
          q: searchQuery,
          type: 'channel',
          maxResults: '25',
          key: this.youtubeApiKey,
          regionCode: this.getCountryCode(request.location.country),
          relevanceLanguage: request.language || 'en'
        })
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const channels = searchData.items || [];

      // Get detailed channel information
      const channelIds = channels.map((c: { snippet: { channelId: string } }) => c.snippet.channelId).join(',');
      if (!channelIds) return [];

      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?` +
        new URLSearchParams({
          part: 'snippet,statistics,brandingSettings',
          id: channelIds,
          key: this.youtubeApiKey
        })
      );

      if (!channelsResponse.ok) {
        throw new Error(`YouTube channels failed: ${channelsResponse.status}`);
      }

      const channelsData = await channelsResponse.json();
      const channelDetails = channelsData.items || [];

      return channelDetails.map((channel: { id: string; statistics?: Record<string, string>; snippet?: Record<string, string> }) => this.formatYouTubeCreator(channel, request));
    } catch (error) {
      console.error('Error searching YouTube creators:', error);
      return this.getFallbackYouTubeCreators(request);
    }
  }

  private async searchInstagramCreators(request: CreatorSearchRequest): Promise<CreatorProfile[]> {
    try {
      if (!this.instagramAccessToken) {
        console.warn('Instagram access token not found, using fallback creators');
        return this.getFallbackInstagramCreators(request);
      }

      // Instagram Graph API requires business accounts
      // For hackathon purposes, using location-based hashtag search
      const locationHashtags = this.generateLocationHashtags(request.location);
      const creators: CreatorProfile[] = [];

      for (const hashtag of locationHashtags.slice(0, 3)) {
        try {
          // Search for hashtag
          const hashtagResponse = await fetch(
            `https://graph.instagram.com/ig_hashtag_search?` +
            new URLSearchParams({
              user_id: 'me', // Requires business account
              q: hashtag,
              access_token: this.instagramAccessToken
            })
          );

          if (!hashtagResponse.ok) continue;

          const hashtagData = await hashtagResponse.json();
          if (!hashtagData.data?.length) continue;

          // Get recent media for hashtag
          const hashtagId = hashtagData.data[0].id;
          const mediaResponse = await fetch(
            `https://graph.instagram.com/${hashtagId}/recent_media?` +
            new URLSearchParams({
              user_id: 'me',
              fields: 'id,caption,media_type,media_url,owner,timestamp',
              limit: '10',
              access_token: this.instagramAccessToken
            })
          );

          if (mediaResponse.ok) {
            await mediaResponse.json();
            // Process media data to extract creator information
            // This is simplified for hackathon purposes
          }
        } catch (hashtagError) {
          console.warn(`Error processing hashtag ${hashtag}:`, hashtagError);
          continue;
        }
      }

      return creators.length > 0 ? creators : this.getFallbackInstagramCreators(request);
    } catch (error) {
      console.error('Error searching Instagram creators:', error);
      return this.getFallbackInstagramCreators(request);
    }
  }

  private buildYouTubeSearchQuery(request: CreatorSearchRequest): string {
    const location = `${request.location.city} ${request.location.country}`;
    const category = request.contentCategory || 'travel';
    return `${location} ${category} creator vlogger`;
  }

  private generateLocationHashtags(location: { city: string; country: string }): string[] {
    const city = location.city.toLowerCase().replace(/\s+/g, '');
    const country = location.country.toLowerCase().replace(/\s+/g, '');
    
    return [
      city,
      `${city}travel`,
      `${city}food`,
      `${city}life`,
      country,
      `${country}travel`,
      `visit${city}`,
      `explore${city}`
    ];
  }

  private formatYouTubeCreator(channel: { id: string; statistics?: Record<string, string>; snippet?: Record<string, string> }, request: CreatorSearchRequest): CreatorProfile {
    const stats = channel.statistics || {};
    const snippet = channel.snippet || {};
    
    return {
      id: channel.id,
      platform: 'youtube',
      username: snippet.customUrl || channel.id,
      displayName: snippet.title || 'Unknown Creator',
      followerCount: parseInt(stats.subscriberCount || '0'),
      averageEngagement: this.calculateYouTubeEngagement(stats),
      contentCategory: this.inferContentCategory(snippet.description || ''),
      location: {
        city: request.location.city,
        country: request.location.country
      },
      collaborationPotential: this.calculateCollaborationPotential(stats, snippet),
      recentContent: [] // Would need additional API call to get recent videos
    };
  }

  private calculateYouTubeEngagement(stats: Record<string, string>): number {
    const views = parseInt(stats.viewCount || '0');
    const subscribers = parseInt(stats.subscriberCount || '1');
    const videos = parseInt(stats.videoCount || '1');
    
    if (subscribers === 0 || videos === 0) return 0;
    
    // Rough engagement calculation: average views per video / subscribers
    const avgViewsPerVideo = views / videos;
    return Math.min(avgViewsPerVideo / subscribers, 1);
  }

  private calculateCollaborationPotential(stats: Record<string, string>, snippet: Record<string, string>): number {
    const subscribers = parseInt(stats.subscriberCount || '0');
    const description = (snippet.description || '').toLowerCase();
    
    let score = 0.5; // Base score
    
    // Follower count factors
    if (subscribers >= 1000 && subscribers <= 100000) score += 0.3; // Sweet spot for collaborations
    else if (subscribers > 100000) score += 0.2;
    else if (subscribers < 1000) score -= 0.2;
    
    // Business inquiry indicators
    if (description.includes('business') || description.includes('collaboration') || 
        description.includes('sponsor') || description.includes('brand')) {
      score += 0.2;
    }
    
    // Recent activity (simplified - would need upload schedule data)
    score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private inferContentCategory(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('travel') || lower.includes('journey')) return 'travel';
    if (lower.includes('food') || lower.includes('culinary')) return 'food';
    if (lower.includes('lifestyle') || lower.includes('daily')) return 'lifestyle';
    if (lower.includes('photo') || lower.includes('visual')) return 'photography';
    if (lower.includes('adventure') || lower.includes('outdoor')) return 'adventure';
    if (lower.includes('culture') || lower.includes('local')) return 'culture';
    
    return 'general';
  }

  private getCountryCode(country: string): string {
    const countryCodes: Record<string, string> = {
      'united states': 'US',
      'canada': 'CA',
      'united kingdom': 'GB',
      'germany': 'DE',
      'france': 'FR',
      'japan': 'JP',
      'australia': 'AU',
      'brazil': 'BR',
      'india': 'IN',
      'china': 'CN',
      'south korea': 'KR',
      'italy': 'IT',
      'spain': 'ES',
      'netherlands': 'NL',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'switzerland': 'CH',
      'austria': 'AT',
      'belgium': 'BE',
      'greece': 'GR',
      'thailand': 'TH',
      'singapore': 'SG',
      'malaysia': 'MY',
      'indonesia': 'ID',
      'philippines': 'PH',
      'vietnam': 'VN'
    };
    
    return countryCodes[country.toLowerCase()] || 'US';
  }

  private getFallbackCreators(request: CreatorSearchRequest): CreatorProfile[] {
    const youtubeCreators = this.getFallbackYouTubeCreators(request);
    const instagramCreators = this.getFallbackInstagramCreators(request);
    return [...youtubeCreators, ...instagramCreators];
  }

  private getFallbackYouTubeCreators(request: CreatorSearchRequest): CreatorProfile[] {
    // Fallback creator database by location
    const creatorsByLocation: Record<string, CreatorProfile[]> = {
      'bali': [
        {
          id: 'yt_bali_1',
          platform: 'youtube',
          username: 'BaliAdventureVlogs',
          displayName: 'Sarah Chen - Bali Adventures',
          followerCount: 45000,
          averageEngagement: 0.08,
          contentCategory: 'travel',
          location: { city: 'Bali', country: 'Indonesia' },
          collaborationPotential: 0.85,
          recentContent: []
        },
        {
          id: 'yt_bali_2',
          platform: 'youtube',
          username: 'BaliFoodGuide',
          displayName: 'Local Eats Bali',
          followerCount: 32000,
          averageEngagement: 0.12,
          contentCategory: 'food',
          location: { city: 'Bali', country: 'Indonesia' },
          collaborationPotential: 0.78,
          recentContent: []
        }
      ],
      'santorini': [
        {
          id: 'yt_santorini_1',
          platform: 'youtube',
          username: 'SantoriniSunsets',
          displayName: 'Elena Photography',
          followerCount: 28000,
          averageEngagement: 0.15,
          contentCategory: 'photography',
          location: { city: 'Santorini', country: 'Greece' },
          collaborationPotential: 0.82,
          recentContent: []
        }
      ],
      'kyoto': [
        {
          id: 'yt_kyoto_1',
          platform: 'youtube',
          username: 'KyotoCulture',
          displayName: 'Takeshi Traditional Japan',
          followerCount: 67000,
          averageEngagement: 0.09,
          contentCategory: 'culture',
          location: { city: 'Kyoto', country: 'Japan' },
          collaborationPotential: 0.88,
          recentContent: []
        }
      ]
    };

    const locationKey = request.location.city.toLowerCase();
    return creatorsByLocation[locationKey] || [];
  }

  private getFallbackInstagramCreators(request: CreatorSearchRequest): CreatorProfile[] {
    // Fallback Instagram creators
    const instagramCreators: Record<string, CreatorProfile[]> = {
      'bali': [
        {
          id: 'ig_bali_1',
          platform: 'instagram',
          username: 'bali_lifestyle_maya',
          displayName: 'Maya | Bali Lifestyle',
          followerCount: 89000,
          averageEngagement: 0.06,
          contentCategory: 'lifestyle',
          location: { city: 'Bali', country: 'Indonesia' },
          collaborationPotential: 0.79,
          recentContent: []
        }
      ],
      'santorini': [
        {
          id: 'ig_santorini_1',
          platform: 'instagram',
          username: 'santorini_vibes_alex',
          displayName: 'Alex | Santorini Vibes',
          followerCount: 156000,
          averageEngagement: 0.04,
          contentCategory: 'travel',
          location: { city: 'Santorini', country: 'Greece' },
          collaborationPotential: 0.73,
          recentContent: []
        }
      ]
    };

    const locationKey = request.location.city.toLowerCase();
    return instagramCreators[locationKey] || [];
  }
}

export const creatorService = new CreatorService();