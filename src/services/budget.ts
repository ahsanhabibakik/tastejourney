// Budget Calculation Service using Amadeus and Numbeo APIs
// Based on PRD requirements for dynamic budget calculations

export interface BudgetBreakdown {
  flights: {
    price: number;
    currency: string;
    roundTrip: boolean;
  };
  accommodation: {
    pricePerNight: number;
    totalPrice: number;
    currency: string;
    category: string;
  };
  livingExpenses: {
    dailyBudget: number;
    totalBudget: number;
    currency: string;
    breakdown: {
      meals: number;
      transport: number;
      activities: number;
      miscellaneous: number;
    };
  };
  totalEstimate: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface BudgetRequest {
  destination: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  origin?: {
    city: string;
    country: string;
  };
  duration: number; // days
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  travelers: number;
}

class BudgetService {
  private amadeusApiKey: string;
  private amadeusApiSecret: string;
  private amadeusToken: string | null = null;
  private numbeoBaseUrl: string;

  constructor() {
    this.amadeusApiKey = process.env.AMADEUS_API_KEY || '';
    this.amadeusApiSecret = process.env.AMADEUS_API_SECRET || '';
    this.numbeoBaseUrl = 'https://www.numbeo.com/api';
  }

  async calculateBudget(request: BudgetRequest): Promise<BudgetBreakdown> {
    try {
      const [flightData, livingData] = await Promise.all([
        this.getFlightPrices(request),
        this.getLivingCosts(request)
      ]);

      const accommodation = this.estimateAccommodation(request, livingData);
      
      return {
        flights: flightData,
        accommodation,
        livingExpenses: livingData,
        totalEstimate: this.calculateTotalEstimate(flightData, accommodation, livingData, request.travelers)
      };
    } catch (error) {
      console.error('Error calculating budget:', error);
      return this.getFallbackBudget(request);
    }
  }

  private async getAmadeusToken(): Promise<string> {
    if (this.amadeusToken) return this.amadeusToken;

    if (!this.amadeusApiKey || !this.amadeusApiSecret) {
      throw new Error('Amadeus API credentials not found');
    }

    try {
      const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.amadeusApiKey,
          client_secret: this.amadeusApiSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Amadeus auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.amadeusToken = data.access_token;
      
      // Reset token after expiry
      setTimeout(() => {
        this.amadeusToken = null;
      }, (data.expires_in - 60) * 1000);

      return this.amadeusToken as string;
    } catch (error) {
      console.error('Error getting Amadeus token:', error);
      throw error;
    }
  }

  private async getFlightPrices(request: BudgetRequest): Promise<BudgetBreakdown['flights']> {
    try {
      const token = await this.getAmadeusToken();
      
      // Get IATA codes for origin and destination
      // Per instruction #3: Origin must come from user input, never default to New York
      if (!request.origin?.city) {
        throw new Error('Origin city is required - cannot default to New York');
      }
      const originCode = await this.getIATACode(request.origin.city, token);
      const destCode = await this.getIATACode(request.destination.city, token);

      if (!originCode || !destCode) {
        throw new Error('Could not find airport codes');
      }

      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + 30); // 30 days from now
      const returnDate = new Date(departureDate);
      returnDate.setDate(returnDate.getDate() + request.duration);

      const response = await fetch(
        `https://api.amadeus.com/v2/shopping/flight-offers?` + 
        new URLSearchParams({
          originLocationCode: originCode,
          destinationLocationCode: destCode,
          departureDate: departureDate.toISOString().split('T')[0],
          returnDate: returnDate.toISOString().split('T')[0],
          adults: request.travelers.toString(),
          max: '5'
        }), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Flight search failed: ${response.status}`);
      }

      const data = await response.json();
      const offers = data.data || [];
      
      if (offers.length === 0) {
        throw new Error('No flight offers found');
      }

      // Get the cheapest flight
      const cheapestFlight = offers.reduce((min: { price: { total: string } }, offer: { price: { total: string } }) => 
        parseFloat(offer.price.total) < parseFloat(min.price.total) ? offer : min
      );

      return {
        price: parseFloat(cheapestFlight.price.total),
        currency: cheapestFlight.price.currency,
        roundTrip: true
      };
    } catch (error) {
      console.error('Error getting flight prices:', error);
      return this.getFallbackFlightPrice(request);
    }
  }

  private async getIATACode(city: string, token: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.amadeus.com/v1/reference-data/locations?` +
        new URLSearchParams({
          keyword: city,
          subType: 'AIRPORT'
        }), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data?.[0]?.iataCode || null;
    } catch (error) {
      console.error('Error getting IATA code:', error);
      return null;
    }
  }

