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
import { geoapifyService } from "@/services/geoapify";

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
  onWaypointDrag?: (waypointId: string, newLat: number, newLng: number) => void;
  onRouteTypeChange?: (routeType: string) => void;
  onSearchResultClick?: (result: SearchResult) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  waypoints = [
    { id: "1", name: "Starting Point", lat: 40.7128, lng: -74.006 },
    { id: "2", name: "Destination", lat: 34.0522, lng: -118.2437 },
  ],
  selectedRouteType = "fastest",
  searchResults = [],
  onWaypointDrag = () => {},
  onRouteTypeChange = () => {},
  onSearchResultClick = () => {},
}) => {
  const [zoom, setZoom] = useState(5);
  const [mapType, setMapType] = useState("osm-carto");
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of USA
  const [isMapLoading, setIsMapLoading] = useState(true);
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

  // Update map center when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      // Center map on first search result
      const firstResult = searchResults[0];
      setMapCenter({ lat: firstResult.lat, lng: firstResult.lng });
      setZoom(12); // Zoom in when showing search results
    } else if (waypoints.length > 0) {
      // Center map on waypoints
      const avgLat = waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length;
      const avgLng = waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [searchResults, waypoints]);

  // Generate static map URL with markers
  const getMapUrl = () => {
    const markers = [];
    
    // Add waypoint markers (blue)
    waypoints.forEach((waypoint, index) => {
      markers.push({
        lat: waypoint.lat,
        lon: waypoint.lng,
        color: 'blue',
        size: 'medium' as const,
        text: (index + 1).toString(),
      });
    });
    
    // Add search result markers (red)
    searchResults.forEach((result, index) => {
      markers.push({
        lat: result.lat,
        lon: result.lng,
        color: 'red',
        size: 'medium' as const,
        text: String.fromCharCode(65 + index), // A, B, C, etc.
      });
    });

    return geoapifyService.getStaticMapUrl({
      center: { lat: mapCenter.lat, lon: mapCenter.lng },
      zoom,
      width: 800,
      height: 600,
      markers,
      style: mapType as any,
    });
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
        {/* Geoapify Static Map */}
        <div className="absolute inset-0">
          <img
            src={getMapUrl()}
            alt="Interactive Map"
            className="w-full h-full object-cover"
            onLoad={() => setIsMapLoading(false)}
            onError={(e) => {
              setIsMapLoading(false);
              // Fallback to placeholder if map fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200" style={{ display: 'none' }}>
            <div className="text-center">
              <MapIcon className="h-16 w-16 mx-auto text-slate-400" />
              <p className="mt-2 text-slate-500">Map Loading...</p>
              <p className="text-sm text-slate-400">Zoom: {zoom}</p>
              <p className="text-sm text-slate-400">Waypoints: {waypoints.length}</p>
              <p className="text-sm text-slate-400">Search Results: {searchResults.length}</p>
            </div>
          </div>
        </div>

        {/* Search Results Overlay */}
        {searchResults.length > 0 && (
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
                      onClick={() => onSearchResultClick(result)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{result.name}</p>
                          <p className="text-muted-foreground truncate">{result.address}</p>
                          {result.categories && result.categories.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                              {result.categories.slice(0, 2).join(', ')}
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
                          console.error('Geolocation error:', error);
                          alert('Unable to get your location. Please check your browser permissions.');
                        }
                      );
                    } else {
                      alert('Geolocation is not supported by this browser.');
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
                    // Cycle through map styles
                    const styles = ['osm-carto', 'osm-bright', 'positron', 'dark-matter'];
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
