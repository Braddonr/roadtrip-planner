// API service for external data fetching
// In a real app, these would connect to actual APIs

export interface PlacesSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    types: string[];
  }>;
}

export interface WeatherResponse {
  location: string;
  current: {
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_mph: number;
  };
}

export interface RecommendationsResponse {
  results: Array<{
    place_id: string;
    name: string;
    rating: number;
    price_level?: number;
    types: string[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    photos?: Array<{
      photo_reference: string;
    }>;
    opening_hours?: {
      open_now: boolean;
    };
  }>;
}

class ApiService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Search for places using Google Places API (mock implementation)
  async searchPlaces(query: string): Promise<PlacesSearchResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      results: [
        {
          place_id: `place_${Date.now()}_1`,
          name: `${query} National Park`,
          formatted_address: `${query}, State, USA`,
          geometry: {
            location: {
              lat: 40.7128 + Math.random() * 10,
              lng: -74.006 + Math.random() * 10,
            },
          },
          rating: 4.5,
          types: ['park', 'tourist_attraction'],
        },
        {
          place_id: `place_${Date.now()}_2`,
          name: `${query} Downtown`,
          formatted_address: `Downtown ${query}, State, USA`,
          geometry: {
            location: {
              lat: 40.7128 + Math.random() * 10,
              lng: -74.006 + Math.random() * 10,
            },
          },
          rating: 4.2,
          types: ['locality', 'political'],
        },
        {
          place_id: `place_${Date.now()}_3`,
          name: `${query} Museum`,
          formatted_address: `${query} Museum, State, USA`,
          geometry: {
            location: {
              lat: 40.7128 + Math.random() * 10,
              lng: -74.006 + Math.random() * 10,
            },
          },
          rating: 4.7,
          types: ['museum', 'tourist_attraction'],
        },
      ],
    };
  }

  // Get weather forecast for a location
  async getWeatherForecast(lat: number, lng: number): Promise<WeatherResponse> {
    // Mock implementation - replace with actual weather API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const conditions = ['Sunny', 'Partly Cloudy', 'Light Rain', 'Clear', 'Overcast'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      location: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      current: {
        temp_f: 65 + Math.random() * 25,
        condition: {
          text: condition,
          icon: condition.toLowerCase().replace(' ', '_'),
        },
        humidity: 40 + Math.random() * 40,
        wind_mph: Math.random() * 15,
      },
    };
  }

  // Get recommendations near a location
  async getNearbyRecommendations(lat: number, lng: number, type?: string): Promise<RecommendationsResponse> {
    // Mock implementation - replace with actual places API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const attractions = [
      'Scenic Overlook', 'Historic Site', 'Nature Trail', 'Visitor Center', 'Art Gallery'
    ];
    const restaurants = [
      'Local Bistro', 'Farm-to-Table Restaurant', 'Craft Brewery', 'Coffee House', 'Diner'
    ];
    const accommodations = [
      'Mountain Lodge', 'Historic Inn', 'Boutique Hotel', 'Camping Resort', 'B&B'
    ];
    
    const getRandomName = (category: string[]) => 
      category[Math.floor(Math.random() * category.length)];
    
    const results = [];
    const types = type ? [type] : ['attraction', 'restaurant', 'accommodation'];
    
    for (const placeType of types) {
      for (let i = 0; i < 2; i++) {
        let name, placeTypes;
        
        switch (placeType) {
          case 'attraction':
            name = getRandomName(attractions);
            placeTypes = ['tourist_attraction', 'point_of_interest'];
            break;
          case 'restaurant':
            name = getRandomName(restaurants);
            placeTypes = ['restaurant', 'food', 'establishment'];
            break;
          case 'accommodation':
            name = getRandomName(accommodations);
            placeTypes = ['lodging', 'establishment'];
            break;
          default:
            name = getRandomName(attractions);
            placeTypes = ['establishment'];
        }
        
        results.push({
          place_id: `${placeType}_${Date.now()}_${i}`,
          name,
          rating: 3.5 + Math.random() * 1.5,
          price_level: Math.floor(Math.random() * 4) + 1,
          types: placeTypes,
          geometry: {
            location: {
              lat: lat + (Math.random() - 0.5) * 0.1,
              lng: lng + (Math.random() - 0.5) * 0.1,
            },
          },
          photos: [{
            photo_reference: `photo_${Date.now()}_${i}`,
          }],
          opening_hours: {
            open_now: Math.random() > 0.3,
          },
        });
      }
    }
    
    return { results };
  }

  // Calculate route between points
  async calculateRoute(waypoints: Array<{ lat: number; lng: number }>) {
    // Mock implementation - replace with actual routing API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (waypoints.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        legs: [],
      };
    }
    
    const legs = [];
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = Math.random() * 200 + 50; // 50-250 miles
      const time = distance / (45 + Math.random() * 30); // 45-75 mph average
      
      legs.push({
        distance: {
          text: `${Math.round(distance)} miles`,
          value: distance,
        },
        duration: {
          text: `${Math.round(time * 60)} min`,
          value: time,
        },
      });
      
      totalDistance += distance;
      totalTime += time;
    }
    
    return {
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime * 10) / 10,
      legs,
    };
  }
}

export const apiService = new ApiService();