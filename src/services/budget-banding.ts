// Budget Alignment Service - Implements Specification Section B
// Enforce ±15% alignment band around user budget; optionally allow "Stretch" up to +35%

interface BudgetBand {
  aligned: { min: number; max: number };
  stretch: { min: number; max: number };
}

interface BudgetStatus {
  status: 'Aligned' | 'Stretch' | 'Out-of-Band';
  deltaPercentage: number;
  badge: string;
  shouldDisplay: boolean;
}

interface BudgetCalculation {
  flights: number;
  accommodation: number;
  dailyExpenses: number;
  activities: number;
  buffer: number;
  total: number;
  currency: string;
  breakdown: string;
}

class BudgetBandingService {
  private readonly ALIGNED_TOLERANCE = 0.15; // ±15%
  private readonly STRETCH_TOLERANCE = 0.35;  // +35%

  /**
   * Calculate budget bands based on user input
   * Input budget = 3000 → aligned [2550..3450] or stretch ≤4050
   */
  calculateBudgetBands(userBudget: number): BudgetBand {
    const alignedMin = userBudget * (1 - this.ALIGNED_TOLERANCE);
    const alignedMax = userBudget * (1 + this.ALIGNED_TOLERANCE);
    const stretchMax = userBudget * (1 + this.STRETCH_TOLERANCE);

    return {
      aligned: {
        min: Math.round(alignedMin),
        max: Math.round(alignedMax)
      },
      stretch: {
        min: Math.round(alignedMax + 1),
        max: Math.round(stretchMax)
      }
    };
  }

  /**
   * Determine budget status and whether destination should be displayed
   */
  getBudgetStatus(destinationTotal: number, userBudget: number): BudgetStatus {
    const bands = this.calculateBudgetBands(userBudget);
    const deltaPercentage = Math.round(((destinationTotal - userBudget) / userBudget) * 100);

    console.log(`💰 BUDGET BANDING: Destination total: $${destinationTotal}, User budget: $${userBudget}`);
    console.log(`💰 BUDGET BANDING: Aligned band: $${bands.aligned.min}-${bands.aligned.max}, Stretch max: $${bands.stretch.max}`);

    if (destinationTotal >= bands.aligned.min && destinationTotal <= bands.aligned.max) {
      return {
        status: 'Aligned',
        deltaPercentage,
        badge: 'Aligned',
        shouldDisplay: true
      };
    } else if (destinationTotal <= bands.stretch.max) {
      const deltaPercent = Math.abs(deltaPercentage);
      return {
        status: 'Stretch',
        deltaPercentage,
        badge: `Stretch (+${deltaPercent}%)`,
        shouldDisplay: true
      };
    } else {
      return {
        status: 'Out-of-Band',
        deltaPercentage,
        badge: 'Out-of-Budget',
        shouldDisplay: false // Per spec: "Hide any destination marked Out-of-Band from the Top-3"
      };
    }
  }

  /**
   * Calculate comprehensive trip budget with all components
   * Consistently: flights (per traveler) + hotel (rooms × nights) + per-diem + activities + buffer
   */
  calculateTripBudget(params: {
    origin: string;
    destination: string;
    travelers: number;
    nights: number;
    flightPrice?: number;
    hotelPricePerNight?: number;
    dailyBudget?: number;
    currency: string;
  }): BudgetCalculation {
    const { travelers, nights, flightPrice = 0, hotelPricePerNight = 0, dailyBudget = 0 } = params;

    // Flights: per traveler
    const flightTotal = flightPrice * travelers;

    // Accommodation: rooms × nights (assume 2 travelers per room)
    const rooms = Math.ceil(travelers / 2);
    const accommodationTotal = hotelPricePerNight * rooms * nights;

    // Daily expenses: per person per day
    const dailyTotal = dailyBudget * travelers * nights;

    // Activities: estimate 20% of daily budget
    const activitiesTotal = dailyTotal * 0.2;

    // Buffer: 10% of subtotal for unexpected costs
    const subtotal = flightTotal + accommodationTotal + dailyTotal + activitiesTotal;
    const bufferAmount = subtotal * 0.1;

    const total = Math.round(subtotal + bufferAmount);

    console.log(`💰 BUDGET CALC: Flights: $${flightTotal}, Hotel: $${accommodationTotal}, Daily: $${dailyTotal}, Activities: $${activitiesTotal}, Buffer: $${bufferAmount}, Total: $${total}`);

    return {
      flights: flightTotal,
      accommodation: accommodationTotal,
      dailyExpenses: dailyTotal,
      activities: activitiesTotal,
      buffer: bufferAmount,
      total,
      currency: params.currency,
      breakdown: `Flights: $${flightTotal} • Hotel: $${accommodationTotal} • Daily: $${dailyTotal} • Activities: $${activitiesTotal} • Buffer: $${Math.round(bufferAmount)}`
    };
  }

