import { useState, useCallback } from "react";
import { SearchResult } from "../types/trip";
import { apiService } from "../services/api";
import { geoapifyService } from "../services/geoapify";

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
      // Try Geoapify API first
      const geoapifyResponse = await geoapifyService.searchPlaces(query, {
        limit: 10,
        filter: { country: 'us' }, // You can remove this or make it configurable
      });
      
      // Convert Geoapify results to our SearchResult format
      const searchResults: SearchResult[] = geoapifyResponse.features.map(feature => {
        const converted = geoapifyService.convertToSearchResult(feature);
        return {
          id: converted.id,
          name: converted.name,
          address: converted.address,
          lat: converted.lat,
          lng: converted.lng,
          type: converted.type,
          categories: converted.categories,
        };
      });

      setResults(searchResults);
    } catch (geoapifyError) {
      console.warn('Geoapify search failed, falling back to backend API:', geoapifyError);
      
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
