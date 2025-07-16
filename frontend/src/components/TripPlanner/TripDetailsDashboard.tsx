import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CloudSun,
  Droplets,
  Fuel,
  Clock,
  Calendar,
  DollarSign,
  Save,
  Share2,
  MapPin,
  Sun,
  Cloud,
} from "lucide-react";
import { WeatherForecast } from "@/types/trip";

interface TripDetailsProps {
  totalDistance: number;
  totalTime: number;
  estimatedFuelCost: number;
  weatherForecasts: WeatherForecast[];
  completionPercentage: number;
  startDate?: Date;
  endDate?: Date;
  onSave?: () => void;
  onShare?: () => void;
}

const TripDetailsDashboard = ({
  totalDistance = 450,
  totalTime = 8.5,
  estimatedFuelCost = 85,
  completionPercentage = 75,
  startDate = new Date(),
  endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  weatherForecasts = [],
  onSave = () => console.log("Saving trip..."),
  onShare = () => console.log("Sharing trip..."),
}: TripDetailsProps) => {
  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render weather icon based on condition
  const renderWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <Sun className="h-5 w-5 text-yellow-500" />;
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <Droplets className="h-5 w-5 text-blue-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-5 w-5 text-gray-500" />;
    } else {
      return <CloudSun className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="w-full bg-background border-t">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Trip Summary</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Trip
            </Button>
            <Button size="sm" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trip Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trip Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Total Distance</span>
                  </div>
                  <span className="font-medium">{totalDistance} miles</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Total Time</span>
                  </div>
                  <span className="font-medium">{totalTime} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Est. Fuel Cost</span>
                  </div>
                  <span className="font-medium">${estimatedFuelCost}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Dates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trip Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Start Date</span>
                  </div>
                  <span className="font-medium">{formatDate(startDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">End Date</span>
                  </div>
                  <span className="font-medium">{formatDate(endDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Budget Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    On Budget
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Forecasts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Weather Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weatherForecasts.map((forecast, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{forecast.location}</p>
                      <p className="text-xs text-muted-foreground">
                        {forecast.condition}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {renderWeatherIcon(forecast.condition)}
                      <span className="ml-1 font-medium">
                        {Math.round(forecast.temperature)}°F
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trip Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Trip Planning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    {completionPercentage < 50
                      ? "You're just getting started! Add more stops to your itinerary."
                      : completionPercentage < 80
                        ? "Making good progress! Consider adding some attractions."
                        : "Almost ready to go! Finalize any remaining details."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetailsDashboard;
