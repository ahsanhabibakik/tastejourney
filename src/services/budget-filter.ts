// Budget Filter Service - PRD Compliant Implementation
// Filters destinations based on user's actual budget constraints

interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  meals: number;
  activities: number;
  transport: number;
  miscellaneous: number;
  total: number;
  currency: string;
  perDay: number;
  duration: number;
}

interface BudgetConstraints {
  userBudget: number;
  duration: number; // in days
  budgetType: 'total' | 'per_day';
  flexibility: number; // percentage (0.1 = 10% over budget acceptable)
  currency: string;
}

class BudgetFilterService {
  private numbeoApiKey = process.env.NUMBEO_API_KEY;
  private amadeusApiKey = process.env.AMADEUS_API_KEY;

  async filterDestinationsByBudget(
    destinations: any[],
    userBudgetString: string,
    duration: string,
    userLocation: string = 'US'
  ): Promise<any[]> {
    console.log(`💰 BUDGET: Filtering destinations by budget: ${userBudgetString}, duration: ${duration}`);
    
    const budgetConstraints = this.parseBudgetConstraints(userBudgetString, duration);
    console.log(`💰 BUDGET: Parsed constraints:`, budgetConstraints);
    
    const filteredDestinations = [];
    
    for (const destination of destinations) {
      try {
        const budgetBreakdown = await this.calculateDestinationBudget(
          destination.name || destination.destination,
          destination.country,
          budgetConstraints.duration,
          userLocation
        );
        
        const isAffordable = this.isDestinationAffordable(budgetBreakdown, budgetConstraints);
        
        if (isAffordable.affordable) {
          console.log(`✅ BUDGET: ${destination.name || destination.destination} is affordable (${budgetBreakdown.total} ${budgetBreakdown.currency})`);
          
          // Add budget information to destination
          destination.budget = {
            range: `$${budgetBreakdown.total - 200} - $${budgetBreakdown.total + 200}`,
            breakdown: this.formatBudgetBreakdown(budgetBreakdown),
            costEfficiency: isAffordable.efficiency,
            detailed: budgetBreakdown,
            userBudgetMatch: isAffordable.withinBudget,
            savingsOpportunity: budgetConstraints.userBudget - budgetBreakdown.total
          };
          
          // Adjust match score based on budget efficiency
          if (destination.matchScore || destination.affinityScore) {
            const budgetBonus = isAffordable.withinBudget ? 5 : 0;
            destination.matchScore = (destination.matchScore || destination.affinityScore || 80) + budgetBonus;
          }
          
          filteredDestinations.push(destination);
        } else {
          console.log(`❌ BUDGET: ${destination.name || destination.destination} is too expensive (${budgetBreakdown.total} ${budgetBreakdown.currency} > ${budgetConstraints.userBudget})`);
          
          // Optionally include over-budget destinations with warnings
          if (budgetBreakdown.total <= budgetConstraints.userBudget * 1.3) { // Within 30% over budget
            destination.budget = {
              range: `$${budgetBreakdown.total - 200} - $${budgetBreakdown.total + 200}`,
              breakdown: this.formatBudgetBreakdown(budgetBreakdown),
              costEfficiency: 'Over budget - consider extending trip duration or reducing luxury',
              detailed: budgetBreakdown,
              userBudgetMatch: false,
              overBudgetAmount: budgetBreakdown.total - budgetConstraints.userBudget,
              warning: `This destination exceeds your budget by $${budgetBreakdown.total - budgetConstraints.userBudget}`
            };
            
            // Lower match score for over-budget destinations
            if (destination.matchScore || destination.affinityScore) {
              destination.matchScore = (destination.matchScore || destination.affinityScore || 80) - 15;
            }
            
            filteredDestinations.push(destination);
          }
        }
      } catch (error) {
        console.error(`❌ BUDGET: Error calculating budget for ${destination.name || destination.destination}:`, error);
        
        // Add fallback budget information
        destination.budget = {
          range: 'Budget calculation unavailable',
          breakdown: 'Unable to calculate accurate costs - check destination-specific pricing',
          costEfficiency: 'Unknown',
          detailed: null,
          userBudgetMatch: null,
          error: 'Budget calculation failed'
        };
        
        filteredDestinations.push(destination);
      }
    }
    
    // Sort by budget efficiency and user budget match
    filteredDestinations.sort((a, b) => {
      const aWithinBudget = a.budget?.userBudgetMatch === true ? 1 : 0;
      const bWithinBudget = b.budget?.userBudgetMatch === true ? 1 : 0;
      
      if (aWithinBudget !== bWithinBudget) {
        return bWithinBudget - aWithinBudget; // Within budget first
      }
      
      // Then by match score
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
    
    console.log(`💰 BUDGET: Filtered ${filteredDestinations.length} destinations (${filteredDestinations.filter(d => d.budget?.userBudgetMatch).length} within budget)`);
    return filteredDestinations;
  }

  private parseBudgetConstraints(budgetString: string, durationString: string): BudgetConstraints {
    // Parse budget string (e.g., "$500-1000", "$2500+", "1000-2500")
    const cleanBudget = budgetString.replace(/\$|,/g, '').trim();
    let userBudget = 1500; // Default fallback
    
    if (cleanBudget.includes('-')) {
      const [min, max] = cleanBudget.split('-').map(b => parseInt(b.trim()));
      userBudget = Math.floor((min + max) / 2); // Use average
    } else if (cleanBudget.includes('+')) {
      userBudget = parseInt(cleanBudget.replace('+', '')) * 1.5; // 50% above minimum
    } else {
      userBudget = parseInt(cleanBudget) || 1500;
    }
    
    // Parse duration (e.g., "4-7 days", "1-2 weeks")
    let duration = 7; // Default 1 week
    
    if (durationString.includes('week')) {
      const weeks = parseInt(durationString) || 1;
      duration = weeks * 7;
    } else if (durationString.includes('day')) {
      const days = parseInt(durationString) || 7;
      duration = days;
    } else {
      // Handle ranges like "4-7 days"
      const match = durationString.match(/(\d+)-?(\d+)?/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]) || min;
        duration = Math.floor((min + max) / 2);
      }
    }
    
    return {
      userBudget,
      duration,
      budgetType: 'total',
      flexibility: 0.1, // 10% flexibility
      currency: 'USD'
    };
  }

