// Dynamic Scoring Algorithm Service
// Based on PRD formula: Total_Score = (0.45 × Qloo Affinity) + (0.25 × Community Engagement) + (0.15 × Brand Collaboration Fit) + (0.10 × Budget Alignment) + (0.05 × Local Creator Collaboration Potential)

import { BudgetBreakdown } from './budget';
import { CreatorProfile } from './creator';

export interface ScoringInput {
  destination: {
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  qlooAffinity: number; // 0-1 from Qloo API
  communityEngagement: {
    averageEngagement: number; // Platform engagement rate
    contentViews: number;
    socialMediaReach: number;
    platformActivity: number; // 0-1
  };
  brandCollaboration: {
    availablePartnerships: number;
    brandAlignmentScore: number; // 0-1
    marketingBudget: number; // Estimated market size
    seasonalDemand: number; // 0-1
  };
  budgetAlignment: {
    userBudget: number;
    destinationCost: BudgetBreakdown;
    costEfficiency: number; // 0-1
  };
  creatorCollaboration: {
    localCreators: CreatorProfile[];
    collaborationPotential: number; // 0-1
    networkSize: number;
  };
  userPreferences?: {
    travelStyle: 'budget' | 'mid-range' | 'luxury';
    contentType: string;
    audienceLocation: string;
  };
}

export interface ScoringResult {
  totalScore: number; // 0-100
  breakdown: {
    qlooAffinity: {
      score: number;
      weight: number;
      contribution: number;
    };
    communityEngagement: {
      score: number;
      weight: number;
      contribution: number;
    };
    brandCollaborationFit: {
      score: number;
      weight: number;
      contribution: number;
    };
    budgetAlignment: {
      score: number;
      weight: number;
      contribution: number;
    };
    creatorCollaboration: {
      score: number;
      weight: number;
      contribution: number;
    };
  };
  confidence: number; // 0-1
  recommendations?: string[];
}

class ScoringService {
  private readonly weights = {
    qlooAffinity: 0.45,
    communityEngagement: 0.25,
    brandCollaborationFit: 0.15,
    budgetAlignment: 0.10,
    creatorCollaboration: 0.05
  };

  calculateDestinationScore(input: ScoringInput): ScoringResult {
    try {
      // Calculate individual component scores (0-1)
      const qlooScore = this.calculateQlooAffinityScore(input);
      const engagementScore = this.calculateCommunityEngagementScore(input);
      const brandScore = this.calculateBrandCollaborationScore(input);
      const budgetScore = this.calculateBudgetAlignmentScore(input);
      const creatorScore = this.calculateCreatorCollaborationScore(input);

      // Apply weights and calculate total score
      const totalScore = (
        qlooScore * this.weights.qlooAffinity +
        engagementScore * this.weights.communityEngagement +
        brandScore * this.weights.brandCollaborationFit +
        budgetScore * this.weights.budgetAlignment +
        creatorScore * this.weights.creatorCollaboration
      ) * 100; // Convert to 0-100 scale

      // Calculate confidence based on data availability and quality
      const confidence = this.calculateConfidence(input);

      return {
        totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
        breakdown: {
          qlooAffinity: {
            score: qlooScore,
            weight: this.weights.qlooAffinity,
            contribution: qlooScore * this.weights.qlooAffinity * 100
          },
          communityEngagement: {
            score: engagementScore,
            weight: this.weights.communityEngagement,
            contribution: engagementScore * this.weights.communityEngagement * 100
          },
          brandCollaborationFit: {
            score: brandScore,
            weight: this.weights.brandCollaborationFit,
            contribution: brandScore * this.weights.brandCollaborationFit * 100
          },
          budgetAlignment: {
            score: budgetScore,
            weight: this.weights.budgetAlignment,
            contribution: budgetScore * this.weights.budgetAlignment * 100
          },
          creatorCollaboration: {
            score: creatorScore,
            weight: this.weights.creatorCollaboration,
            contribution: creatorScore * this.weights.creatorCollaboration * 100
          }
        },
        confidence,
        recommendations: this.generateRecommendations(input, {
          qlooScore,
          engagementScore,
          brandScore,
          budgetScore,
          creatorScore
        })
      };
    } catch (error) {
      console.error('Error calculating destination score:', error);
      return this.getFallbackScore(input);
    }
  }

