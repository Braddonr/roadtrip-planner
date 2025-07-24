import { useState, useCallback, useEffect } from "react";
import { Trip, Stop, Recommendation, WeatherForecast } from "../types/trip";
import { apiService } from "../services/api";

interface TripStore {
  currentTrip: Trip | null;
  allTrips: Trip[];
  recommendations: Recommendation[];
  weatherForecasts: WeatherForecast[];
  isLoading: boolean;
  error: string | null;
}

export const useTripStore = () => {
  const [store, setStore] = useState<TripStore>({
    currentTrip: null,
    allTrips: [],
    recommendations: [],
    weatherForecasts: [],
    isLoading: false,
    error: null,
  });

  // Load all trips from backend
  const loadTrips = useCallback(async () => {
    setStore((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getTrips();
      const trips = response.results || response;
      console.log("This are the trips we have:", trips);
      

      // Ensure all trips have stops arrays initialized
      const tripsWithStops = trips.map((trip: any) => ({
        ...trip,
        stops: trip.stops || [], // Initialize empty stops array if not present
      }));

      setStore((prev) => ({
        ...prev,
        allTrips: tripsWithStops,
        currentTrip: tripsWithStops.length > 0 ? tripsWithStops[0] : null, // Set first trip as current
        isLoading: false,
      }));
    } catch (error: any) {
      setStore((prev) => ({
        ...prev,
        error: error.message || "Failed to load trips",
        isLoading: false,
      }));
    }
  }, []);

  // Create a new trip
  const createTrip = useCallback(
    async (tripData: {
      name: string;
      description?: string;
      route_type?: string;
    }) => {
      setStore((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const newTrip = await apiService.createTrip(tripData);

        // Ensure the trip has a stops array initialized
        const tripWithStops = {
          ...newTrip,
          stops: newTrip.stops || [], // Initialize empty stops array if not present
        };

        setStore((prev) => ({
          ...prev,
          allTrips: [tripWithStops, ...prev.allTrips],
          currentTrip: tripWithStops, // Set new trip as current
          isLoading: false,
        }));

        return tripWithStops;
      } catch (error: any) {
        setStore((prev) => ({
          ...prev,
          error: error.message || "Failed to create trip",
          isLoading: false,
        }));
        throw error;
      }
    },
    []
  );

  // Set current trip
  const setCurrentTrip = useCallback((trip: Trip) => {
    setStore((prev) => ({
      ...prev,
      currentTrip: trip,
    }));
  }, []);

  // Add a new stop to the trip
  const addStop = useCallback(
    async (stop: Omit<Stop, "id">) => {
      if (!store.currentTrip) return;

      setStore((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const newStop = await apiService.addStopToTrip(
          parseInt(store.currentTrip.id),
          {
            name: stop.name,
            address: stop.address,
            latitude: stop.lat || 0,
            longitude: stop.lng || 0,
            stop_type: stop.type || "waypoint",
          }
        );

        // Update local state with the new stop from backend
        setStore((prev) => {
          if (!prev.currentTrip) return prev;

          const currentStops = prev.currentTrip.stops || [];
          const updatedTrip = {
            ...prev.currentTrip,
            stops: [
              ...currentStops,
              {
                id: newStop.id.toString(),
                name: newStop.name,
                address: newStop.address,
                lat: newStop.latitude,
                lng: newStop.longitude,
                type: newStop.stop_type as any,
                order: newStop.order,
              },
            ],
            updatedAt: new Date(),
          };

          return {
            ...prev,
            currentTrip: updatedTrip,
            isLoading: false,
          };
        });
      } catch (error: any) {
        setStore((prev) => ({
          ...prev,
          error: error.message || "Failed to add stop",
          isLoading: false,
        }));
      }
    },
    [store.currentTrip]
  );

  // Remove a stop from the trip
  const removeStop = useCallback(
    async (stopId: string) => {
      if (!store.currentTrip) return;

      setStore((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await apiService.removeStopFromTrip(
          parseInt(store.currentTrip.id),
          parseInt(stopId)
        );

        // Update local state
        setStore((prev) => {
          if (!prev.currentTrip) return prev;

          const currentStops = prev.currentTrip.stops || [];
          const updatedTrip = {
            ...prev.currentTrip,
            stops: currentStops.filter((stop) => stop.id !== stopId),
            updatedAt: new Date(),
          };

          return {
            ...prev,
            currentTrip: updatedTrip,
            isLoading: false,
          };
        });
      } catch (error: any) {
        setStore((prev) => ({
          ...prev,
          error: error.message || "Failed to remove stop",
          isLoading: false,
        }));
      }
    },
    [store.currentTrip]
  );

  // Reorder stops
  const reorderStops = useCallback(
    async (newStops: Stop[]) => {
      if (!store.currentTrip) return;

      setStore((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Create the stop orders array for the backend
        const stopOrders = newStops.map((stop, index) => ({
          id: parseInt(stop.id),
          order: index + 1,
        }));

        await apiService.reorderStops(
          parseInt(store.currentTrip.id),
          stopOrders
        );

        // Update local state
        setStore((prev) => {
          if (!prev.currentTrip) return prev;

          const updatedTrip = {
            ...prev.currentTrip,
            stops: newStops,
            updatedAt: new Date(),
          };

          return {
            ...prev,
            currentTrip: updatedTrip,
            isLoading: false,
          };
        });
      } catch (error: any) {
        setStore((prev) => ({
          ...prev,
          error: error.message || "Failed to reorder stops",
          isLoading: false,
        }));
      }
    },
    [store.currentTrip]
  );

  // Update route type
  const updateRouteType = useCallback((routeType: Trip["routeType"]) => {
    setStore((prev) => {
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
    setStore((prev) => {
      if (
        !prev.currentTrip ||
        !prev.currentTrip.stops ||
        prev.currentTrip.stops.length < 2
      )
        return prev;

      const waypoints = prev.currentTrip.stops
        .filter((stop) => stop.lat && stop.lng)
        .map((stop) => ({ lat: stop.lat!, lng: stop.lng! }));

      if (waypoints.length < 2) return prev;

      // Use API service to calculate route
      apiService
        .calculateRoute(waypoints)
        .then((routeData) => {
          const estimatedFuelCost = (routeData.totalDistance / 25) * 3.5; // 25 mpg, $3.5/gallon

          setStore((current) => {
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
        })
        .catch((error) => {
          console.error("Failed to calculate route:", error);
        });

      return prev;
    });
  }, []);

  // Load recommendations for current location
  const loadRecommendations = useCallback(
    async (lat?: number, lng?: number) => {
      if (!lat || !lng) return;

      setStore((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await apiService.getNearbyRecommendations(lat, lng);

        const recommendations: Recommendation[] = response.results.map(
          (place) => ({
            id: place.place_id,
            name: place.name,
            type: place.types.includes("restaurant")
              ? ("restaurant" as const)
              : place.types.includes("lodging")
              ? ("accommodation" as const)
              : ("attraction" as const),
            rating: place.rating,
            distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`, // Mock distance
            duration: place.types.includes("lodging")
              ? "Overnight"
              : place.types.includes("restaurant")
              ? "1-2 hrs"
              : "2-3 hrs",
            description: `Highly rated ${place.name.toLowerCase()} in the area.`,
            imageUrl: `https://images.unsplash.com/photo-${
              1500000000000 + Math.floor(Math.random() * 100000000)
            }?w=300&q=80`,
            tags: place.types
              .slice(0, 3)
              .map((type) =>
                type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
              ),
            lat: place.latitude || place.geometry?.location?.lat || 0,
            lng: place.longitude || place.geometry?.location?.lng || 0,
            priceLevel: place.price_level,
          })
        );

        setStore((prev) => ({
          ...prev,
          recommendations,
          isLoading: false,
        }));
      } catch (error) {
        setStore((prev) => ({
          ...prev,
          error: "Failed to load recommendations",
          isLoading: false,
        }));
      }
    },
    []
  );

  // Load weather forecasts
  const loadWeatherForecasts = useCallback(async () => {
    if (!store.currentTrip?.stops || !store.currentTrip.stops.length) return;

    setStore((prev) => ({ ...prev, isLoading: true }));

    try {
      const weatherPromises = store.currentTrip.stops
        .filter((stop) => stop.lat && stop.lng)
        .map(async (stop, index) => {
          const weatherData = await apiService.getWeatherForecast(
            stop.lat!,
            stop.lng!
          );
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

      setStore((prev) => ({
        ...prev,
        weatherForecasts,
        isLoading: false,
      }));
    } catch (error) {
      setStore((prev) => ({
        ...prev,
        error: "Failed to load weather data",
        isLoading: false,
      }));
    }
  }, [store.currentTrip?.stops]);

  // Auto-calculate stats when stops change
  useEffect(() => {
    if (store.currentTrip?.stops && store.currentTrip.stops.length >= 2) {
      calculateTripStats();
    }
  }, [store.currentTrip?.stops?.length, calculateTripStats]);

  return {
    ...store,
    loadTrips,
    createTrip,
    setCurrentTrip,
    addStop,
    removeStop,
    reorderStops,
    updateRouteType,
    loadRecommendations,
    loadWeatherForecasts,
    calculateTripStats,
  };
};
