// OpenAI service for fetching travel recommendations
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1";

export interface OpenAIRecommendation {
  id: string;
  name: string;
  description: string;
  type: "restaurant" | "attraction" | "accommodation";
  rating?: number;
  priceLevel?: number;
  address?: string;
  imageUrl?: string;
  tags: string[];
  lat?: number;
  lng?: number;
  openingHours?: string;
  website?: string;
  phone?: string;
}

export interface RecommendationsResponse {
  restaurants: OpenAIRecommendation[];
  attractions: OpenAIRecommendation[];
  accommodations: OpenAIRecommendation[];
}

export interface WeatherForecast {
  id: string;
  locationName: string;
  date: string;
  temperature: {
    high: number;
    low: number;
    current: number;
  };
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
  lat?: number;
  lng?: number;
}

export interface TripWeatherResponse {
  forecasts: WeatherForecast[];
  tripDuration: number;
  averageTemp: number;
  dominantCondition: string;
}

class OpenAIService {
  private apiKey = OPENAI_API_KEY;
  private baseUrl = OPENAI_BASE_URL;

  constructor() {
    if (!this.apiKey) {
      console.error("❌ OpenAI API key is not defined!");
      console.log("Please add VITE_OPENAI_API_KEY to your .env file");
    } else {
      console.log("✅ OpenAI API key loaded successfully");
    }
  }

  // Fetch recommendations for a specific location using OpenAI
  async getRecommendationsForLocation(
    locationName: string,
    lat?: number,
    lng?: number
  ): Promise<RecommendationsResponse> {
    if (!this.apiKey) {
      console.warn("OpenAI API key not available, returning mock data");
      return this.getMockRecommendations(locationName);
    }

    try {
      console.log(`🤖 Fetching OpenAI recommendations for: ${locationName}`);

      const prompt = this.buildRecommendationPrompt(locationName, lat, lng);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a travel expert providing detailed recommendations for travelers. Always respond with valid JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Parse the JSON response
      const recommendations = JSON.parse(content);

      // Add image URLs using a placeholder service
      const processedRecommendations = this.addImageUrls(
        recommendations,
        locationName
      );

      console.log(
        `✅ OpenAI recommendations fetched for ${locationName}:`,
        processedRecommendations
      );
      return processedRecommendations;
    } catch (error) {
      console.error(`❌ OpenAI API error for ${locationName}:`, error);
      // Fallback to mock data
      return this.getMockRecommendations(locationName);
    }
  }

  // Fetch recommendations for multiple stops in a trip
  async getRecommendationsForTrip(
    stops: Array<{
      id: string;
      name: string;
      lat?: number;
      lng?: number;
    }>
  ): Promise<{
    restaurants: OpenAIRecommendation[];
    attractions: OpenAIRecommendation[];
    accommodations: OpenAIRecommendation[];
  }> {
    console.log(`🗺️ Fetching recommendations for ${stops.length} stops`);

    try {
      // Fetch recommendations for each stop
      const allRecommendations = await Promise.all(
        stops.map((stop) =>
          this.getRecommendationsForLocation(stop.name, stop.lat, stop.lng)
        )
      );

      // Combine all recommendations
      const combined = {
        restaurants: [] as OpenAIRecommendation[],
        attractions: [] as OpenAIRecommendation[],
        accommodations: [] as OpenAIRecommendation[],
      };

      allRecommendations.forEach((rec, index) => {
        // Add stop information to each recommendation
        const stopName = stops[index].name;

        combined.restaurants.push(
          ...rec.restaurants.map((r) => ({
            ...r,
            id: `${stopName}-${r.id}`,
            tags: [...r.tags, `Near ${stopName}`],
          }))
        );

        combined.attractions.push(
          ...rec.attractions.map((a) => ({
            ...a,
            id: `${stopName}-${a.id}`,
            tags: [...a.tags, `Near ${stopName}`],
          }))
        );

        combined.accommodations.push(
          ...rec.accommodations.map((h) => ({
            ...h,
            id: `${stopName}-${h.id}`,
            tags: [...h.tags, `Near ${stopName}`],
          }))
        );
      });

      // Remove duplicates and limit results
      combined.restaurants = this.removeDuplicates(combined.restaurants).slice(
        0,
        12
      );
      combined.attractions = this.removeDuplicates(combined.attractions).slice(
        0,
        12
      );
      combined.accommodations = this.removeDuplicates(
        combined.accommodations
      ).slice(0, 8);

      console.log(`✅ Combined recommendations:`, {
        restaurants: combined.restaurants.length,
        attractions: combined.attractions.length,
        accommodations: combined.accommodations.length,
      });

      return combined;
    } catch (error) {
      console.error("❌ Error fetching trip recommendations:", error);
      // Return mock data for all stops
      return this.getMockRecommendationsForTrip(stops);
    }
  }

