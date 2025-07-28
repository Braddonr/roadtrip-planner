// Mapbox API service for maps and geocoding
const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoiYnJhZGQ5OCIsImEiOiJjbWRtemU1Nm0xamNlMmlyejZoYTh3dzVtIn0.DeVlSe1eIBvCf_SWVPbanA";
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
      const sizeAbbr = size === 'small' ? 's' : size === 'large' ? 'l' : 'm';
      
      // Ensure label is URL-safe (only alphanumeric characters)
      const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1) || (index + 1).toString();

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
