// Mapbox API service for maps and geocoding
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MAPBOX_BASE_URL = "https://api.mapbox.com";

export interface MapboxPlace {
  id: string;
  place_name: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
    landmark?: boolean;
    wikidata?: string;
  };
  text: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface MapboxSearchResponse {
  type: string;
  query: string[];
  features: MapboxPlace[];
  attribution: string;
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: string; // encoded polyline
    legs: Array<{
      distance: number; // meters
      duration: number; // seconds
      steps: Array<{
        distance: number;
        duration: number;
        geometry: string;
        instruction: string;
      }>;
    }>;
    distance: number; // meters
    duration: number; // seconds
    weight: number;
    weight_name: string;
  }>;
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

class MapboxService {
  private accessToken = MAPBOX_ACCESS_TOKEN;
  private baseUrl = MAPBOX_BASE_URL;

  constructor() {
    // Debug logging to help identify token issues
    if (!this.accessToken) {
      console.error("❌ Mapbox access token is not defined!");
      console.log("Environment variables:", {
        VITE_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE,
      });
    } else {
      console.log("✅ Mapbox access token loaded successfully");
      console.log("Token preview:", this.accessToken.substring(0, 20) + "...");
    }
  }

  // Search for places using Mapbox Geocoding API
  async searchPlaces(
    query: string,
    options?: {
      limit?: number;
      proximity?: [number, number]; // [longitude, latitude]
      bbox?: [number, number, number, number]; // [minX, minY, maxX, maxY]
      country?: string;
      types?: string[]; // e.g., ['poi', 'address', 'place']
    }
  ): Promise<MapboxSearchResponse> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      limit: (options?.limit || 10).toString(),
      autocomplete: "true",
    });

    // Add proximity bias (prioritize results near a location)
    if (options?.proximity) {
      params.append("proximity", options.proximity.join(","));
    }

    // Add bounding box filter
    if (options?.bbox) {
      params.append("bbox", options.bbox.join(","));
    }

    // Add country filter (default to Kenya)
    const country = options?.country || "ke";
    params.append("country", country);

    // Add place types filter
    if (options?.types && options.types.length > 0) {
      params.append("types", options.types.join(","));
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Mapbox API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Mapbox search error:", error);
      throw error;
    }
  }

  // Reverse geocoding - get place info from coordinates
  async reverseGeocode(
    longitude: number,
    latitude: number
  ): Promise<MapboxSearchResponse> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Mapbox API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Mapbox reverse geocode error:", error);
      throw error;
    }
  }

  // Get directions between waypoints
  async getDirections(
    coordinates: Array<[number, number]>,
    options?: {
      profile?: "driving" | "walking" | "cycling" | "driving-traffic";
      geometries?: "geojson" | "polyline" | "polyline6";
      overview?: "full" | "simplified" | "false";
      steps?: boolean;
      alternatives?: boolean;
      continue_straight?: boolean;
      waypoint_snapping?: string;
      approaches?: string[];
      annotations?: string[];
    }
  ): Promise<MapboxDirectionsResponse> {
    const profile = options?.profile || "driving";
    const coordinatesString = coordinates
      .map((coord) => coord.join(","))
      .join(";");

    const params = new URLSearchParams({
      access_token: this.accessToken,
      geometries: options?.geometries || "polyline",
      overview: options?.overview || "full",
      steps: (options?.steps || false).toString(),
    });

    // Add additional routing parameters
    if (options?.alternatives !== undefined) {
      params.append("alternatives", options.alternatives.toString());
    }

    if (options?.continue_straight !== undefined) {
      params.append("continue_straight", options.continue_straight.toString());
    }

    if (options?.waypoint_snapping) {
      params.append("waypoint_snapping", options.waypoint_snapping);
    }

    if (options?.approaches && options.approaches.length > 0) {
      params.append("approaches", options.approaches.join(";"));
    }

    if (options?.annotations && options.annotations.length > 0) {
      params.append("annotations", options.annotations.join(","));
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coordinatesString}?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Mapbox Directions API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Mapbox directions error:", error);
      throw error;
    }
  }

  // Get static map URL
  getStaticMapUrl(options: {
    center: [number, number]; // [longitude, latitude]
    zoom: number;
    width: number;
    height: number;
    markers?: Array<{
      coordinates: [number, number];
      color?: string;
      size?: "small" | "medium" | "large";
      label?: string;
    }>;
    path?: Array<[number, number]>; // polyline coordinates
    style?:
      | "streets-v11"
      | "outdoors-v11"
      | "light-v10"
      | "dark-v10"
      | "satellite-v9"
      | "satellite-streets-v11";
    retina?: boolean;
  }): string {
    const {
      center,
      zoom,
      width,
      height,
      markers = [],
      path,
      style = "streets-v11",
      retina = false,
    } = options;

    let url = `${this.baseUrl}/styles/v1/mapbox/${style}/static`;

    // Add overlays (markers and paths)
    const overlays = [];

    // Add markers
    markers.forEach((marker, index) => {
      const color = marker.color || "red";
      const size = marker.size || "medium";
      const label = marker.label || (index + 1).toString();

      // Get size abbreviation for Mapbox API
      const sizeAbbr = size === "small" ? "s" : size === "large" ? "l" : "m";

      // Ensure label is URL-safe (only alphanumeric characters)
      const safeLabel =
        label.replace(/[^a-zA-Z0-9]/g, "").substring(0, 1) ||
        (index + 1).toString();

      overlays.push(
        `pin-${sizeAbbr}-${safeLabel}+${color}(${marker.coordinates.join(",")})`
      );
    });

    // Add path if provided
    if (path && path.length > 1) {
      const pathString = path.map((coord) => coord.join(",")).join(",");
      overlays.push(`path-2+blue(${pathString})`);
    }

    // Build URL
    if (overlays.length > 0) {
      url += `/${overlays.join(",")}`;
    }

    url += `/${center.join(",")},${zoom}/${width}x${height}${
      retina ? "@2x" : ""
    }`;
    url += `?access_token=${this.accessToken}`;

    return url;
  }

  // Convert Mapbox place to our SearchResult format
  convertToSearchResult(feature: MapboxPlace) {
    const [lng, lat] = feature.center;

    return {
      id: feature.id,
      name: feature.text,
      address: feature.place_name,
      lat,
      lng,
      type: feature.place_type[0] || "place",
      categories: feature.place_type,
      relevance: feature.relevance,
    };
  }

  // Get weather data for a location (using OpenWeatherMap API as Mapbox doesn't have weather)
  async getWeatherForLocation(
    latitude: number,
    longitude: number,
    locationName?: string
  ): Promise<{
    location: string;
    temperature: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    date: Date;
  }> {
    // Note: You'll need to add OpenWeatherMap API key to your environment
    const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!OPENWEATHER_API_KEY) {
      // Return mock data if no API key is provided
      return {
        location:
          locationName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        temperature: 25 + Math.random() * 10,
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"][
          Math.floor(Math.random() * 4)
        ],
        icon: "sun",
        humidity: 60 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 10,
        date: new Date(),
      };
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        location:
          locationName ||
          data.name ||
          `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        date: new Date(),
      };
    } catch (error) {
      console.error("Weather API error:", error);
      // Return mock data as fallback
      return {
        location:
          locationName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        temperature: 25,
        condition: "Unknown",
        icon: "sun",
        humidity: 65,
        windSpeed: 8,
        date: new Date(),
      };
    }
  }

  // Search for Points of Interest (restaurants, attractions, accommodations) near a location
  async searchPOI(
    latitude: number,
    longitude: number,
    type: "restaurant" | "attraction" | "accommodation",
    options?: {
      radius?: number; // in meters, default 5000
      limit?: number; // default 10
    }
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: "restaurant" | "attraction" | "accommodation";
      rating?: number;
      distance: string;
      duration: string;
      description: string;
      imageUrl: string;
      tags: string[];
      lat: number;
      lng: number;
      priceLevel?: number;
      openingHours?: string[];
      address: string;
    }>
  > {
    const radius = options?.radius || 5000; // 5km default
    const limit = options?.limit || 10;

    // Map our types to Mapbox POI categories
    const categoryMap = {
      restaurant: ["restaurant", "food_and_drink", "cafe"],
      attraction: ["tourist_attraction", "museum", "park", "entertainment"],
      accommodation: ["accommodation", "hotel", "lodging"],
    };

    const categories = categoryMap[type];

    try {
      // Use Mapbox Places API to search for POIs
      const bbox = this.calculateBoundingBox(latitude, longitude, radius);

      const results = [];

      // Search for each category
      for (const category of categories) {
        try {
          const searchResponse = await this.searchPlaces("", {
            limit: Math.ceil(limit / categories.length),
            bbox,
            types: [category],
            proximity: [longitude, latitude],
          });

          if (searchResponse.features) {
            for (const feature of searchResponse.features) {
              const [lng, lat] = feature.center;
              const distance = this.calculateDistance(
                latitude,
                longitude,
                lat,
                lng
              );

              if (distance <= radius) {
                results.push({
                  id: feature.id,
                  name: feature.text,
                  type,
                  rating: 4 + Math.random(), // Mock rating, you'd get this from a reviews API
                  distance:
                    distance < 1000
                      ? `${Math.round(distance)}m`
                      : `${(distance / 1000).toFixed(1)}km`,
                  duration: `${Math.round(distance / 83)}min`, // Walking speed ~5km/h = 83m/min
                  description:
                    feature.properties?.category ||
                    `${type} in ${feature.context?.[0]?.text || "the area"}`,
                  imageUrl: `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                    feature.text
                  )}`, // Mock image
                  tags: feature.place_type || [],
                  lat,
                  lng,
                  priceLevel: Math.floor(Math.random() * 4) + 1, // Mock price level 1-4
                  openingHours: ["9:00 AM - 10:00 PM"], // Mock hours
                  address: feature.place_name,
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to search for ${category}:`, error);
        }
      }

      // Sort by distance and limit results
      return results
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, limit);
    } catch (error) {
      console.error("POI search error:", error);
      // Return mock data as fallback
      return this.generateMockPOI(latitude, longitude, type, limit);
    }
  }

  // Helper function to calculate bounding box for a radius
  private calculateBoundingBox(
    lat: number,
    lng: number,
    radiusMeters: number
  ): [number, number, number, number] {
    const radiusDegrees = radiusMeters / 111320; // Rough conversion: 1 degree ≈ 111.32 km
    return [
      lng - radiusDegrees, // minX
      lat - radiusDegrees, // minY
      lng + radiusDegrees, // maxX
      lat + radiusDegrees, // maxY
    ];
  }

  // Helper function to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Generate mock POI data as fallback
  private generateMockPOI(
    lat: number,
    lng: number,
    type: "restaurant" | "attraction" | "accommodation",
    limit: number
  ) {
    const mockData = {
      restaurant: [
        "Local Bistro",
        "Pizza Corner",
        "Sushi House",
        "Coffee Shop",
        "Street Food Market",
        "Fine Dining",
        "Burger Joint",
        "Vegetarian Delight",
        "Seafood Restaurant",
        "BBQ Grill",
      ],
      attraction: [
        "City Museum",
        "Historic Monument",
        "Art Gallery",
        "Central Park",
        "Observation Deck",
        "Cultural Center",
        "Zoo",
        "Botanical Garden",
        "Theater",
        "Shopping District",
      ],
      accommodation: [
        "Grand Hotel",
        "Budget Inn",
        "Boutique Lodge",
        "Hostel",
        "Resort",
        "Business Hotel",
        "Bed & Breakfast",
        "Apartment Hotel",
        "Luxury Suite",
        "Motel",
      ],
    };

    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `mock-${type}-${i}`,
      name: mockData[type][i % mockData[type].length],
      type,
      rating: 3.5 + Math.random() * 1.5,
      distance: `${(Math.random() * 2 + 0.1).toFixed(1)}km`,
      duration: `${Math.round(Math.random() * 20 + 5)}min`,
      description: `Popular ${type} in the area`,
      imageUrl: `https://via.placeholder.com/300x200?text=${encodeURIComponent(
        mockData[type][i % mockData[type].length]
      )}`,
      tags: [type, "popular", "nearby"],
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
      priceLevel: Math.floor(Math.random() * 4) + 1,
      openingHours: ["9:00 AM - 10:00 PM"],
      address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
    }));
  }

  // Calculate total trip distance and time from directions
  async calculateTripMetrics(
    coordinates: Array<[number, number]>,
    routeType: "fastest" | "scenic" | "custom" = "fastest"
  ): Promise<{
    totalDistance: number; // meters
    totalTime: number; // seconds
    estimatedFuelCost: number; // USD
    legs: Array<{
      distance: number;
      duration: number;
      startPoint: [number, number];
      endPoint: [number, number];
    }>;
  }> {
    try {
      const directions = await this.getDirections(coordinates, {
        profile: routeType === "fastest" ? "driving" : "driving",
        steps: true,
      });

      if (!directions.routes || directions.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = directions.routes[0];
      const totalDistance = route.distance; // meters
      const totalTime = route.duration; // seconds

      // Calculate estimated fuel cost
      // Assumptions: 10km per liter, $1.5 per liter (adjust based on your region)
      const fuelEfficiency = 10; // km per liter
      const fuelPrice = 1.5; // USD per liter
      const estimatedFuelCost =
        (totalDistance / 1000 / fuelEfficiency) * fuelPrice;

      // Extract leg information
      const legs = route.legs.map((leg, index) => ({
        distance: leg.distance,
        duration: leg.duration,
        startPoint: coordinates[index],
        endPoint: coordinates[index + 1],
      }));

      return {
        totalDistance,
        totalTime,
        estimatedFuelCost,
        legs,
      };
    } catch (error) {
      console.error("Error calculating trip metrics:", error);
      throw error;
    }
  }

  // Decode polyline (for route geometry)
  decodePolyline(encoded: string): Array<[number, number]> {
    // Simple polyline decoder - you might want to use a library like @mapbox/polyline
    const coordinates: Array<[number, number]> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push([lng * 1e-5, lat * 1e-5]);
    }

    return coordinates;
  }
}

export const mapboxService = new MapboxService();
