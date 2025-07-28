import { useState, useCallback } from "react";
import { SearchResult } from "../types/trip";
import { apiService } from "../services/api";
import { mapboxService } from "../services/mapbox";

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try Mapbox API first
      const mapboxResponse = await mapboxService.searchPlaces(query, {
        limit: 10,
        country: 'ke', // Default to Kenya for more accurate local results
        types: ['poi', 'address', 'place'], // Include points of interest, addresses, and places
      });
      
      // Convert Mapbox results to our SearchResult format
      const searchResults: SearchResult[] = mapboxResponse.features.map(feature => {
        const converted = mapboxService.convertToSearchResult(feature);
        return {
          id: converted.id,
          name: converted.name,
          address: converted.address,
          lat: converted.lat,
          lng: converted.lng,
          type: converted.type,
          categories: converted.categories,
          relevance: converted.relevance,
        };
      });

      setResults(searchResults);
    } catch (mapboxError) {
      console.warn('Mapbox search failed, falling back to backend API:', mapboxError);
      
      // Fallback to backend API if Geoapify fails
      try {
        const response = await apiService.searchPlaces(query);
        
        // Handle backend API format
        const searchResults: SearchResult[] = response.results.map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.address || place.formatted_address,
          lat: place.latitude || place.geometry?.location?.lat,
          lng: place.longitude || place.geometry?.location?.lng,
          type: place.types?.[0] || "establishment",
          rating: place.rating,
        }));

        setResults(searchResults);
      } catch (backendError) {
        console.error('Both Geoapify and backend search failed:', backendError);
        setError("Failed to search places");
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    searchPlaces,
    clearResults,
  };
};
