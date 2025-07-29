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
import { SearchResult, Trip } from "@/types/trip";
import { mapboxService } from "@/services/mapbox";
import { TripCreationModal } from "./TripCreationModal";

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
  onAddMarker?: (marker: {
    lat: number;
    lng: number;
    name: string;
    type: "start" | "stop" | "destination";
  }) => void;
  onCreateTrip?: (trip: Omit<Trip, "id" | "createdAt" | "updatedAt">) => void;
  // New props for enhanced functionality
  initialMarkers?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: "start" | "stop" | "destination";
  }>;
  onMarkersChange?: (
    markers: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      type: "start" | "stop" | "destination";
    }>
  ) => void;
  // New props for editing trips
  editingTrip?: any;
  onEditComplete?: () => void;
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
  onAddMarker = () => {},
  onCreateTrip = () => {},
  initialMarkers = [],
  onMarkersChange = () => {},
  editingTrip,
  onEditComplete = () => {},
}) => {
  const [zoom, setZoom] = useState(5);
  const [mapType, setMapType] = useState("streets-v11");
  const [mapCenter, setMapCenter] = useState({ lat: -1.2921, lng: 36.8219 }); // Center of Kenya (Nairobi)
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [routePath, setRoutePath] = useState<Array<[number, number]>>([]);
  const [clickedMarkers, setClickedMarkers] = useState<
    Array<{
      id: string;
      lat: number;
      lng: number;
      name?: string;
      type: "start" | "stop" | "destination";
    }>
  >([]);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Handle editing trip - open modal when editingTrip prop changes
  useEffect(() => {
    if (editingTrip) {
      console.log("InteractiveMap: Opening TripCreationModal for editing:", editingTrip.name);
      setIsTripModalOpen(true);
    }
  }, [editingTrip]);

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

  // Calculate route when waypoints or clicked markers change
  useEffect(() => {
    const calculateRoute = async () => {
      // Use clicked markers if available, otherwise use waypoints
      const pointsToRoute =
        clickedMarkers.length >= 2 ? clickedMarkers : waypoints;

      if (pointsToRoute.length >= 2) {
        try {
          const coordinates: Array<[number, number]> = pointsToRoute.map(
            (point) => [point.lng, point.lat]
          );

          // Configure routing based on selected route type
          let routingOptions: any = {
            geometries: "polyline",
            overview: "full",
            steps: true,
          };

          switch (selectedRouteType) {
            case "fastest":
              // Use driving-traffic for real-time traffic optimization
              routingOptions.profile = "driving-traffic";
              routingOptions.annotations = ["duration", "distance"];
              break;

            case "scenic":
              // Use regular driving profile with scenic preferences
              routingOptions.profile = "driving";
              routingOptions.alternatives = true; // Get alternative routes
              routingOptions.continue_straight = false; // Allow turns for scenic routes
              break;

            case "custom":
              // Use driving profile with waypoint optimization disabled
              routingOptions.profile = "driving";
              routingOptions.waypoint_snapping = "any"; // Allow flexible waypoint placement
              routingOptions.approaches = waypoints.map(() => "unrestricted"); // No approach restrictions
              break;

            default:
              routingOptions.profile = "driving";
          }

          console.log(
            `Calculating ${selectedRouteType} route with options:`,
            routingOptions
          );

          const directions = await mapboxService.getDirections(
            coordinates,
            routingOptions
          );

          if (directions.routes && directions.routes.length > 0) {
            let selectedRoute = directions.routes[0];

            // For scenic routes, try to select a longer/more interesting route if alternatives exist
            if (
              selectedRouteType === "scenic" &&
              directions.routes.length > 1
            ) {
              // Select the route that's not the shortest (more likely to be scenic)
              const sortedRoutes = directions.routes.sort(
                (a, b) => b.distance - a.distance
              );
              selectedRoute =
                sortedRoutes[0] !== directions.routes[0]
                  ? sortedRoutes[0]
                  : directions.routes[1];
              console.log(
                `Selected scenic route: ${(
                  selectedRoute.distance / 1000
                ).toFixed(1)}km vs ${(
                  directions.routes[0].distance / 1000
                ).toFixed(1)}km`
              );
            }

            const decodedPath = mapboxService.decodePolyline(
              selectedRoute.geometry
            );
            setRoutePath(decodedPath);
          }
        } catch (error) {
          console.error("Failed to calculate route:", error);
          // Fallback to basic driving route if specialized routing fails
          if (selectedRouteType !== "driving") {
            try {
              const coordinates: Array<[number, number]> = waypoints.map(
                (wp) => [wp.lng, wp.lat]
              );
              const fallbackDirections = await mapboxService.getDirections(
                coordinates,
                {
                  profile: "driving",
                  geometries: "polyline",
                  overview: "full",
                }
              );
              if (
                fallbackDirections.routes &&
                fallbackDirections.routes.length > 0
              ) {
                const route = fallbackDirections.routes[0];
                const decodedPath = mapboxService.decodePolyline(
                  route.geometry
                );
                setRoutePath(decodedPath);
              }
            } catch (fallbackError) {
              console.error(
                "Fallback route calculation also failed:",
                fallbackError
              );
              setRoutePath([]);
            }
          } else {
            setRoutePath([]);
          }
        }
      } else {
        setRoutePath([]);
      }
    };

    calculateRoute();
  }, [waypoints, selectedRouteType, clickedMarkers]);

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

      // Ensure coordinates are valid
      const validLng = isNaN(mapCenter.lng) ? 36.8219 : mapCenter.lng; // Default to Nairobi
      const validLat = isNaN(mapCenter.lat) ? -1.2921 : mapCenter.lat; // Default to Nairobi
      const validZoom = isNaN(zoom) || zoom < 1 ? 10 : Math.min(zoom, 20);

      // Let's test with a very basic Mapbox URL first
      const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${validLng},${validLat},${validZoom}/800x600?access_token=pk.eyJ1IjoiYnJhZGQ5OCIsImEiOiJjbWRtemU1Nm0xamNlMmlyejZoYTh3dzVtIn0.DeVlSe1eIBvCf_SWVPbanA`;

      // If we have a focused location, center on it
      if (focusedLocation) {
        const focusedUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapType}/static/${focusedLocation.lng},${focusedLocation.lat},${validZoom}/800x600?access_token=pk.eyJ1IjoiYnJhZGQ5OCIsImEiOiJjbWRtemU1Nm0xamNlMmlyejZoYTh3dzVtIn0.DeVlSe1eIBvCf_SWVPbanA`;
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

  // Handle map click to add markers
  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate click position relative to map
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert pixel coordinates to lat/lng (approximate calculation)
    const mapWidth = rect.width;
    const mapHeight = rect.height;

    // Calculate the bounds of the current map view
    const degreesPerPixelX = 360 / Math.pow(2, zoom) / mapWidth;
    const degreesPerPixelY = 170.1022 / Math.pow(2, zoom) / mapHeight; // 170.1022 is the total lat range (-85.0511 to 85.0511)

    // Calculate clicked coordinates
    const clickedLng = mapCenter.lng + (x - mapWidth / 2) * degreesPerPixelX;
    const clickedLat = mapCenter.lat - (y - mapHeight / 2) * degreesPerPixelY;

    // Determine marker type based on existing markers
    let markerType: "start" | "stop" | "destination" = "stop";
    if (clickedMarkers.length === 0) {
      markerType = "start";
    } else {
      markerType = "stop";
    }

    // Get actual place name using reverse geocoding
    let placeName =
      markerType === "start"
        ? "Starting Point"
        : `Stop ${clickedMarkers.filter((m) => m.type === "stop").length + 1}`;

    try {
      const reverseGeocode = await mapboxService.reverseGeocode(
        clickedLng,
        clickedLat
      );
      if (reverseGeocode.features && reverseGeocode.features.length > 0) {
        const feature = reverseGeocode.features[0];
        // Use the most specific place name available
        placeName = feature.text || feature.place_name || placeName;

        // If it's a very generic result, try to get a more specific name
        if (feature.context && feature.context.length > 0) {
          // Look for more specific place types like poi, address, or place
          const specificPlace = reverseGeocode.features.find(
            (f) =>
              f.place_type.includes("poi") ||
              f.place_type.includes("address") ||
              f.place_type.includes("place")
          );
          if (specificPlace) {
            placeName =
              specificPlace.text || specificPlace.place_name || placeName;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to get place name, using fallback:", error);
      // Keep the fallback name if reverse geocoding fails
    }

    // Create new marker with actual place name
    const newMarker = {
      id: `marker-${Date.now()}`,
      lat: clickedLat,
      lng: clickedLng,
      name: placeName,
      type: markerType,
    };

    // Add marker to state
    setClickedMarkers((prev) => [...prev, newMarker]);

    // Call parent callback
    onAddMarker(newMarker);

    console.log("Map clicked at:", {
      lat: clickedLat,
      lng: clickedLng,
      type: markerType,
      placeName: placeName,
    });
  };

  // Clear all clicked markers
  const clearClickedMarkers = () => {
    setClickedMarkers([]);
  };

  // Convert clicked markers to waypoints for trip
  const convertMarkersToWaypoints = () => {
    return clickedMarkers.map((marker) => ({
      id: marker.id,
      name: marker.name || `${marker.type} point`,
      lat: marker.lat,
      lng: marker.lng,
    }));
  };

  return (
    <div className="w-full h-full bg-background border rounded-lg overflow-hidden">
      <div className="relative w-full h-[600px] bg-slate-100">
        {/* Interactive Mapbox Map */}
        <div
          ref={mapRef}
          className="absolute inset-0 cursor-crosshair"
          onClick={handleMapClick}
        >
          <img
            src={getMapUrl()}
            alt="Interactive Map"
            className="w-full h-full object-cover pointer-events-none"
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

          {/* Clicked markers overlay */}
          {clickedMarkers.map((marker, index) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none z-10"
              style={{
                left: `${
                  ((marker.lng - (mapCenter.lng - 180 / Math.pow(2, zoom))) /
                    (360 / Math.pow(2, zoom))) *
                  100
                }%`,
                top: `${
                  ((mapCenter.lat + 85.0511 / Math.pow(2, zoom) - marker.lat) /
                    (170.1022 / Math.pow(2, zoom))) *
                  100
                }%`,
              }}
            >
              <div className="relative">
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white ${
                    marker.type === "start"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {marker.type === "start" ? "S" : index + 1}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {marker.name}
                </div>
              </div>
            </div>
          ))}
        </div>

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

        {/* Clicked Markers Control Panel */}
        {clickedMarkers.length > 0 && (
          <div className="absolute top-4 right-4 max-w-xs mb-2">
            <Card className="bg-blue-50/95 backdrop-blur-sm border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center text-blue-800">
                    <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                    Trip Points ({clickedMarkers.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    onClick={clearClickedMarkers}
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto mb-2">
                  {clickedMarkers.map((marker, index) => (
                    <div
                      key={marker.id}
                      className="text-xs flex items-center gap-2"
                    >
                      <div
                        className={`rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold ${
                          marker.type === "start"
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {marker.type === "start" ? "S" : index + 1}
                      </div>
                      <span className="font-medium text-blue-800">
                        {marker.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={clickedMarkers.length < 2}
                    onClick={() => {
                      setIsTripModalOpen(true);
                    }}
                  >
                    Create Trip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={clearClickedMarkers}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Controls */}
        <div
          className={`absolute right-4 flex flex-col gap-2 ${
            clickedMarkers.length > 0 ? "top-40" : "top-4"
          }`}
        >
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

        {/* Route Type Selector - Only show when there are points to route */}
        {(clickedMarkers.length >= 2 || waypoints.length >= 2) && (
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Route className="h-4 w-4 mr-2" />
                    Route Options
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {clickedMarkers.length >= 2
                      ? `${clickedMarkers.length} points`
                      : `${waypoints.length} waypoints`}
                  </div>
                </div>
                <Tabs
                  value={selectedRouteType}
                  onValueChange={onRouteTypeChange}
                >
                  <TabsList className="w-full">
                    {routeTypes.map((route) => (
                      <TabsTrigger
                        key={route.id}
                        value={route.id}
                        className="flex-1"
                        disabled={
                          clickedMarkers.length < 2 && waypoints.length < 2
                        }
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
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {route.description}
                        </p>
                        {route.id === "fastest" && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <strong>Traffic-optimized:</strong> Uses real-time
                            traffic data for the quickest route
                          </div>
                        )}
                        {route.id === "scenic" && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            <strong>Scenic route:</strong> Prioritizes longer,
                            more interesting paths when available
                          </div>
                        )}
                        {route.id === "custom" && (
                          <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                            <strong>Custom route:</strong> Flexible waypoint
                            placement for manual route control
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Trip Creation Modal */}
      <TripCreationModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          if (editingTrip && onEditComplete) {
            onEditComplete(); // Clear editing state in parent
          }
        }}
        onCreateTrip={(trip) => {
          onCreateTrip(trip);
          clearClickedMarkers();
          setIsTripModalOpen(false);
          if (editingTrip && onEditComplete) {
            onEditComplete(); // Clear editing state in parent
          }
        }}
        initialStops={editingTrip ? [] : clickedMarkers} // Don't use clicked markers when editing
        routeType={selectedRouteType as "fastest" | "scenic" | "custom"}
        editingTrip={editingTrip} // Pass editing trip data to modal
      />
    </div>
  );
};

export default InteractiveMap;
