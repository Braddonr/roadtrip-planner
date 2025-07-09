import React, { useState } from "react";
import {
  MapIcon,
  Navigation,
  Layers,
  Plus,
  Minus,
  LocateFixed,
  Route,
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
  onWaypointDrag?: (waypointId: string, newLat: number, newLng: number) => void;
  onRouteTypeChange?: (routeType: string) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  waypoints = [
    { id: "1", name: "Starting Point", lat: 40.7128, lng: -74.006 },
    { id: "2", name: "Destination", lat: 34.0522, lng: -118.2437 },
  ],
  selectedRouteType = "fastest",
  onWaypointDrag = () => {},
  onRouteTypeChange = () => {},
}) => {
  const [zoom, setZoom] = useState(5);
  const [mapType, setMapType] = useState("standard");

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

  // This would be replaced with actual map implementation
  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 20));
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 1));

  return (
    <Card className="w-full h-full bg-background border rounded-lg overflow-hidden">
      <div className="relative w-full h-[600px] bg-slate-100">
        {/* Map placeholder - would be replaced with actual map component */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <div className="text-center">
            <MapIcon className="h-16 w-16 mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Interactive Map</p>
            <p className="text-sm text-slate-400">Current zoom level: {zoom}</p>
            <p className="text-sm text-slate-400">
              Waypoints: {waypoints.length}
            </p>
            <p className="text-sm text-slate-400">
              Route type: {selectedRouteType}
            </p>
          </div>
        </div>

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
                <Button variant="secondary" size="icon">
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
                <Button variant="secondary" size="icon">
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Map Layers</p>
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
