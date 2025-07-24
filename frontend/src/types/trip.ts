export interface Stop {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  arrivalTime?: string;
  departureTime?: string;
  travelTime?: string;
  travelDistance?: string;
  type?: 'start' | 'destination' | 'waypoint';
}

export interface Trip {
  id: string;
  name: string;
  stops: Stop[];
  routeType: 'fastest' | 'scenic' | 'custom';
  totalDistance: number;
  totalTime: number;
  estimatedFuelCost: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'accommodation';
  rating: number;
  distance: string;
  duration: string;
  description: string;
  imageUrl: string;
  tags: string[];
  lat: number;
  lng: number;
  priceLevel?: number;
  openingHours?: string[];
}

export interface WeatherForecast {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  date: Date;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  rating?: number;
  categories?: string[];
}