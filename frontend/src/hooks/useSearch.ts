import { useState, useCallback } from "react";
import { SearchResult } from "../types/trip";
import { apiService } from "../services/api";

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
      const response = await apiService.searchPlaces(query);
      
      // Handle both backend API format and fallback mock format
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
    } catch (err) {
      setError("Failed to search places");
      setResults([]);
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
