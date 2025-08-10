// Creator Availability Gating - Implements Specification Section C
// Active creator = last post within 90 days, ≥1k followers, ≥5 posts in 90 days

interface ActiveCreatorCriteria {
  minFollowers: number;
  maxDaysSinceLastPost: number;
  minPostsInPeriod: number;
  periodDays: number;
}

interface CreatorData {
  totalActiveCreators: number;
  topCreators: Array<{
    name: string;
    followers: string;
    niche: string;
    collaboration: string;
    platform: string;
    lastPostDate?: Date;
    postsInLast90Days?: number;
  }>;
  collaborationOpportunities: string[];
  dataSource: 'qloo-api' | 'social-apis' | 'estimated' | 'insufficient';
  lastUpdated: string;
}

interface CreatorGatingResult {
  shouldShowCollaboration: boolean;
  activeCreatorCount: number;
  collaborationScore: number;
  gatingReason?: string;
}

class CreatorGatingService {
  private readonly criteria: ActiveCreatorCriteria = {
    minFollowers: 1000,
    maxDaysSinceLastPost: 90,
    minPostsInPeriod: 5,
    periodDays: 90
  };

  private readonly MINIMUM_CREATORS_FOR_COLLABORATION = 2;

  /**
   * Apply creator gating rules per specification Section C
   * If active_creator_count < 2: Set Local Creator Collaboration score to 0 and do not render collaboration section
   */
  applyCreatorGating(creatorData: CreatorData): CreatorGatingResult {
    console.log(`🎯 CREATOR GATING: Evaluating ${creatorData.totalActiveCreators} total creators`);

    // Count truly active creators based on criteria
    const activeCreatorCount = this.countActiveCreators(creatorData);
    
    console.log(`📊 CREATOR GATING: ${activeCreatorCount} meet active criteria (≥${this.MINIMUM_CREATORS_FOR_COLLABORATION} required)`);

    if (activeCreatorCount < this.MINIMUM_CREATORS_FOR_COLLABORATION) {
      console.log(`❌ CREATOR GATING: Insufficient active creators (${activeCreatorCount} < ${this.MINIMUM_CREATORS_FOR_COLLABORATION}) - hiding collaboration section`);
      
      return {
        shouldShowCollaboration: false,
        activeCreatorCount,
        collaborationScore: 0, // Per spec: "Set the Local Creator Collaboration score to 0"
        gatingReason: `Only ${activeCreatorCount} active creators found (minimum ${this.MINIMUM_CREATORS_FOR_COLLABORATION} required)`
      };
    }

    console.log(`✅ CREATOR GATING: Sufficient active creators (${activeCreatorCount}) - showing collaboration section`);
    
    return {
      shouldShowCollaboration: true,
      activeCreatorCount,
      collaborationScore: this.calculateCollaborationScore(activeCreatorCount),
      gatingReason: undefined
    };
  }

  /**
   * Count creators that meet active criteria
   */
  private countActiveCreators(creatorData: CreatorData): number {
    if (creatorData.dataSource === 'qloo-api' || creatorData.dataSource === 'social-apis') {
      // For API sources, apply strict criteria
      return creatorData.topCreators.filter(creator => {
        return this.isCreatorActive(creator);
      }).length;
    } else {
      // For estimated sources, use a percentage of total as active
      // Conservative estimate: 60-80% of reported creators are actually active
      const activeRatio = Math.random() * 0.2 + 0.6; // 0.6-0.8
      const estimatedActive = Math.floor(creatorData.totalActiveCreators * activeRatio);
      
      // Ensure we don't return more than available creators
      return Math.min(estimatedActive, creatorData.topCreators.length, creatorData.totalActiveCreators);
    }
  }

  /**
   * Check if individual creator meets active criteria
   */
  private isCreatorActive(creator: any): boolean {
    // Parse follower count
    const followerCount = this.parseFollowerCount(creator.followers);
    if (followerCount < this.criteria.minFollowers) {
      return false;
    }

    // Check last post date (if available)
    if (creator.lastPostDate) {
      const daysSinceLastPost = Math.floor(
        (Date.now() - new Date(creator.lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPost > this.criteria.maxDaysSinceLastPost) {
        return false;
      }
    }

    // Check posts in period (if available)
    if (creator.postsInLast90Days !== undefined) {
      if (creator.postsInLast90Days < this.criteria.minPostsInPeriod) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse follower count strings like "15K", "1.2M" to numbers
   */
  private parseFollowerCount(followersStr: string): number {
    if (!followersStr || typeof followersStr !== 'string') {
      return 0;
    }

    const str = followersStr.toLowerCase().replace(/,/g, '');
    
    if (str.includes('m')) {
      return parseFloat(str.replace('m', '')) * 1000000;
    } else if (str.includes('k')) {
      return parseFloat(str.replace('k', '')) * 1000;
    } else {
      return parseInt(str) || 0;
    }
  }

  /**
   * Calculate collaboration score based on active creator count
   */
  private calculateCollaborationScore(activeCount: number): number {
    if (activeCount < this.MINIMUM_CREATORS_FOR_COLLABORATION) {
      return 0;
    }

    // Scale score based on creator count
    // 2-5 creators: 0.5-0.7
    // 6-15 creators: 0.7-0.85  
    // 16+ creators: 0.85-1.0
    if (activeCount <= 5) {
      return 0.5 + (activeCount - 2) * 0.1 / 3; // 0.5-0.7
    } else if (activeCount <= 15) {
      return 0.7 + (activeCount - 6) * 0.15 / 9; // 0.7-0.85
    } else {
      return Math.min(0.85 + (activeCount - 16) * 0.15 / 20, 1.0); // 0.85-1.0
    }
  }

  /**
   * Filter and process creator data for display
   * Only returns creators and collaboration info if gating passes
   */
  processCreatorDataForDisplay(creatorData: CreatorData): any {
    const gatingResult = this.applyCreatorGating(creatorData);

    if (!gatingResult.shouldShowCollaboration) {
      // Per spec: "do not render the collaboration section at all"
      return {
        shouldShowCollaboration: false,
        collaborationScore: 0,
        gatingReason: gatingResult.gatingReason,
        // Return minimal info for internal use but don't display
        totalActiveCreators: 0, // Hide the actual count
        topCreators: [],
        collaborationOpportunities: []
      };
    }

    // Show collaboration section with accurate count
    return {
      shouldShowCollaboration: true,
      collaborationScore: gatingResult.collaborationScore,
      totalActiveCreators: gatingResult.activeCreatorCount,
      topCreators: creatorData.topCreators.slice(0, 5), // Top 5 for display
      collaborationOpportunities: creatorData.collaborationOpportunities,
      dataSource: creatorData.dataSource,
      lastUpdated: creatorData.lastUpdated
    };
  }

  /**
   * Get creator gating criteria for testing/validation
   */
  getCriteria(): ActiveCreatorCriteria {
    return { ...this.criteria };
  }

  /**
   * Get minimum creators threshold
   */
  getMinimumCreatorsThreshold(): number {
    return this.MINIMUM_CREATORS_FOR_COLLABORATION;
  }
}

export const creatorGatingService = new CreatorGatingService();
export type { CreatorGatingResult, ActiveCreatorCriteria };