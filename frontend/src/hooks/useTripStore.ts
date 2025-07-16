import { useState, useCallback, useEffect } from 'react';
import { Trip, Stop, Recommendation, WeatherForecast } from '../types/trip';
import { apiService } from '../services/api';

interface TripStore {
  currentTrip: Trip | null;
  recommendations: Recommendation[];
  weatherForecasts: WeatherForecast[];
  isLoading: boolean;
  error: string | null;
}

const initialTrip: Trip = {
  id: 'default-trip',
  name: 'My Road Trip',
  stops: [
    {
      id: '1',
      name: 'Starting Point',
      address: '123 Main St, Anytown, USA',
      type: 'start',
      departureTime: '9:00 AM',
      lat: 40.7128,
      lng: -74.006,
    },
  ],
  routeType: 'fastest',
  totalDistance: 0,
  totalTime: 0,
  estimatedFuelCost: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useTripStore = () => {
  const [store, setStore] = useState<TripStore>({
    currentTrip: initialTrip,
    recommendations: [],
    weatherForecasts: [],
    isLoading: false,
    error: null,
  });

  // Add a new stop to the trip
  const addStop = useCallback((stop: Omit<Stop, 'id'>) => {
    setStore(prev => {
      if (!prev.currentTrip) return prev;
      
      const newStop: Stop = {
        ...stop,
        id: `stop-${Date.now()}`,
      };
      
      const updatedTrip = {
        ...prev.currentTrip,
        stops: [...prev.currentTrip.stops, newStop],
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        currentTrip: updatedTrip,
      };
    });
  }, []);

  // Remove a stop from the trip
  const removeStop = useCallback((stopId: string) => {
    setStore(prev => {
      if (!prev.currentTrip) return prev;
      
      const updatedTrip = {
        ...prev.currentTrip,
        stops: prev.currentTrip.stops.filter(stop => stop.id !== stopId),
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        currentTrip: updatedTrip,
      };
    });
  }, []);

  // Reorder stops
  const reorderStops = useCallback((newStops: Stop[]) => {
    setStore(prev => {
      if (!prev.currentTrip) return prev;
      
      const updatedTrip = {
        ...prev.currentTrip,
        stops: newStops,
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        currentTrip: updatedTrip,
      };
    });
  }, []);

  // Update route type
  const updateRouteType = useCallback((routeType: Trip['routeType']) => {
    setStore(prev => {
      if (!prev.currentTrip) return prev;
      
      const updatedTrip = {
        ...prev.currentTrip,
        routeType,
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        currentTrip: updatedTrip,
      };
    });
  }, []);

  // Calculate trip statistics using routing API
  const calculateTripStats = useCallback(async () => {
    setStore(prev => {
      if (!prev.currentTrip || prev.currentTrip.stops.length < 2) return prev;
      
      const waypoints = prev.currentTrip.stops
        .filter(stop => stop.lat && stop.lng)
        .map(stop => ({ lat: stop.lat!, lng: stop.lng! }));
      
      if (waypoints.length < 2) return prev;
      
      // Use API service to calculate route
      apiService.calculateRoute(waypoints).then(routeData => {
        const estimatedFuelCost = (routeData.totalDistance / 25) * 3.5; // 25 mpg, $3.5/gallon
        
        setStore(current => {
          if (!current.currentTrip) return current;
          
          const updatedTrip = {
            ...current.currentTrip,
            totalDistance: routeData.totalDistance,
            totalTime: routeData.totalTime,
            estimatedFuelCost,
            updatedAt: new Date(),
          };
          
          return {
            ...current,
            currentTrip: updatedTrip,
          };
        });
      }).catch(error => {
        console.error('Failed to calculate route:', error);
      });
      
      return prev;
    });
  }, []);

  // Load recommendations for current location
  const loadRecommendations = useCallback(async (lat?: number, lng?: number) => {
    if (!lat || !lng) return;
    
    setStore(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getNearbyRecommendations(lat, lng);
      
      const recommendations: Recommendation[] = response.results.map(place => ({
        id: place.place_id,
        name: place.name,
        type: place.types.includes('restaurant') ? 'restaurant' as const :
              place.types.includes('lodging') ? 'accommodation' as const : 'attraction' as const,
        rating: place.rating,
        distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`, // Mock distance
        duration: place.types.includes('lodging') ? 'Overnight' : 
                 place.types.includes('restaurant') ? '1-2 hrs' : '2-3 hrs',
        description: `Highly rated ${place.name.toLowerCase()} in the area.`,
        imageUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=300&q=80`,
        tags: place.types.slice(0, 3).map(type => 
          type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ),
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        priceLevel: place.price_level,
      }));
      
      setStore(prev => ({
        ...prev,
        recommendations,
        isLoading: false,
      }));
    } catch (error) {
      setStore(prev => ({
        ...prev,
        error: 'Failed to load recommendations',
        isLoading: false,
      }));
    }
  }, []);

  // Load weather forecasts
  const loadWeatherForecasts = useCallback(async () => {
    if (!store.currentTrip?.stops.length) return;
    
    setStore(prev => ({ ...prev, isLoading: true }));
    
    try {
      const weatherPromises = store.currentTrip.stops
        .filter(stop => stop.lat && stop.lng)
        .map(async (stop, index) => {
          const weatherData = await apiService.getWeatherForecast(stop.lat!, stop.lng!);
          return {
            location: stop.name,
            temperature: weatherData.current.temp_f,
            condition: weatherData.current.condition.text,
            icon: weatherData.current.condition.icon,
            humidity: weatherData.current.humidity,
            windSpeed: weatherData.current.wind_mph,
            date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
          };
        });
      
      const weatherForecasts = await Promise.all(weatherPromises);
      
      setStore(prev => ({
        ...prev,
        weatherForecasts,
        isLoading: false,
      }));
    } catch (error) {
      setStore(prev => ({
        ...prev,
        error: 'Failed to load weather data',
        isLoading: false,
      }));
    }
  }, [store.currentTrip?.stops]);

  // Auto-calculate stats when stops change
  useEffect(() => {
    calculateTripStats();
  }, [store.currentTrip?.stops, calculateTripStats]);

  return {
    ...store,
    addStop,
    removeStop,
    reorderStops,
    updateRouteType,
    loadRecommendations,
    loadWeatherForecasts,
    calculateTripStats,
  };
};