  // Build the prompt for OpenAI
  private buildRecommendationPrompt(
    locationName: string,
    lat?: number,
    lng?: number
  ): string {
    const coordinates = lat && lng ? ` (coordinates: ${lat}, ${lng})` : "";

    return `
Please provide travel recommendations for ${locationName}${coordinates}. 
Return the response as a JSON object with this exact structure:

{
  "restaurants": [
    {
      "id": "unique-id",
      "name": "Restaurant Name",
      "description": "Brief description of the restaurant and cuisine",
      "type": "restaurant",
      "rating": 4.5,
      "priceLevel": 2,
      "address": "Full address",
      "tags": ["cuisine-type", "atmosphere", "specialty"],
      "openingHours": "9:00 AM - 10:00 PM",
      "phone": "+1234567890"
    }
  ],
  "attractions": [
    {
      "id": "unique-id",
      "name": "Attraction Name",
      "description": "Description of what makes this place special",
      "type": "attraction",
      "rating": 4.8,
      "address": "Full address",
      "tags": ["category", "activity-type", "best-time"],
      "openingHours": "8:00 AM - 6:00 PM"
    }
  ],
  "accommodations": [
    {
      "id": "unique-id",
      "name": "Hotel/Lodge Name",
      "description": "Description of accommodation and amenities",
      "type": "accommodation",
      "rating": 4.3,
      "priceLevel": 3,
      "address": "Full address",
      "tags": ["hotel-type", "amenities", "location"],
      "phone": "+1234567890",
      "website": "https://example.com"
    }
  ]
}

Please provide 3-4 recommendations for each category. Focus on popular, well-reviewed places that are actually located in or near ${locationName}. Make sure all JSON is valid and properly formatted.
    `.trim();
  }

