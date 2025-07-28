import React, { useState, useEffect, useRef } from "react";
import {
  MapIcon,
  Navigation,
  Layers,
  Plus,
  Minus,
  LocateFixed,
  Route,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchResult } from "@/types/trip";
import { mapboxService } from "@/services/mapbox";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface RouteType {
  id: string;
  name: string;
  description: string;
}

interface InteractiveMapProps {
  waypoints?: Waypoint[];
  selectedRouteType?: string;
  searchResults?: SearchResult[];
  focusedLocation?: { lat: number; lng: number; name: string } | null;
  onWaypointDrag?: (waypointId: string, newLat: number, newLng: number) => void;
  onRouteTypeChange?: (routeType: string) => void;
  onSearchResultClick?: (result: SearchResult) => void;
  onClearFocus?: () => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  waypoints = [
    { id: "1", name: "Starting Point", lat: 40.7128, lng: -74.006 },
    { id: "2", name: "Destination", lat: 34.0522, lng: -118.2437 },
  ],
  selectedRouteType = "fastest",
  searchResults = [],
  focusedLocation = null,
  onWaypointDrag = () => {},
  onRouteTypeChange = () => {},
  onSearchResultClick = () => {},
  onClearFocus = () => {},
}) => {
  const [zoom, setZoom] = useState(5);
  const [mapType, setMapType] = useState("streets-v11");
  const [mapCenter, setMapCenter] = useState({ lat: -1.2921, lng: 36.8219 }); // Center of Kenya (Nairobi)
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [routePath, setRoutePath] = useState<Array<[number, number]>>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  const routeTypes: RouteType[] = [
    {
      id: "fastest",
      name: "Fastest",
      description: "Optimized for shortest travel time",
    },
    {
      id: "scenic",
      name: "Scenic",
      description: "Prioritizes scenic routes and attractions",
    },
    { id: "custom", name: "Custom", description: "Manually adjusted route" },
  ];

  // Update map center when focused location changes
  useEffect(() => {
    if (focusedLocation) {
      // Focus on the clicked search result
      setMapCenter({ lat: focusedLocation.lat, lng: focusedLocation.lng });
      setZoom(15); // Zoom in closer for focused location
      setIsMapLoading(true);
    } else if (searchResults.length > 0) {
      // Center map on first search result
      const firstResult = searchResults[0];
      setMapCenter({ lat: firstResult.lat, lng: firstResult.lng });
      setZoom(12); // Zoom in when showing search results
    } else if (waypoints.length > 0) {
      // Center map on waypoints
      const avgLat =
        waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length;
      const avgLng =
        waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [focusedLocation, searchResults, waypoints]);

  // Calculate route when waypoints change
  useEffect(() => {
    const calculateRoute = async () => {
      if (waypoints.length >= 2) {
        try {
          const coordinates: Array<[number, number]> = waypoints.map((wp) => [
            wp.lng,
            wp.lat,
          ]);
          const directions = await mapboxService.getDirections(coordinates, {
            profile:
              selectedRouteType === "fastest"
                ? "driving"
                : selectedRouteType === "scenic"
                ? "driving"
                : "driving",
            geometries: "polyline",
            overview: "full",
          });

          if (directions.routes && directions.routes.length > 0) {
            const route = directions.routes[0];
            const decodedPath = mapboxService.decodePolyline(route.geometry);
            setRoutePath(decodedPath);
          }
        } catch (error) {
          console.error("Failed to calculate route:", error);
          setRoutePath([]);
        }
      } else {
        setRoutePath([]);
      }
    };

    calculateRoute();
  }, [waypoints, selectedRouteType]);

  // Generate static map URL with markers
  const getMapUrl = () => {
    try {
      const markers = [];

      // Add waypoint markers (blue)
      waypoints.forEach((waypoint, index) => {
        if (waypoint.lat && waypoint.lng) {
          markers.push({
            coordinates: [waypoint.lng, waypoint.lat] as [number, number], // Mapbox uses [lng, lat]
            color: "blue",
            size: "medium" as const,
            label: (index + 1).toString(),
          });
        }
      });

      // Add search result markers (red)
      searchResults.forEach((result, index) => {
        if (result.lat && result.lng) {
          markers.push({
            coordinates: [result.lng, result.lat] as [number, number], // Mapbox uses [lng, lat]
            color: "red",
            size: "medium" as const,
            label: String.fromCharCode(65 + index), // A, B, C, etc.
          });
        }
      });

      // Add focused location marker (green, larger)
      if (focusedLocation && focusedLocation.lat && focusedLocation.lng) {
        markers.push({
          coordinates: [focusedLocation.lng, focusedLocation.lat] as [
            number,
            number
          ],
          color: "green",
          size: "large" as const,
          label: "F", // F for Focused
        });
      }

      // First try a simple map without markers to test basic functionality
      const simpleMapUrl = mapboxService.getStaticMapUrl({
        center: [mapCenter.lng, mapCenter.lat], // Mapbox uses [lng, lat]
        zoom,
        width: 800,
        height: 600,
        markers: [], // No markers for testing
        style: mapType as any,
      });

      console.log("Simple map URL (no markers):", simpleMapUrl);

      // Now try with markers
      const mapUrl = mapboxService.getStaticMapUrl({
        center: [mapCenter.lng, mapCenter.lat], // Mapbox uses [lng, lat]
        zoom,
        width: 800,
        height: 600,
        markers,
        path: routePath.length > 0 ? routePath : undefined, // Include route path if available
        style: mapType as any,
      });

      console.log("Generated map URL:", mapUrl);
      console.log("Map center:", mapCenter);
      console.log("Zoom:", zoom);
      console.log("Markers:", markers);
      console.log("Focused location:", focusedLocation);

      // Test if we have a valid URL
      if (!simpleMapUrl || simpleMapUrl === "") {
        console.error("Generated empty map URL");
        return "";
      }

      // Ensure coordinates are valid
      const validLng = isNaN(mapCenter.lng) ? 36.8219 : mapCenter.lng; // Default to Nairobi
      const validLat = isNaN(mapCenter.lat) ? -1.2921 : mapCenter.lat; // Default to Nairobi
      const validZoom = isNaN(zoom) || zoom < 1 ? 10 : Math.min(zoom, 20);

      // Let's test with a very basic Mapbox URL first
      const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${validLng},${validLat},${validZoom}/800x600?access_token=pk.eyJ1IjoiYnJhZGQ5OCIsImEiOiJjbWRtemU1Nm0xamNlMmlyejZoYTh3dzVtIn0.DeVlSe1eIBvCf_SWVPbanA`;

      console.log("Test basic URL:", testUrl);
      console.log("Map center (valid):", { lat: validLat, lng: validLng });
      console.log("Zoom (valid):", validZoom);
      console.log("Service generated URL:", simpleMapUrl);

      // For now, let's always use the simple test URL to ensure basic functionality works
      console.log("Using simple test URL for debugging");
      console.log("Markers available:", markers.length);

      // If we have a focused location, center on it (without marker for now to avoid API issues)
      if (focusedLocation) {
        const focusedUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapType}/static/${focusedLocation.lng},${focusedLocation.lat},${validZoom}/800x600?access_token=pk.eyJ1IjoiYnJhZGQ5OCIsImEiOiJjbWRtemU1Nm0xamNlMmlyejZoYTh3dzVtIn0.DeVlSe1eIBvCf_SWVPbanA`;
        console.log(
          "Using focused location URL (centered without marker):",
          focusedUrl
        );
        return focusedUrl;
      }

      // Otherwise use the simple test URL
      return testUrl;
    } catch (error) {
      console.error("Error generating map URL:", error);
      // Return a fallback URL or empty string
      return "";
    }
  };

  const handleZoomIn = () => {
    setIsMapLoading(true);
    setZoom(Math.min(zoom + 1, 20));
  };

  const handleZoomOut = () => {
    setIsMapLoading(true);
    setZoom(Math.max(zoom - 1, 1));
  };

  const handleMapTypeChange = (newType: string) => {
    setIsMapLoading(true);
    setMapType(newType);
  };

  return (
    <Card className="w-full h-full bg-background border rounded-lg overflow-hidden">
      <div className="relative w-full h-[600px] bg-slate-100">
        {/* Mapbox Static Map */}
        <div className="absolute inset-0">
          <img
            src={getMapUrl()}
            alt="Interactive Map"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log("Map image loaded successfully");
              setIsMapLoading(false);
            }}
            onError={(e) => {
              console.error("Map image failed to load");
              console.error("Failed URL:", getMapUrl());
              setIsMapLoading(false);
              // Fallback to placeholder if map fails to load
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />

          {/* Loading overlay */}
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-600">Loading map...</p>
              </div>
            </div>
          )}

          {/* Fallback placeholder */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-slate-200"
            style={{ display: "none" }}
          >
            <div className="text-center">
              <MapIcon className="h-16 w-16 mx-auto text-slate-400" />
              <p className="mt-2 text-slate-500">Map Loading...</p>
              <p className="text-sm text-slate-400">Zoom: {zoom}</p>
              <p className="text-sm text-slate-400">
                Waypoints: {waypoints.length}
              </p>
              <p className="text-sm text-slate-400">
                Search Results: {searchResults.length}
              </p>
            </div>
          </div>
        </div>

        {/* Focused Location Indicator */}
        {focusedLocation && (
          <div className="absolute top-4 left-4 max-w-xs">
            <Card className="bg-green-50/95 backdrop-blur-sm border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center text-green-800">
                    <MapPin className="h-4 w-4 mr-1 text-green-600" />
                    Focused Location
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                    onClick={() => {
                      console.log("Clear focus clicked");
                      onClearFocus();
                    }}
                  >
                    ✕
                  </Button>
                </div>
                <div className="text-xs">
                  <p className="font-medium text-green-800">
                    {focusedLocation.name}
                  </p>
                  <p className="text-green-600">
                    {focusedLocation.lat.toFixed(4)},{" "}
                    {focusedLocation.lng.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Results Overlay */}
        {searchResults.length > 0 && !focusedLocation && (
          <div className="absolute top-4 left-4 max-w-xs">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.slice(0, 5).map((result, index) => (
                    <div
                      key={result.id}
                      className="text-xs p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                      onClick={() => {
                        console.log("Search result clicked:", result.name);
                        onSearchResultClick(result);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{result.name}</p>
                          <p className="text-muted-foreground truncate">
                            {result.address}
                          </p>
                          {result.categories &&
                            result.categories.length > 0 && (
                              <p className="text-muted-foreground text-xs">
                                {result.categories.slice(0, 2).join(", ")}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{searchResults.length - 5} more results
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                  <Minus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          setMapCenter({ lat: latitude, lng: longitude });
                          setZoom(15);
                        },
                        (error) => {
                          console.error("Geolocation error:", error);
                          alert(
                            "Unable to get your location. Please check your browser permissions."
                          );
                        }
                      );
                    } else {
                      alert("Geolocation is not supported by this browser.");
                    }
                  }}
                >
                  <LocateFixed className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>My Location</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    // Cycle through Mapbox map styles
                    const styles = [
                      "streets-v11",
                      "outdoors-v11",
                      "light-v10",
                      "dark-v10",
                      "satellite-v9",
                      "satellite-streets-v11",
                    ];
                    const currentIndex = styles.indexOf(mapType);
                    const nextIndex = (currentIndex + 1) % styles.length;
                    handleMapTypeChange(styles[nextIndex]);
                  }}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Map Style: {mapType}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Route Type Selector */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card>
            <CardContent className="p-4">
              <Tabs
                defaultValue={selectedRouteType}
                onValueChange={onRouteTypeChange}
              >
                <TabsList className="w-full">
                  {routeTypes.map((route) => (
                    <TabsTrigger
                      key={route.id}
                      value={route.id}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        <span>{route.name}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {routeTypes.map((route) => (
                  <TabsContent key={route.id} value={route.id}>
                    <p className="text-sm text-muted-foreground">
                      {route.description}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Waypoint indicators would be rendered here based on map coordinates */}
      </div>
    </Card>
  );
};

export default InteractiveMap;