  private async getLivingCosts(request: BudgetRequest): Promise<BudgetBreakdown['livingExpenses']> {
    try {
      // Numbeo API doesn't have a free tier with API access
      // Using fallback calculations based on known data
      return this.getFallbackLivingCosts(request);
    } catch (error) {
      console.error('Error getting living costs:', error);
      return this.getFallbackLivingCosts(request);
    }
  }

  private estimateAccommodation(
    request: BudgetRequest,
    livingData: BudgetBreakdown['livingExpenses']
  ): BudgetBreakdown['accommodation'] {
    // Estimate accommodation based on travel style and living costs
    const baseRate = livingData.dailyBudget * 0.4; // 40% of daily budget typically goes to accommodation
    
    let multiplier = 1;
    switch (request.travelStyle) {
      case 'budget':
        multiplier = 0.6;
        break;
      case 'luxury':
        multiplier = 2.5;
        break;
      default:
        multiplier = 1;
    }

    const pricePerNight = Math.round(baseRate * multiplier);
    
    return {
      pricePerNight,
      totalPrice: pricePerNight * request.duration,
      currency: 'USD',
      category: request.travelStyle
    };
  }

  private calculateTotalEstimate(
    flights: BudgetBreakdown['flights'],
    accommodation: BudgetBreakdown['accommodation'],
    living: BudgetBreakdown['livingExpenses'],
    travelers: number
  ): BudgetBreakdown['totalEstimate'] {
    const flightTotal = flights.price * travelers;
    const accommodationTotal = accommodation.totalPrice;
    const livingTotal = living.totalBudget * travelers;

    const total = flightTotal + accommodationTotal + livingTotal;
    
    return {
      min: Math.round(total * 0.85), // 15% discount for optimization
      max: Math.round(total * 1.15), // 15% buffer for unexpected costs
      currency: 'USD'
    };
  }

  private getFallbackBudget(request: BudgetRequest): BudgetBreakdown {
    const flights = this.getFallbackFlightPrice(request);
    const living = this.getFallbackLivingCosts(request);
    const accommodation = this.estimateAccommodation(request, living);

    return {
      flights,
      accommodation,
      livingExpenses: living,
      totalEstimate: this.calculateTotalEstimate(flights, accommodation, living, request.travelers)
    };
  }

  private getFallbackFlightPrice(request: BudgetRequest): BudgetBreakdown['flights'] {
    // Fallback flight prices based on destination regions
    const regionPrices: Record<string, number> = {
      'asia': 800,
      'europe': 600,
      'south america': 700,
      'africa': 900,
      'oceania': 1200,
      'default': 750
    };

    const destination = request.destination.country.toLowerCase();
    let basePrice = regionPrices.default;

    for (const [region, price] of Object.entries(regionPrices)) {
      if (region !== 'default' && this.isInRegion(destination, region)) {
        basePrice = price;
        break;
      }
    }

    return {
      price: basePrice * request.travelers,
      currency: 'USD',
      roundTrip: true
    };
  }

  private getFallbackLivingCosts(request: BudgetRequest): BudgetBreakdown['livingExpenses'] {
    // Fallback daily costs based on destination and travel style
    const baseCosts: Record<string, number> = {
      'budget': 50,
      'mid-range': 100,
      'luxury': 250
    };

    // Regional cost multipliers
    const regionMultipliers: Record<string, number> = {
      'japan': 1.4,
      'switzerland': 1.6,
      'norway': 1.5,
      'singapore': 1.3,
      'thailand': 0.6,
      'india': 0.4,
      'vietnam': 0.5,
      'poland': 0.7,
      'greece': 0.8,
      'default': 1.0
    };

    const country = request.destination.country.toLowerCase();
    const multiplier = regionMultipliers[country] || regionMultipliers.default;
    const dailyBudget = Math.round(baseCosts[request.travelStyle] * multiplier);

    return {
      dailyBudget,
      totalBudget: dailyBudget * request.duration,
      currency: 'USD',
      breakdown: {
        meals: Math.round(dailyBudget * 0.4),
        transport: Math.round(dailyBudget * 0.2),
        activities: Math.round(dailyBudget * 0.3),
        miscellaneous: Math.round(dailyBudget * 0.1)
      }
    };
  }

  private isInRegion(country: string, region: string): boolean {
    const regions: Record<string, string[]> = {
      'asia': ['japan', 'china', 'thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines', 'india', 'south korea'],
      'europe': ['france', 'germany', 'italy', 'spain', 'netherlands', 'uk', 'greece', 'portugal', 'poland', 'norway', 'switzerland'],
      'south america': ['brazil', 'argentina', 'chile', 'peru', 'colombia', 'ecuador', 'bolivia', 'uruguay'],
      'africa': ['south africa', 'kenya', 'tanzania', 'morocco', 'egypt', 'ghana', 'nigeria'],
      'oceania': ['australia', 'new zealand', 'fiji']
    };

    return regions[region]?.some(c => country.includes(c)) || false;
  }
}

export const budgetService = new BudgetService();