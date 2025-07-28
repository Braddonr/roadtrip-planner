import React, { useState } from "react";
import { InteractiveMap } from "./InteractiveMap";
import { Trip } from "@/types/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Route, DollarSign } from "lucide-react";

export const TripPlannerDemo: React.FC = () => {
  const [createdTrips, setCreatedTrips] = useState<Trip[]>([]);

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
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Interactive Map */}
      <div className="flex-1">
        <InteractiveMap
          onCreateTrip={handleCreateTrip}
          onAddMarker={(marker) => {
            console.log('Marker added:', marker);
          }}
        />
      </div>

      {/* Created Trips Sidebar */}
      <div className="w-full lg:w-96 bg-background border-l overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Created Trips ({createdTrips.length})</h2>
          
          {createdTrips.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trips created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click on the map to add stops, then click "Create Trip"
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {createdTrips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <Badge variant="secondary">{trip.routeType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Trip Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDistance(trip.totalDistance)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDuration(trip.totalTime)}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Est. Fuel: ${trip.estimatedFuelCost.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Stops */}
                    <div>
                      <p className="text-sm font-medium mb-2">Stops ({trip.stops.length})</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {trip.stops.map((stop, index) => (
                          <div key={stop.id} className="flex items-center text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              stop.type === 'start' ? 'bg-green-500 text-white' :
                              stop.type === 'destination' ? 'bg-red-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {stop.type === 'start' ? 'S' : 
                               stop.type === 'destination' ? 'D' : 
                               index}
                            </div>
                            <span className="flex-1 truncate">{stop.name}</span>
                            {stop.travelDistance && (
                              <span className="text-muted-foreground ml-2">
                                {stop.travelDistance}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dates */}
                    {(trip.startDate || trip.endDate) && (
                      <div className="text-xs text-muted-foreground">
                        {trip.startDate && (
                          <p>Start: {trip.startDate.toLocaleDateString()}</p>
                        )}
                        {trip.endDate && (
                          <p>End: {trip.endDate.toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};