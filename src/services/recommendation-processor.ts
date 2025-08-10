// Recommendation Processor - Implements Specification Section G
// Proper filtering and scoring order: hard filters → scoring → creator gating → Top-3

import { creatorGatingService } from './creator-gating';
import { budgetBandingService } from './budget-banding';
import { apiValidator } from './api-validator';

interface ProcessingResult {
  recommendations: any[];
  totalProcessed: number;
  filteredByBudget: number;
  filteredByCreators: number;
  noFitMessage?: string;
}

class RecommendationProcessor {
  /**
   * Process recommendations following specification order:
   * 1. Apply hard filters (visa, climate window, budget band)
   * 2. If passes, compute Total_Score with fixed weights
   * 3. Apply creator gating to hide/show collaboration block
   * 4. Sort by Total_Score, pick Top-3, ensure budget status shown
   */
  async processRecommendations(
    rawRecommendations: any[],
    userBudget: number,
    userPreferences: any
  ): Promise<ProcessingResult> {
    console.log(`🔄 PROCESSING: Starting with ${rawRecommendations.length} raw recommendations`);

    // Step 1: Apply hard filters (budget band is the main constraint we implement)
    const budgetFiltered = await this.applyHardFilters(rawRecommendations, userBudget, userPreferences);
    console.log(`✅ STEP 1: ${budgetFiltered.length} pass hard filters`);

    if (budgetFiltered.length === 0) {
      return {
        recommendations: [],
        totalProcessed: rawRecommendations.length,
        filteredByBudget: rawRecommendations.length,
        filteredByCreators: 0,
        noFitMessage: budgetBandingService.getNoFitMessage(userBudget, rawRecommendations.length)
      };
    }

    // Step 2: Compute Total_Score with fixed weights
    const scoredRecommendations = await this.computeScores(budgetFiltered);
    console.log(`✅ STEP 2: Computed scores for ${scoredRecommendations.length} destinations`);

    // Step 3: Apply creator gating to hide/show collaboration blocks
    const creatorGated = await this.applyCreatorGating(scoredRecommendations);
    console.log(`✅ STEP 3: Applied creator gating`);

    // Step 4: Sort by Total_Score and pick Top-3
    const finalRecommendations = this.selectTop3(creatorGated);
    console.log(`✅ STEP 4: Selected top ${finalRecommendations.length} recommendations`);

    return {
      recommendations: finalRecommendations,
      totalProcessed: rawRecommendations.length,
      filteredByBudget: rawRecommendations.length - budgetFiltered.length,
      filteredByCreators: 0, // Creator gating doesn't filter, just hides collaboration
      noFitMessage: undefined
    };
  }

  /**
   * Step 1: Apply hard filters (visa, climate window, budget band)
   */
  private async applyHardFilters(
    recommendations: any[],
    userBudget: number,
    userPreferences: any
  ): Promise<any[]> {
    console.log(`🔍 HARD FILTERS: Applying budget bands for $${userBudget}`);

    const filtered = budgetBandingService.filterDestinationsByBudget(recommendations, userBudget);
    
    // TODO: Add visa and climate filters when requirements are available
    // For now, just implement budget filtering

    return filtered;
  }

  /**
   * Step 2: Compute Total_Score with fixed weights
   */
  private async computeScores(recommendations: any[]): Promise<any[]> {
    console.log(`🎯 SCORING: Computing scores for ${recommendations.length} destinations`);

    return recommendations.map((rec, index) => {
      // Prepare signals for scoring
      const signals = {
        qloo: {
          affinity: rec.qlooScore || rec.matchScore / 100 || 0.7
        },
        brand: {
          fit: rec.brandCollaboration?.fit || 0.7
        },
        budget: {
          alignment: rec.budgetStatus?.status === 'Aligned' ? 0.9 : 
                    rec.budgetStatus?.status === 'Stretch' ? 0.6 : 0.3
        },
        creator: {
          collaboration: 0.5 // Will be updated after creator gating
        }
      };

      // Calculate PRD-compliant score with NaN protection
      const totalScore = apiValidator.calculatePRDScore(signals);
      const matchScore = this.sanitizeMatchScore(totalScore * 100);

      console.log(`📊 SCORING: ${rec.destination} → ${matchScore}% (${totalScore.toFixed(3)})`);

      return {
        ...rec,
        totalScore,
        matchScore: matchScore,
        scoringSignals: signals,
        scoringBreakdown: {
          qlooAffinity: signals.qloo.affinity * 0.45,
          communityEngagement: 0.5 * 0.25, // Will be updated
          brandCollaboration: signals.brand.fit * 0.15,
          budgetAlignment: signals.budget.alignment * 0.10,
          localCreator: 0.5 * 0.05 // Will be updated after creator gating
        }
      };
    });
  }