  private calculateQlooAffinityScore(input: ScoringInput): number {
    // Qloo affinity should already be provided as 0-1 score
    let score = input.qlooAffinity;

    // Boost score based on user preferences alignment
    if (input.userPreferences) {
      const preferencesBoost = this.calculatePreferencesAlignment(input);
      score = Math.min(1, score * (1 + preferencesBoost * 0.2));
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateCommunityEngagementScore(input: ScoringInput): number {
    const engagement = input.communityEngagement;
    
    // Normalize and combine engagement metrics
    const normalizedEngagement = Math.min(1, engagement.averageEngagement / 0.1); // 10% is excellent engagement
    const normalizedViews = Math.min(1, Math.log10(engagement.contentViews + 1) / 6); // Log scale for views
    const normalizedReach = Math.min(1, Math.log10(engagement.socialMediaReach + 1) / 7); // Log scale for reach
    const platformActivity = engagement.platformActivity;

    // Weighted combination
    const score = (
      normalizedEngagement * 0.4 +
      normalizedViews * 0.25 +
      normalizedReach * 0.25 +
      platformActivity * 0.10
    );

    return Math.max(0, Math.min(1, score));
  }

  private calculateBrandCollaborationScore(input: ScoringInput): number {
    const collab = input.brandCollaboration;
    
    // Normalize metrics
    const partnershipScore = Math.min(1, collab.availablePartnerships / 20); // 20+ partnerships is excellent
    const alignmentScore = collab.brandAlignmentScore;
    const budgetScore = Math.min(1, Math.log10(collab.marketingBudget + 1) / 6); // Log scale for budget
    const seasonalScore = collab.seasonalDemand;

    // Weighted combination
    const score = (
      partnershipScore * 0.3 +
      alignmentScore * 0.4 +
      budgetScore * 0.2 +
      seasonalScore * 0.1
    );

    return Math.max(0, Math.min(1, score));
  }

  private calculateBudgetAlignmentScore(input: ScoringInput): number {
    const budget = input.budgetAlignment;
    const userBudget = budget.userBudget;
    const destinationCost = budget.destinationCost.totalEstimate.max;

    // Calculate budget efficiency
    let alignmentScore = 0;
    
    if (userBudget <= 0) {
      // No budget specified, use cost efficiency
      alignmentScore = budget.costEfficiency;
    } else {
      // Calculate how well the destination fits the budget
      const budgetRatio = destinationCost / userBudget;
      
      if (budgetRatio <= 0.8) {
        // Well within budget
        alignmentScore = 1.0;
      } else if (budgetRatio <= 1.0) {
        // Close to budget
        alignmentScore = 0.8;
      } else if (budgetRatio <= 1.2) {
        // Slightly over budget
        alignmentScore = 0.5;
      } else {
        // Significantly over budget
        alignmentScore = Math.max(0, 1 - (budgetRatio - 1.2) * 2);
      }
    }

    // Factor in cost efficiency
    const finalScore = (alignmentScore * 0.7) + (budget.costEfficiency * 0.3);

    return Math.max(0, Math.min(1, finalScore));
  }

  private calculateCreatorCollaborationScore(input: ScoringInput): number {
    const creator = input.creatorCollaboration;
    
    if (creator.localCreators.length === 0) {
      return 0.1; // Minimal score if no creators found
    }

    // Calculate score based on creator quality and quantity
    const avgCollaborationPotential = creator.localCreators.reduce(
      (sum, c) => sum + c.collaborationPotential, 0
    ) / creator.localCreators.length;

    const quantityScore = Math.min(1, creator.localCreators.length / 10); // 10+ creators is excellent
    const qualityScore = avgCollaborationPotential;
    const networkScore = Math.min(1, creator.networkSize / 100000); // 100k+ total network is good
    const potentialScore = creator.collaborationPotential;

    // Weighted combination
    const score = (
      quantityScore * 0.25 +
      qualityScore * 0.35 +
      networkScore * 0.2 +
      potentialScore * 0.2
    );

    return Math.max(0, Math.min(1, score));
  }

  private calculatePreferencesAlignment(_input: ScoringInput): number {
    // Simple preferences alignment calculation
    // In a real implementation, this would be more sophisticated
    return 0.1; // 10% boost for preferences alignment
  }

  private calculateConfidence(input: ScoringInput): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on data availability
    if (input.qlooAffinity > 0) confidence += 0.15;
    if (input.communityEngagement.averageEngagement > 0) confidence += 0.1;
    if (input.brandCollaboration.availablePartnerships > 0) confidence += 0.1;
    if (input.budgetAlignment.destinationCost) confidence += 0.1;
    if (input.creatorCollaboration.localCreators.length > 0) confidence += 0.05;

    // Reduce confidence for incomplete data
    if (input.communityEngagement.contentViews === 0) confidence -= 0.1;
    if (input.budgetAlignment.userBudget === 0) confidence -= 0.05;

    return Math.max(0.2, Math.min(1, confidence));
  }

  private generateRecommendations(
    input: ScoringInput,
    scores: {
      qlooScore: number;
      engagementScore: number;
      brandScore: number;
      budgetScore: number;
      creatorScore: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Generate specific recommendations based on scores
    if (scores.qlooScore < 0.6) {
      recommendations.push('Consider destinations that better align with your taste profile');
    }

    if (scores.engagementScore < 0.5) {
      recommendations.push('Focus on destinations with higher engagement potential for your content style');
    }

    if (scores.brandScore > 0.8) {
      recommendations.push('Excellent brand collaboration opportunities available');
    } else if (scores.brandScore < 0.4) {
      recommendations.push('Limited brand partnerships - consider building portfolio first');
    }

    if (scores.budgetScore < 0.5) {
      recommendations.push('Destination may exceed budget - consider adjusting travel dates or style');
    }

    if (scores.creatorScore > 0.7) {
      recommendations.push('Strong local creator network for potential collaborations');
    } else if (scores.creatorScore < 0.3) {
      recommendations.push('Few local creators - opportunity for unique content positioning');
    }

    // Add general recommendations
    if (input.userPreferences?.travelStyle === 'budget' && scores.budgetScore > 0.8) {
      recommendations.push('Great value destination for budget-conscious travelers');
    }

    return recommendations;
  }

  private getFallbackScore(_input: ScoringInput): ScoringResult {
    // Provide a reasonable fallback score when calculation fails
    const fallbackScore = 65; // Average score
    
    return {
      totalScore: fallbackScore,
      breakdown: {
        qlooAffinity: {
          score: 0.6,
          weight: this.weights.qlooAffinity,
          contribution: 0.6 * this.weights.qlooAffinity * 100
        },
        communityEngagement: {
          score: 0.5,
          weight: this.weights.communityEngagement,
          contribution: 0.5 * this.weights.communityEngagement * 100
        },
        brandCollaborationFit: {
          score: 0.4,
          weight: this.weights.brandCollaborationFit,
          contribution: 0.4 * this.weights.brandCollaborationFit * 100
        },
        budgetAlignment: {
          score: 0.7,
          weight: this.weights.budgetAlignment,
          contribution: 0.7 * this.weights.budgetAlignment * 100
        },
        creatorCollaboration: {
          score: 0.3,
          weight: this.weights.creatorCollaboration,
          contribution: 0.3 * this.weights.creatorCollaboration * 100
        }
      },
      confidence: 0.3,
      recommendations: ['Unable to calculate detailed recommendations - using fallback scoring']
    };
  }

  // Utility method to score multiple destinations
  scoreDestinations(destinations: ScoringInput[]): ScoringResult[] {
    return destinations
      .map(dest => ({
        ...dest,
        score: this.calculateDestinationScore(dest)
      }))
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
      .map(dest => dest.score);
  }
}

export const scoringService = new ScoringService();