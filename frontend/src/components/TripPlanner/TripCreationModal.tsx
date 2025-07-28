import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  MapPin,
  Clock,
  Route,
  CloudSun,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mapboxService } from "@/services/mapbox";
import { Trip, Stop, WeatherForecast } from "@/types/trip";

interface TripCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialStops: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'start' | 'stop' | 'destination';
  }>;
  routeType: 'fastest' | 'scenic' | 'custom';
}

export const TripCreationModal: React.FC<TripCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
  initialStops,
  routeType,
}) => {
  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState<{
    totalDistance: number;
    totalTime: number;
    estimatedFuelCost: number;
    stops: Stop[];
    weather: WeatherForecast[];
  } | null>(null);

  // Calculate trip details when modal opens or stops change
  useEffect(() => {
    if (isOpen && initialStops.length > 0) {
      calculateTripDetails();
    }
  }, [isOpen, initialStops]);

  const calculateTripDetails = async () => {
    setIsLoading(true);
    try {
      // Convert initial stops to coordinates for directions API
      const coordinates: Array<[number, number]> = initialStops.map(stop => [
        stop.lng,
        stop.lat
      ]);

      // Get directions and calculate total distance/time
      const directions = await mapboxService.getDirections(coordinates, {
        profile: routeType === 'fastest' ? 'driving' : 'driving',
        steps: true,
      });

      let totalDistance = 0;
      let totalTime = 0;
      const stops: Stop[] = [];

      if (directions.routes && directions.routes.length > 0) {
        const route = directions.routes[0];
        totalDistance = route.distance; // meters
        totalTime = route.duration; // seconds

        // Create stops with travel information
        initialStops.forEach((stop, index) => {
          const leg = route.legs[index - 1]; // Previous leg to this stop
          
          stops.push({
            id: stop.id,
            name: stop.name,
            address: `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`,
            lat: stop.lat,
            lng: stop.lng,
            type: index === 0 ? 'start' : 
                  index === initialStops.length - 1 ? 'destination' : 'waypoint',
            travelDistance: leg ? `${(leg.distance / 1000).toFixed(1)} km` : undefined,
            travelTime: leg ? `${Math.round(leg.duration / 60)} min` : undefined,
          });
        });
      }

      // Calculate estimated fuel cost (rough estimate: 10km per liter, $1.5 per liter)
      const estimatedFuelCost = (totalDistance / 1000) * 0.1 * 1.5;

      // Get weather for each stop (simplified - you'd want to implement actual weather API)
      const weather: WeatherForecast[] = await Promise.all(
        initialStops.map(async (stop, index) => ({
          location: stop.name,
          temperature: 25 + Math.random() * 10, // Mock data
          condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
          icon: 'sun',
          humidity: 60 + Math.random() * 20,
          windSpeed: 5 + Math.random() * 10,
          date: new Date(),
        }))
      );

      setTripData({
        totalDistance,
        totalTime,
        estimatedFuelCost,
        stops,
        weather,
      });
    } catch (error) {
      console.error('Error calculating trip details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = () => {
    if (!tripName.trim() || !tripData) return;

    const trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
      name: tripName.trim(),
      stops: tripData.stops,
      routeType,
      totalDistance: tripData.totalDistance,
      totalTime: tripData.totalTime,
      estimatedFuelCost: tripData.estimatedFuelCost,
      startDate,
      endDate,
    };

    onCreateTrip(trip);
    onClose();
    
    // Reset form
    setTripName("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setTripData(null);
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only close if explicitly set to false, not on other interactions
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
          <DialogDescription>
            Add details for your trip with {initialStops.length} stops
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trip Details Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tripName">Trip Name *</Label>
              <Input
                id="tripName"
                placeholder="e.g., Weekend Safari Adventure"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your trip..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Calculating trip details...</span>
                  </div>
                </CardContent>
              </Card>
            ) : tripData ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Route className="h-5 w-5 mr-2" />
                      Trip Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Distance</p>
                        <p className="font-semibold">{formatDistance(tripData.totalDistance)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Time</p>
                        <p className="font-semibold">{formatDuration(tripData.totalTime)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Fuel Cost</p>
                      <p className="font-semibold">${tripData.estimatedFuelCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Route Type</p>
                      <Badge variant="secondary">{routeType}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Trip route ({tripData.stops.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {tripData.stops.map((stop, index) => (
                        <div key={stop.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              stop.type === 'start' ? 'bg-green-500 text-white' :
                              stop.type === 'destination' ? 'bg-red-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {stop.type === 'start' ? 'S' : 
                               stop.type === 'destination' ? 'D' : 
                               index}
                            </div>
                            <span className="font-medium">{stop.name}</span>
                          </div>
                          {stop.travelDistance && (
                            <span className="text-muted-foreground text-xs">
                              {stop.travelDistance}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTrip}
            disabled={!tripName.trim() || !tripData || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Trip'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};