  /**
   * Step 3: Apply creator gating to hide/show collaboration blocks
   */
  private async applyCreatorGating(recommendations: any[]): Promise<any[]> {
    console.log(`👥 CREATOR GATING: Processing ${recommendations.length} destinations`);

    return recommendations.map(rec => {
      // Get creator data from recommendation
      const creatorData = rec.creatorDetails || rec.creators || {
        totalActiveCreators: 0,
        topCreators: [],
        collaborationOpportunities: [],
        dataSource: 'insufficient',
        lastUpdated: new Date().toISOString()
      };

      // Apply creator gating
      const gatingResult = creatorGatingService.processCreatorDataForDisplay(creatorData);

      // Update scoring based on gating result
      const updatedScoring = { ...rec.scoringBreakdown };
      updatedScoring.localCreator = gatingResult.collaborationScore * 0.05;

      // Recalculate total score with NaN protection
      const newTotalScore = Object.values(updatedScoring).reduce((sum: number, val) => {
        const safeVal = this.sanitizeScore(val);
        return sum + safeVal;
      }, 0);
      const newMatchScore = this.sanitizeMatchScore(newTotalScore * 100);

      console.log(`👥 CREATOR GATING: ${rec.destination} → ${gatingResult.shouldShowCollaboration ? 'Show' : 'Hide'} collaboration (${gatingResult.totalActiveCreators || 0} creators)`);

      return {
        ...rec,
        totalScore: newTotalScore,
        matchScore: newMatchScore,
        scoringBreakdown: updatedScoring,
        creatorGating: gatingResult,
        // Update creator display data based on gating
        creatorDetails: gatingResult.shouldShowCollaboration ? {
          totalActiveCreators: gatingResult.totalActiveCreators,
          topCreators: gatingResult.topCreators,
          collaborationOpportunities: gatingResult.collaborationOpportunities
        } : undefined, // Hide creator details if gating fails
        // Keep original data for internal use but don't expose in UI
        _originalCreatorData: creatorData
      };
    });
  }

  /**
   * Step 4: Sort by Total_Score and pick Top-3
   */
  private selectTop3(recommendations: any[]): any[] {
    console.log(`🏆 TOP-3: Selecting from ${recommendations.length} scored destinations`);

    const sorted = recommendations
      .sort((a, b) => {
        // Primary sort: total score (descending)
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // Secondary sort: budget status (Aligned > Stretch)
        if (a.budgetStatus?.status === 'Aligned' && b.budgetStatus?.status === 'Stretch') {
          return -1;
        }
        if (a.budgetStatus?.status === 'Stretch' && b.budgetStatus?.status === 'Aligned') {
          return 1;
        }
        // Tertiary sort: destination name for consistency
        return a.destination.localeCompare(b.destination);
      })
      .slice(0, 3);

    // Ensure all selected have proper budget status badges
    sorted.forEach((rec, index) => {
      if (rec.budgetStatus) {
        console.log(`🏆 TOP-3 #${index + 1}: ${rec.destination} (${rec.matchScore}%) - ${rec.budgetStatus.badge}`);
      }
    });

    return sorted;
  }

  /**
   * Validate processing results for acceptance testing
   */
  validateResults(results: ProcessingResult, userBudget: number): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check that all displayed recommendations are within budget bands
    results.recommendations.forEach((rec, index) => {
      if (!rec.budgetStatus || rec.budgetStatus.status === 'Out-of-Band') {
        issues.push(`Recommendation #${index + 1} is out-of-band but still displayed`);
      }

      if (rec.matchScore === undefined || isNaN(rec.matchScore)) {
        issues.push(`Recommendation #${index + 1} has invalid match score: ${rec.matchScore}`);
      }

      // Check creator gating compliance
      if (rec.creatorGating && !rec.creatorGating.shouldShowCollaboration && rec.creatorDetails) {
        issues.push(`Recommendation #${index + 1} should hide collaboration but still shows creator details`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Sanitize match score to prevent NaN display - per instruction #5
   */
  private sanitizeMatchScore(score: any): number {
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      console.warn('⚠️ NaN GUARD: Invalid match score detected, using fallback:', score);
      return 75; // Neutral match score
    }
    
    // Ensure valid percentage range
    const rounded = Math.round(score);
    return Math.max(0, Math.min(100, rounded));
  }

  /**
   * Sanitize individual score components - per instruction #5
   */
  private sanitizeScore(score: any): number {
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      console.warn('⚠️ NaN GUARD: Invalid score component detected, using fallback:', score);
      return 0.5; // Neutral score
    }
    
    return Math.max(0, Math.min(1, score));
  }
}

export const recommendationProcessor = new RecommendationProcessor();