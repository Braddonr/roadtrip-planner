import React, { useState } from "react";
import { InteractiveMap } from "./InteractiveMap";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { Trip, Recommendation } from "@/types/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Route, DollarSign, Eye, Edit, Trash2 } from "lucide-react";

export const TripPlannerDemo: React.FC = () => {
  const [createdTrips, setCreatedTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [clickedMarkers, setClickedMarkers] = useState<Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'start' | 'stop' | 'destination';
  }>>([]);

  const handleCreateTrip = (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCreatedTrips(prev => [...prev, newTrip]);
    console.log('New trip created:', newTrip);
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
    // Convert trip stops to markers for map visualization
    const markers = trip.stops.map((stop, index) => ({
      id: stop.id,
      name: stop.name,
      lat: stop.lat || 0,
      lng: stop.lng || 0,
      type: stop.type === 'start' ? 'start' as const : 
            stop.type === 'destination' ? 'destination' as const : 
            'stop' as const
    }));
    setClickedMarkers(markers);
  };

  const handleDeleteTrip = (tripId: string) => {
    setCreatedTrips(prev => prev.filter(trip => trip.id !== tripId));
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(null);
      setClickedMarkers([]);
    }
  };

  const handleAddRecommendationToTrip = (recommendation: Recommendation) => {
    // Add recommendation as a new marker
    const newMarker = {
      id: `rec-${recommendation.id}`,
      name: recommendation.name,
      lat: recommendation.lat,
      lng: recommendation.lng,
      type: 'stop' as const
    };
    setClickedMarkers(prev => [...prev, newMarker]);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Created Trips */}
      <div className="w-80 bg-background border-r overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">My Trips ({createdTrips.length})</h2>
          
          {createdTrips.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trips created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click on the map to add stops, then create your first trip
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {createdTrips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTrip?.id === trip.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleTripClick(trip)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{trip.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{trip.routeType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Trip Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <Route className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{formatDistance(trip.totalDistance)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{formatDuration(trip.totalTime)}</span>
                      </div>
                    </div>

                    {/* Stops Preview */}
                    <div>
                      <p className="text-xs font-medium mb-1">{trip.stops.length} stops</p>
                      <div className="text-xs text-muted-foreground">
                        {trip.stops.slice(0, 2).map((stop, index) => (
                          <div key={stop.id} className="truncate">
                            {index + 1}. {stop.name}
                          </div>
                        ))}
                        {trip.stops.length > 2 && (
                          <div>+{trip.stops.length - 2} more...</div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 pt-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripClick(trip);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement edit functionality
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center - Interactive Map */}
      <div className="flex-1">
        <InteractiveMap
          onCreateTrip={handleCreateTrip}
          onAddMarker={(marker) => {
            console.log('Marker added:', marker);
          }}
          // Pass selected trip data to show route
          waypoints={selectedTrip ? selectedTrip.stops.map(stop => ({
            id: stop.id,
            name: stop.name,
            lat: stop.lat || 0,
            lng: stop.lng || 0
          })) : undefined}
          selectedRouteType={selectedTrip?.routeType}
          // Pass clicked markers for new trip creation
          initialMarkers={clickedMarkers}
          onMarkersChange={setClickedMarkers}
        />
      </div>

      {/* Right Sidebar - Recommendations */}
      <div className="w-80 bg-background border-l overflow-y-auto">
        <RecommendationsPanel
          selectedStops={clickedMarkers}
          onAddToTrip={handleAddRecommendationToTrip}
        />
      </div>
    </div>
  );
};