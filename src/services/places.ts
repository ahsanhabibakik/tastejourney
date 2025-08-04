// Google Places API Integration Service
// Based on PRD requirements for location details and factual information

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos?: {
    photoReference: string;
    width: number;
    height: number;
  }[];
  openingHours?: {
    openNow: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekdayText: string[];
  };
  website?: string;
  phoneNumber?: string;
  businessStatus?: string;
}

export interface LocationSearchRequest {
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number; // meters
  type?: string; // restaurant, tourist_attraction, etc.
  language?: string;
}

export interface NearbySearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  radius: number; // meters
  type?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
}

class PlacesService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async searchPlaces(request: LocationSearchRequest): Promise<PlaceDetails[]> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not found, using fallback places');
        return this.getFallbackPlaces(request);
      }

      const params = new URLSearchParams({
        query: request.query,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,photos,opening_hours,website,formatted_phone_number,business_status'
      });

      if (request.location) {
        params.append('location', `${request.location.lat},${request.location.lng}`);
      }
      if (request.radius) {
        params.append('radius', request.radius.toString());
      }
      if (request.type) {
        params.append('type', request.type);
      }
      if (request.language) {
        params.append('language', request.language);
      }

      const response = await fetch(`${this.baseUrl}/textsearch/json?${params}`);

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API status: ${data.status}`);
      }

      return data.results?.map((place: Record<string, unknown>) => this.formatPlaceDetails(place)) || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return this.getFallbackPlaces(request);
    }
  }

  async getNearbyPlaces(request: NearbySearchRequest): Promise<PlaceDetails[]> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not found, using fallback places');
        return this.getFallbackNearbyPlaces(request);
      }

      const params = new URLSearchParams({
        location: `${request.location.lat},${request.location.lng}`,
        radius: request.radius.toString(),
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,photos,opening_hours,website,formatted_phone_number,business_status'
      });

      if (request.type) {
        params.append('type', request.type);
      }
      if (request.keyword) {
        params.append('keyword', request.keyword);
      }
      if (request.minPrice !== undefined) {
        params.append('minprice', request.minPrice.toString());
      }
      if (request.maxPrice !== undefined) {
        params.append('maxprice', request.maxPrice.toString());
      }

      const response = await fetch(`${this.baseUrl}/nearbysearch/json?${params}`);

      if (!response.ok) {
        throw new Error(`Nearby search API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Nearby search API status: ${data.status}`);
      }

      return data.results?.map((place: Record<string, unknown>) => this.formatPlaceDetails(place)) || [];
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return this.getFallbackNearbyPlaces(request);
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not found');
        return null;
      }

      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,photos,opening_hours,website,formatted_phone_number,business_status,reviews'
      });

      const response = await fetch(`${this.baseUrl}/details/json?${params}`);

      if (!response.ok) {
        throw new Error(`Place details API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Place details API status: ${data.status}`);
      }

      return data.result ? this.formatPlaceDetails(data.result) : null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (!this.apiKey) {
        console.warn('Google Places API key not found');
        return null;
      }

      const params = new URLSearchParams({
        address: address,
        key: this.apiKey
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results?.length) {
        return null;
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  private formatPlaceDetails(place: Record<string, unknown>): PlaceDetails {
    return {
      placeId: place.place_id as string,
      name: (place.name as string) || 'Unknown Place',
      formattedAddress: (place.formatted_address as string) || '',
      location: {
        lat: (place.geometry as any)?.location?.lat || 0,
        lng: (place.geometry as any)?.location?.lng || 0
      },
      types: (place.types as string[]) || [],
      rating: place.rating as number,
      userRatingsTotal: place.user_ratings_total as number,
      priceLevel: place.price_level as number,
      photos: (place.photos as any[])?.map((photo: Record<string, unknown>) => ({
        photoReference: photo.photo_reference as string,
        width: photo.width as number,
        height: photo.height as number
      })),
      openingHours: place.opening_hours ? {
        openNow: (place.opening_hours as any).open_now,
        periods: (place.opening_hours as any).periods || [],
        weekdayText: (place.opening_hours as any).weekday_text || []
      } : undefined,
      website: place.website as string,
      phoneNumber: place.formatted_phone_number as string,
      businessStatus: place.business_status as string
    };
  }

  private getFallbackPlaces(request: LocationSearchRequest): PlaceDetails[] {
    // Fallback places database
    const fallbackPlaces: Record<string, PlaceDetails[]> = {
      'bali restaurants': [
        {
          placeId: 'fallback_bali_1',
          name: 'Locavore Restaurant',
          formattedAddress: 'Jl. Dewisita No.10, Ubud, Gianyar, Bali 80571, Indonesia',
          location: { lat: -8.5069, lng: 115.2624 },
          types: ['restaurant', 'food', 'establishment'],
          rating: 4.6,
          userRatingsTotal: 2847,
          priceLevel: 4
        },
        {
          placeId: 'fallback_bali_2',
          name: 'Warung Babi Guling Ibu Oka',
          formattedAddress: 'Jl. Tegal Sari No.2, Ubud, Gianyar, Bali 80571, Indonesia',
          location: { lat: -8.5076, lng: 115.2615 },
          types: ['restaurant', 'food', 'establishment'],
          rating: 4.3,
          userRatingsTotal: 4521,
          priceLevel: 1
        }
      ],
      'santorini attractions': [
        {
          placeId: 'fallback_santorini_1',
          name: 'Oia Sunset Point',
          formattedAddress: 'Oia 847 02, Greece',
          location: { lat: 36.4618, lng: 25.3753 },
          types: ['tourist_attraction', 'point_of_interest', 'establishment'],
          rating: 4.5,
          userRatingsTotal: 8932
        },
        {
          placeId: 'fallback_santorini_2',
          name: 'Red Beach',
          formattedAddress: 'Akrotiri 847 00, Greece',
          location: { lat: 36.3496, lng: 25.3958 },
          types: ['natural_feature', 'tourist_attraction', 'establishment'],
          rating: 4.2,
          userRatingsTotal: 5647
        }
      ],
      'kyoto temples': [
        {
          placeId: 'fallback_kyoto_1',
          name: 'Kiyomizu-dera Temple',
          formattedAddress: '1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto, 605-0862, Japan',
          location: { lat: 34.9949, lng: 135.7851 },
          types: ['place_of_worship', 'tourist_attraction', 'establishment'],
          rating: 4.4,
          userRatingsTotal: 12456
        },
        {
          placeId: 'fallback_kyoto_2',
          name: 'Fushimi Inari Shrine',
          formattedAddress: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, 612-0882, Japan',
          location: { lat: 34.9671, lng: 135.7727 },
          types: ['place_of_worship', 'tourist_attraction', 'establishment'],
          rating: 4.5,
          userRatingsTotal: 18732
        }
      ]
    };

    const query = request.query.toLowerCase();
    for (const [key, places] of Object.entries(fallbackPlaces)) {
      if (query.includes(key.split(' ')[0])) {
        return places;
      }
    }

    return [];
  }

  private getFallbackNearbyPlaces(request: NearbySearchRequest): PlaceDetails[] {
    // Generate fallback places based on location
    const { lat, lng } = request.location;
    
    // Determine region based on coordinates
    let region = 'general';
    
    if (lat >= -9 && lat <= -8 && lng >= 114 && lng <= 116) {
      region = 'bali';
    } else if (lat >= 36 && lat <= 37 && lng >= 25 && lng <= 26) {
      region = 'santorini';
    } else if (lat >= 34 && lat <= 36 && lng >= 135 && lng <= 136) {
      region = 'kyoto';
    }

    const fallbackByRegion: Record<string, PlaceDetails[]> = {
      'bali': [
        {
          placeId: 'nearby_bali_1',
          name: 'Sacred Monkey Forest Sanctuary',
          formattedAddress: 'Jl. Monkey Forest Rd, Ubud, Gianyar, Bali 80571, Indonesia',
          location: { lat: -8.5188, lng: 115.2582 },
          types: ['zoo', 'tourist_attraction', 'establishment'],
          rating: 4.1,
          userRatingsTotal: 3245
        }
      ],
      'santorini': [
        {
          placeId: 'nearby_santorini_1',
          name: 'Blue Dome Church',
          formattedAddress: 'Oia 847 02, Greece',
          location: { lat: 36.4627, lng: 25.3755 },
          types: ['place_of_worship', 'tourist_attraction', 'establishment'],
          rating: 4.3,
          userRatingsTotal: 1876
        }
      ],
      'kyoto': [
        {
          placeId: 'nearby_kyoto_1',
          name: 'Bamboo Grove',
          formattedAddress: 'Arashiyama, Kyoto, 616-8394, Japan',
          location: { lat: 35.0170, lng: 135.6707 },
          types: ['natural_feature', 'tourist_attraction', 'establishment'],
          rating: 4.2,
          userRatingsTotal: 9876
        }
      ]
    };

    return fallbackByRegion[region] || [];
  }
}

export const placesService = new PlacesService();