  /**
   * Filter destinations by budget alignment
   * Remove Out-of-Band destinations before scoring
   */
  filterDestinationsByBudget(destinations: any[], userBudget: number): any[] {
    console.log(`💰 BUDGET FILTER: Filtering ${destinations.length} destinations against budget $${userBudget}`);

    const filteredDestinations = destinations.map(destination => {
      const budgetCalc = this.extractBudgetFromDestination(destination);
      const budgetStatus = this.getBudgetStatus(budgetCalc.total, userBudget);

      return {
        ...destination,
        budgetCalculation: budgetCalc,
        budgetStatus,
        shouldDisplay: budgetStatus.shouldDisplay
      };
    }).filter(dest => dest.shouldDisplay);

    console.log(`💰 BUDGET FILTER: ${filteredDestinations.length} destinations pass budget filter`);

    if (filteredDestinations.length === 0) {
      console.log(`⚠️ BUDGET FILTER: No destinations fit budget - should return "no fit" message`);
    }

    return filteredDestinations;
  }

  /**
   * Extract or calculate budget from destination data
   */
  private extractBudgetFromDestination(destination: any): BudgetCalculation {
    // Try to extract from existing budget data
    if (destination.budget && destination.budget.total) {
      return destination.budget;
    }

    // Fallback: parse from budget range string like "$1063 - $1438"
    if (destination.budget && destination.budget.range) {
      const range = destination.budget.range;
      const matches = range.match(/\$(\d+)\s*-\s*\$(\d+)/);
      if (matches) {
        const min = parseInt(matches[1]);
        const max = parseInt(matches[2]);
        const total = Math.round((min + max) / 2);

        return {
          flights: total * 0.4,  // Estimate
          accommodation: total * 0.35,
          dailyExpenses: total * 0.2,
          activities: total * 0.05,
          buffer: 0,
          total,
          currency: 'USD',
          breakdown: destination.budget.breakdown || `Estimated total: $${total}`
        };
      }
    }

    // Last resort: use a default based on destination characteristics
    const defaultTotal = this.estimateDefaultBudget(destination);
    return {
      flights: defaultTotal * 0.4,
      accommodation: defaultTotal * 0.35,
      dailyExpenses: defaultTotal * 0.2,
      activities: defaultTotal * 0.05,
      buffer: 0,
      total: defaultTotal,
      currency: 'USD',
      breakdown: `Estimated budget: $${defaultTotal}`
    };
  }

  /**
   * Estimate default budget based on destination characteristics
   */
  private estimateDefaultBudget(destination: any): number {
    const destName = destination.destination || destination.name || '';
    const country = destination.country || '';

    // Simple tier-based estimation
    const expensiveCities = ['Singapore', 'Tokyo', 'London', 'Paris', 'New York', 'Zurich'];
    const moderateCities = ['Barcelona', 'Prague', 'Lisbon', 'Seoul', 'Dubai'];
    const budgetDestinations = ['Bali', 'Vietnam', 'Mexico', 'Thailand', 'Guatemala'];

    if (expensiveCities.some(city => destName.includes(city))) {
      return 2800; // High-end destinations
    } else if (moderateCities.some(city => destName.includes(city))) {
      return 2000; // Moderate destinations
    } else if (budgetDestinations.some(dest => destName.includes(dest))) {
      return 1200; // Budget-friendly destinations
    }

    return 1800; // Default middle range
  }

  /**
   * Generate "no fit" message when no destinations meet budget criteria
   */
  getNoFitMessage(userBudget: number, destinationCount: number): string {
    return `No accurate fits in your budget window of $${userBudget}. Try shifting dates/origin or raising budget.`;
  }

  /**
   * Validate budget alignment for acceptance testing
   */
  validateBudgetAlignment(destinations: any[], userBudget: number): {
    allInBand: boolean;
    alignedCount: number;
    stretchCount: number;
    outOfBandCount: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let alignedCount = 0;
    let stretchCount = 0;
    let outOfBandCount = 0;

    destinations.forEach((dest, index) => {
      const budgetCalc = this.extractBudgetFromDestination(dest);
      const status = this.getBudgetStatus(budgetCalc.total, userBudget);

      switch (status.status) {
        case 'Aligned': alignedCount++; break;
        case 'Stretch': stretchCount++; break;
        case 'Out-of-Band': 
          outOfBandCount++;
          issues.push(`Destination #${index + 1} is out-of-band ($${budgetCalc.total} vs budget $${userBudget})`);
          break;
      }
    });

    return {
      allInBand: outOfBandCount === 0,
      alignedCount,
      stretchCount,
      outOfBandCount,
      issues
    };
  }
}

export const budgetBandingService = new BudgetBandingService();
export type { BudgetStatus, BudgetCalculation, BudgetBand };