  // Add placeholder image URLs to recommendations
  private addImageUrls(
    recommendations: any,
    locationName: string
  ): RecommendationsResponse {
    const addImages = (items: any[], type: string) => {
      return items.map((item, index) => ({
        ...item,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-${type}-${index}`,
      }));
    };

    return {
      restaurants: addImages(recommendations.restaurants || [], "restaurant"),
      attractions: addImages(recommendations.attractions || [], "attraction"),
      accommodations: addImages(
        recommendations.accommodations || [],
        "accommodation"
      ),
    };
  }

  // Remove duplicate recommendations based on name similarity
  private removeDuplicates(
    items: OpenAIRecommendation[]
  ): OpenAIRecommendation[] {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Mock recommendations fallback
  private getMockRecommendations(
    locationName: string
  ): RecommendationsResponse {
    const mockRestaurants: OpenAIRecommendation[] = [
      {
        id: `${locationName}-rest-1`,
        name: `${locationName} Bistro`,
        description: `Popular local restaurant serving authentic cuisine in ${locationName}`,
        type: "restaurant",
        rating: 4.5,
        priceLevel: 2,
        address: `Main Street, ${locationName}`,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-restaurant-1`,
        tags: ["local cuisine", "popular", "family-friendly"],
        openingHours: "9:00 AM - 10:00 PM",
      },
      {
        id: `${locationName}-rest-2`,
        name: `Cafe ${locationName}`,
        description: `Cozy cafe with great coffee and light meals in ${locationName}`,
        type: "restaurant",
        rating: 4.2,
        priceLevel: 1,
        address: `Central Plaza, ${locationName}`,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-restaurant-2`,
        tags: ["cafe", "coffee", "breakfast"],
        openingHours: "7:00 AM - 6:00 PM",
      },
    ];

    const mockAttractions: OpenAIRecommendation[] = [
      {
        id: `${locationName}-attr-1`,
        name: `${locationName} Museum`,
        description: `Learn about the rich history and culture of ${locationName}`,
        type: "attraction",
        rating: 4.7,
        address: `Museum District, ${locationName}`,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-attraction-1`,
        tags: ["museum", "history", "culture"],
        openingHours: "9:00 AM - 5:00 PM",
      },
      {
        id: `${locationName}-attr-2`,
        name: `${locationName} Park`,
        description: `Beautiful natural park perfect for relaxation and outdoor activities`,
        type: "attraction",
        rating: 4.4,
        address: `Park Avenue, ${locationName}`,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-attraction-2`,
        tags: ["nature", "outdoor", "family"],
        openingHours: "6:00 AM - 8:00 PM",
      },
    ];

    const mockAccommodations: OpenAIRecommendation[] = [
      {
        id: `${locationName}-hotel-1`,
        name: `${locationName} Grand Hotel`,
        description: `Luxury hotel with excellent amenities in the heart of ${locationName}`,
        type: "accommodation",
        rating: 4.6,
        priceLevel: 3,
        address: `Downtown, ${locationName}`,
        imageUrl: `https://picsum.photos/300/200?random=${encodeURIComponent(
          locationName
        )}-hotel-1`,
        tags: ["luxury", "downtown", "business"],
        website: "https://example.com",
      },
    ];

    return {
      restaurants: mockRestaurants,
      attractions: mockAttractions,
      accommodations: mockAccommodations,
    };
  }

  // Mock recommendations for multiple stops
  private getMockRecommendationsForTrip(
    stops: Array<{ name: string }>
  ): RecommendationsResponse {
    const allMock = stops.map((stop) => this.getMockRecommendations(stop.name));

    return {
      restaurants: allMock.flatMap((m) => m.restaurants).slice(0, 12),
      attractions: allMock.flatMap((m) => m.attractions).slice(0, 12),
      accommodations: allMock.flatMap((m) => m.accommodations).slice(0, 8),
    };
  }

  // Fetch weather forecasts for trip stops using OpenAI
  async getWeatherForecastForTrip(
    stops: Array<{
      id: string;
      name: string;
      lat?: number;
      lng?: number;
    }>,
    startDate?: Date,
    endDate?: Date
  ): Promise<TripWeatherResponse> {
    if (!this.apiKey) {
      console.warn("OpenAI API key not available, returning mock weather data");
      return this.getMockWeatherForTrip(stops, startDate, endDate);
    }

    try {
      console.log(
        `🌤️ Fetching OpenAI weather forecasts for ${stops.length} stops`
      );

      const prompt = this.buildWeatherPrompt(stops, startDate, endDate);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a weather expert providing realistic weather forecasts for travel planning. Always respond with valid JSON format and realistic weather data for the specified locations and dates.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.3, // Lower temperature for more consistent weather data
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No weather content received from OpenAI");
      }

      // Parse the JSON response
      const weatherData = JSON.parse(content);

      console.log(`✅ OpenAI weather forecasts fetched for trip:`, weatherData);
      return weatherData;
    } catch (error) {
      console.error(`❌ OpenAI weather API error:`, error);
      // Fallback to mock data
      return this.getMockWeatherForTrip(stops, startDate, endDate);
    }
  }

  // Build the weather prompt for OpenAI
  private buildWeatherPrompt(
    stops: Array<{ name: string; lat?: number; lng?: number }>,
    startDate?: Date,
    endDate?: Date
  ): string {
    const dateRange =
      startDate && endDate
        ? `from ${startDate.toDateString()} to ${endDate.toDateString()}`
        : "for the next 7 days";

    const stopsInfo = stops
      .map((stop) => {
        const coords =
          stop.lat && stop.lng ? ` (${stop.lat}, ${stop.lng})` : "";
        return `${stop.name}${coords}`;
      })
      .join(", ");

    return `
Please provide weather forecasts for a trip to these locations: ${stopsInfo} ${dateRange}.

Return the response as a JSON object with this exact structure:

{
  "forecasts": [
    {
      "id": "location-date-id",
      "locationName": "Location Name",
      "date": "2024-01-15",
      "temperature": {
        "high": 28,
        "low": 18,
        "current": 23
      },
      "condition": "Partly Cloudy",
      "description": "Pleasant weather with some clouds",
      "humidity": 65,
      "windSpeed": 12,
      "precipitation": 10,
      "icon": "partly-cloudy"
    }
  ],
  "tripDuration": 7,
  "averageTemp": 25,
  "dominantCondition": "Partly Cloudy"
}

Please provide realistic weather forecasts for each location. Use appropriate weather conditions for the geographic location and season. Include temperature in Celsius, wind speed in km/h, humidity as percentage, and precipitation chance as percentage.

Weather icons should be one of: "sunny", "partly-cloudy", "cloudy", "rainy", "stormy", "snowy", "foggy".

Make sure all JSON is valid and properly formatted.
    `.trim();
  }

  // Mock weather data fallback
  private getMockWeatherForTrip(
    stops: Array<{ name: string; lat?: number; lng?: number }>,
    startDate?: Date,
    endDate?: Date
  ): TripWeatherResponse {
    const weatherConditions = [
      "Sunny",
      "Partly Cloudy",
      "Cloudy",
      "Light Rain",
      "Clear",
    ];
    const weatherIcons = ["sunny", "partly-cloudy", "cloudy", "rainy", "sunny"];

    const forecasts: WeatherForecast[] = [];
    const tripDays =
      endDate && startDate
        ? Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 7;

    stops.forEach((stop, stopIndex) => {
      for (let day = 0; day < Math.min(tripDays, 7); day++) {
        const date = new Date();
        if (startDate) {
          date.setTime(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        } else {
          date.setDate(date.getDate() + day);
        }

        const conditionIndex = (stopIndex + day) % weatherConditions.length;
        const baseTemp = 20 + stopIndex * 3 + Math.random() * 10;

        forecasts.push({
          id: `${stop.name}-${date.toISOString().split("T")[0]}`,
          locationName: stop.name,
          date: date.toISOString().split("T")[0],
          temperature: {
            high: Math.round(baseTemp + 5),
            low: Math.round(baseTemp - 5),
            current: Math.round(baseTemp),
          },
          condition: weatherConditions[conditionIndex],
          description: `${weatherConditions[conditionIndex]} weather expected in ${stop.name}`,
          humidity: 50 + Math.round(Math.random() * 30),
          windSpeed: 5 + Math.round(Math.random() * 15),
          precipitation: Math.round(Math.random() * 40),
          icon: weatherIcons[conditionIndex],
          lat: stop.lat,
          lng: stop.lng,
        });
      }
    });

    const averageTemp =
      forecasts.reduce((sum, f) => sum + f.temperature.current, 0) /
      forecasts.length;
    const dominantCondition =
      weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    return {
      forecasts,
      tripDuration: tripDays,
      averageTemp: Math.round(averageTemp),
      dominantCondition,
    };
  }
}

export const openaiService = new OpenAIService();