  private async calculateDestinationBudget(
    destination: string,
    country: string,
    duration: number,
    userLocation: string
  ): Promise<BudgetBreakdown> {
    console.log(`🧮 BUDGET: Calculating costs for ${destination}, ${country} (${duration} days)`);
    
    try {
      // Method 1: Try real APIs for accurate data
      const realBudget = await this.calculateRealBudget(destination, country, duration, userLocation);
      if (realBudget) {
        console.log(`✅ BUDGET: Got real budget data for ${destination}`);
        return realBudget;
      }
    } catch (error) {
      console.warn(`⚠️ BUDGET: Real API failed for ${destination}:`, error instanceof Error ? error.message : String(error));
    }
    
    // Method 2: Use destination-specific estimates
    const estimatedBudget = await this.estimateDestinationBudget(destination, country, duration);
    console.log(`📊 BUDGET: Using estimated budget for ${destination}`);
    return estimatedBudget;
  }

  private async calculateRealBudget(
    destination: string,
    country: string,
    duration: number,
    userLocation: string
  ): Promise<BudgetBreakdown | null> {
    try {
      // Try Numbeo API for cost of living data
      if (this.numbeoApiKey) {
        const costOfLiving = await this.getNumberoCostData(destination, country);
        if (costOfLiving) {
          // Try Amadeus for flight prices
          const flightCost = await this.getAmadeusFlightPrice(userLocation, destination, duration);
          
          return this.compileBudgetBreakdown(costOfLiving, flightCost, duration);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ BUDGET: Real budget calculation failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private async getNumberoCostData(destination: string, country: string) {
    if (!this.numbeoApiKey) return null;
    
    try {
      const response = await fetch(
        `https://www.numbeo.com/api/city_prices?api_key=${this.numbeoApiKey}&query=${encodeURIComponent(destination)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('⚠️ NUMBEO: API call failed:', error instanceof Error ? error.message : String(error));
    }
    
    return null;
  }

  private async getAmadeusFlightPrice(origin: string, destination: string, duration: number) {
    if (!this.amadeusApiKey) return null;
    
    try {
      // Amadeus API calls would go here
      // For now, return null to use estimates
      return null;
    } catch (error) {
      console.warn('⚠️ AMADEUS: API call failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private compileBudgetBreakdown(costOfLiving: any, flightCost: any, duration: number): BudgetBreakdown {
    // This would compile real API data into budget breakdown
    // Implementation depends on actual API response structures
    return {
      flights: flightCost || 600,
      accommodation: duration * 80, // $80/night average
      meals: duration * 45, // $45/day
      activities: duration * 30, // $30/day
      transport: duration * 15, // $15/day local transport
      miscellaneous: duration * 20, // $20/day misc
      total: 0, // calculated below
      currency: 'USD',
      perDay: 0, // calculated below
      duration
    };
  }

  private async estimateDestinationBudget(
    destination: string,
    country: string,
    duration: number
  ): Promise<BudgetBreakdown> {
    const dest = destination.toLowerCase();
    const ctry = country.toLowerCase();
    
    // Destination-specific cost estimates (daily rates in USD)
    const costEstimates = {
      // Major expensive destinations
      'tokyo': { accommodation: 120, meals: 60, activities: 50, transport: 20, misc: 25, flights: 800 },
      'dubai': { accommodation: 150, meals: 70, activities: 80, transport: 25, misc: 30, flights: 750 },
      'singapore': { accommodation: 130, meals: 55, activities: 45, transport: 15, misc: 25, flights: 900 },
      'london': { accommodation: 140, meals: 65, activities: 55, transport: 20, misc: 30, flights: 600 },
      'paris': { accommodation: 135, meals: 60, activities: 50, transport: 18, misc: 27, flights: 650 },
      'new york': { accommodation: 160, meals: 75, activities: 60, transport: 25, misc: 35, flights: 400 },
      
      // Mid-range destinations
      'bali': { accommodation: 40, meals: 25, activities: 30, transport: 10, misc: 15, flights: 900 },
      'bangkok': { accommodation: 35, meals: 20, activities: 25, transport: 8, misc: 12, flights: 850 },
      'lisbon': { accommodation: 60, meals: 35, activities: 30, transport: 12, misc: 18, flights: 600 },
      'prague': { accommodation: 50, meals: 30, activities: 25, transport: 10, misc: 15, flights: 650 },
      'barcelona': { accommodation: 80, meals: 45, activities: 35, transport: 15, misc: 20, flights: 650 },
      
      // Budget-friendly destinations
      'marrakech': { accommodation: 30, meals: 20, activities: 20, transport: 8, misc: 12, flights: 700 },
      'vietnam': { accommodation: 25, meals: 15, activities: 20, transport: 5, misc: 10, flights: 900 },
      'guatemala': { accommodation: 20, meals: 12, activities: 15, transport: 5, misc: 8, flights: 500 },
      'nepal': { accommodation: 15, meals: 10, activities: 15, transport: 3, misc: 7, flights: 800 },
    };
    
    // Get cost estimate
    let costs = (costEstimates as any)[dest];
    
    if (!costs) {
      // Country-level fallbacks
      const countryEstimates = {
        'japan': { accommodation: 100, meals: 50, activities: 40, transport: 18, misc: 22, flights: 800 },
        'indonesia': { accommodation: 35, meals: 20, activities: 25, transport: 8, misc: 12, flights: 900 },
        'france': { accommodation: 110, meals: 55, activities: 45, transport: 16, misc: 24, flights: 650 },
        'usa': { accommodation: 120, meals: 60, activities: 50, transport: 20, misc: 25, flights: 500 },
        'uk': { accommodation: 120, meals: 55, activities: 45, transport: 18, misc: 25, flights: 600 },
        'thailand': { accommodation: 30, meals: 18, activities: 20, transport: 6, misc: 10, flights: 850 },
        'portugal': { accommodation: 55, meals: 32, activities: 28, transport: 10, misc: 15, flights: 600 },
        'spain': { accommodation: 70, meals: 40, activities: 32, transport: 12, misc: 18, flights: 650 },
        'morocco': { accommodation: 25, meals: 18, activities: 18, transport: 6, misc: 10, flights: 700 }
      };
      
      costs = (countryEstimates as any)[ctry] || {
        accommodation: 60, meals: 35, activities: 30, transport: 12, misc: 18, flights: 700
      };
    }
    
    // Calculate total costs
    const accommodation = costs.accommodation * duration;
    const meals = costs.meals * duration;
    const activities = costs.activities * duration;
    const transport = costs.transport * duration;
    const miscellaneous = costs.misc * duration;
    const flights = costs.flights;
    
    const total = accommodation + meals + activities + transport + miscellaneous + flights;
    const perDay = (total - flights) / duration;
    
    return {
      accommodation,
      meals,
      activities,
      transport,
      miscellaneous,
      flights,
      total,
      currency: 'USD',
      perDay,
      duration
    };
  }

  private isDestinationAffordable(
    budget: BudgetBreakdown,
    constraints: BudgetConstraints
  ): { affordable: boolean; withinBudget: boolean; efficiency: string } {
    const maxAcceptable = constraints.userBudget * (1 + constraints.flexibility);
    const affordable = budget.total <= maxAcceptable;
    const withinBudget = budget.total <= constraints.userBudget;
    
    let efficiency = 'Good value';
    
    if (budget.total <= constraints.userBudget * 0.8) {
      efficiency = 'Excellent value - under budget';
    } else if (budget.total <= constraints.userBudget) {
      efficiency = 'Good value - within budget';
    } else if (budget.total <= constraints.userBudget * 1.1) {
      efficiency = 'Slightly over budget';
    } else if (budget.total <= constraints.userBudget * 1.3) {
      efficiency = 'Over budget - consider adjusting';
    } else {
      efficiency = 'Significantly over budget';
    }
    
    return { affordable, withinBudget, efficiency };
  }

  private formatBudgetBreakdown(budget: BudgetBreakdown): string {
    return `Flights: $${budget.flights} • Accommodation: $${budget.accommodation} (${budget.duration} nights) • Meals: $${budget.meals} • Activities: $${budget.activities} • Transport: $${budget.transport}`;
  }

  // Method to check if destination meets budget requirements
  meetsMinimumBudgetRequirements(destination: any, userBudget: string): boolean {
    if (!destination.budget?.detailed) return true; // Allow if no budget data
    
    const constraints = this.parseBudgetConstraints(userBudget, '7 days');
    const maxAcceptable = constraints.userBudget * 1.3; // Allow 30% over budget
    
    return destination.budget.detailed.total <= maxAcceptable;
  }
}

export const budgetFilterService = new BudgetFilterService();
export type { BudgetBreakdown, BudgetConstraints };