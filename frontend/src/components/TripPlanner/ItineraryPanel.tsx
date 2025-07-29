import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  Car as CarIcon,
  Trash2,
  Calendar,
  DollarSign,
  Fuel,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stop, Trip } from "@/types/trip";
import { SearchResult } from "@/types/trip";
import {
  cars,
  getCarsByType,
  getCarById,
  formatCarName,
  Car,
} from "@/data/cars";
import { SearchAutocomplete } from "@/components/ui/search-autocomplete";

interface ItineraryPanelProps {
  stops: Stop[];
  onAddStop: (stop: Omit<Stop, "id">) => void;
  onRemoveStop: (stopId: string) => void;
  onReorderStops: (stops: Stop[]) => void;
  onRouteTypeChange: (routeType: string) => void;
  selectedRouteType: string;
  searchResults?: SearchResult[];
  isSearching?: boolean;
  onSearch?: (query: string) => void;
  onCreateTrip?: (tripData: {
    name: string;
    description?: string;
    route_type?: string;
    start_date?: string;
    end_date?: string;
    fuel_efficiency?: number;
    fuel_price_per_gallon?: number;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: string;
  }) => void;
  hasExistingTrips?: boolean;
  isLoading?: boolean;
  // New props for trip management
  allTrips?: Trip[];
  currentTrip?: Trip | null;
  onSelectTrip?: (trip: Trip) => void;
  // New props for filtering
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
}

const ItineraryPanel: React.FC<ItineraryPanelProps> = ({
  stops,
  onAddStop,
  onRemoveStop,
  onReorderStops,
  onRouteTypeChange,
  selectedRouteType,
  searchResults = [],
  isSearching = false,
  onSearch,
  onCreateTrip,
  hasExistingTrips = false,
  isLoading = false,
  // New props for trip management
  allTrips = [],
  currentTrip,
  onSelectTrip,
  // New props for filtering
  selectedFilter = "all",
  onFilterChange,
}) => {
  const [showCreateTrip, setShowCreateTrip] = useState(!hasExistingTrips);

  // Filter trips based on selected filter
  const filteredTrips = useMemo(() => {
    if (selectedFilter === "all") return allTrips;
    return allTrips.filter((trip) => trip.route_type === selectedFilter);
  }, [allTrips, selectedFilter]);

  // Calculate total distance and time for all fetched trips
  const totalStats = useMemo(() => {
    const totalDistance = filteredTrips.reduce(
      (sum, trip) => sum + (trip.totalDistance || 0),
      0
    );
    const totalTime = filteredTrips.reduce(
      (sum, trip) => sum + (trip.totalTime || 0),
      0
    );
    return { totalDistance, totalTime };
  }, [filteredTrips]);
  const [tripName, setTripName] = useState("");
  const [tripDescription, setTripDescription] = useState("");
  const [routeType, setRouteType] = useState("fastest");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCar, setSelectedCar] = useState("toyota-camry-2024");
  const [customMake, setCustomMake] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [customMpg, setCustomMpg] = useState("25");
  const [fuelPrice, setFuelPrice] = useState("3.50");

  // Update showCreateTrip when hasExistingTrips changes (e.g., when trips are loaded)
  useEffect(() => {
    // Only update if not loading to avoid flickering
    if (!isLoading) {
      console.log(
        "ItineraryPanel: hasExistingTrips changed to:",
        hasExistingTrips
      );
      setShowCreateTrip(!hasExistingTrips);
    }
  }, [hasExistingTrips, isLoading]);

  // Prepare car options for the searchable combobox
  const carOptions = useMemo(() => {
    const options = cars
      .filter((car) => car.id !== "custom")
      .map((car) => ({
        value: car.id,
        label: formatCarName(car),
        group:
          car.type === "sedan"
            ? "Sedans"
            : car.type === "suv"
            ? "SUVs"
            : car.type === "truck"
            ? "Trucks"
            : car.type === "hybrid"
            ? "Hybrids"
            : car.type === "electric"
            ? "Electric"
            : car.type === "hatchback"
            ? "Hatchbacks"
            : car.type === "coupe"
            ? "Sports Cars"
            : "Other",
      }));

    // Add custom option at the end
    options.push({
      value: "custom",
      label: "Custom - Enter your custom mpg",
      group: "Custom",
    });

    return options;
  }, []);

  const handleAddStop = (result: SearchResult) => {
    const newStop = {
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      travelTime: "2h", // This would be calculated by routing service
      travelDistance: "120 miles", // This would be calculated by routing service
    };
    onAddStop(newStop);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderStops(items);
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateTrip && tripName.trim()) {
      // Get MPG from selected car or custom input
      const selectedCarData = getCarById(selectedCar);
      const mpg =
        selectedCar === "custom"
          ? parseFloat(customMpg)
          : selectedCarData?.mpg || 25;

      // Prepare vehicle information for the backend
      let vehicleInfo = {};
      if (selectedCar === "custom") {
        // Include custom vehicle details
        vehicleInfo = {
          vehicle_make: customMake || "Custom",
          vehicle_model: customModel || "Vehicle",
          vehicle_year: customYear || "N/A",
        };
      } else if (selectedCarData) {
        // Include selected vehicle details
        vehicleInfo = {
          vehicle_make: selectedCarData.make,
          vehicle_model: selectedCarData.model,
          vehicle_year: selectedCarData.year,
        };
      }

      onCreateTrip({
        name: tripName,
        description: tripDescription || undefined,
        route_type: routeType,
        start_date: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
        fuel_efficiency: mpg,
        fuel_price_per_gallon: parseFloat(fuelPrice),
        ...vehicleInfo, // Include vehicle information
      });
      // Reset form
      setTripName("");
      setTripDescription("");
      setRouteType("fastest");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedCar("toyota-camry-2024");
      setCustomMake("");
      setCustomModel("");
      setCustomYear("");
      setCustomMpg("25");
      setFuelPrice("3.50");
      setShowCreateTrip(false);
    }
  };

  // Show create trip interface if no existing trips or user wants to create new trip
  if (!hasExistingTrips || showCreateTrip) {
    return (
      <div className="h-full w-[350px] bg-background border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4">Create New Trip</h2>

          <form
            onSubmit={handleCreateTrip}
            className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto"
          >
            {/* Basic Trip Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="trip-name">Trip Name *</Label>
                <Input
                  id="trip-name"
                  type="text"
                  placeholder="e.g., California Coast Road Trip"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="trip-description">Description</Label>
                <Input
                  id="trip-description"
                  type="text"
                  placeholder="Brief description of your trip"
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Route Type - One Line */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Route Type
              </Label>
              <RadioGroup
                value={routeType}
                onValueChange={setRouteType}
                className="flex flex-row space-x-4"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="fastest" id="create-fastest" />
                  <Label htmlFor="create-fastest" className="text-sm">
                    Fastest
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="scenic" id="create-scenic" />
                  <Label htmlFor="create-scenic" className="text-sm">
                    Scenic
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="custom" id="create-custom" />
                  <Label htmlFor="create-custom" className="text-sm">
                    Custom
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Trip Dates */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date
                </Label>
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="Select start date"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date
                </Label>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="Select end date"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Vehicle & Fuel Settings */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <CarIcon className="inline h-4 w-4 mr-1" />
                  Select Your Vehicle
                </Label>
                <Select
                  value={selectedCar}
                  onValueChange={setSelectedCar}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search for your car..." />
                  </SelectTrigger>
                  <SelectContent>
                    {carOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom car form - only show when "custom" is selected */}
              {selectedCar === "custom" && (
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  <h4 className="text-sm font-medium">
                    Enter Your Vehicle Details
                  </h4>

                  <div>
                    <Label
                      htmlFor="custom-make"
                      className="text-sm font-medium mb-1 block"
                    >
                      Make
                    </Label>
                    <Input
                      id="custom-make"
                      type="text"
                      placeholder="Toyota, Honda, Ford, etc."
                      value={customMake}
                      onChange={(e) => setCustomMake(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="custom-model"
                      className="text-sm font-medium mb-1 block"
                    >
                      Model
                    </Label>
                    <Input
                      id="custom-model"
                      type="text"
                      placeholder="Camry, Civic, F-150, etc."
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="custom-year"
                      className="text-sm font-medium mb-1 block"
                    >
                      Year
                    </Label>
                    <Input
                      id="custom-year"
                      type="text"
                      placeholder="2024, 2023, etc."
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="custom-mpg"
                      className="text-sm font-medium mb-1 block"
                    >
                      <Fuel className="inline h-4 w-4 mr-1" />
                      Fuel Efficiency (MPG)
                    </Label>
                    <Input
                      id="custom-mpg"
                      type="number"
                      min="5"
                      max="150"
                      step="0.1"
                      placeholder="25.0"
                      value={customMpg}
                      onChange={(e) => setCustomMpg(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label
                  htmlFor="fuel-price"
                  className="text-sm font-medium mb-2 block"
                >
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Fuel Price per Gallon ($)
                </Label>
                <Input
                  id="fuel-price"
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  placeholder="3.50"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !tripName.trim()}
              >
                {isLoading ? "Creating..." : "Create Trip"}
              </Button>

              {hasExistingTrips && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateTrip(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Create your first trip to start planning your adventure!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-[350px] bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Trip Itinerary</h2>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateTrip(true)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Trip
          </Button> */}
        </div>

        <SearchAutocomplete
          placeholder="Search for a destination"
          onSearch={onSearch || (() => {})}
          onResultSelect={handleAddStop}
          searchResults={searchResults}
          isSearching={isSearching}
          className="mb-4"
        />
      </div>

      {/* Trip List - Bigger section */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Route Type Filter */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">
            Filter by Route Type
          </Label>
          <RadioGroup
            value={selectedFilter}
            onValueChange={onFilterChange}
            className="flex flex-wrap gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="all" id="filter-all" />
              <Label htmlFor="filter-all" className="text-sm">
                All
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="fastest" id="filter-fastest" />
              <Label htmlFor="filter-fastest" className="text-sm">
                Fastest
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="scenic" id="filter-scenic" />
              <Label htmlFor="filter-scenic" className="text-sm">
                Scenic
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="custom" id="filter-custom" />
              <Label htmlFor="filter-custom" className="text-sm">
                Custom
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Trip List */}
        {isLoading && filteredTrips.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading trips...</p>
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Trips ({filteredTrips.length}{" "}
              {selectedFilter === "all" ? "total" : selectedFilter})
            </Label>
            {filteredTrips.map((trip) => (
              <Card
                key={trip.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentTrip?.id === trip.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => onSelectTrip?.(trip)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {trip.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="bg-secondary px-2 py-1 rounded-full">
                          {trip.route_type || "fastest"}
                        </span>
                        <span>{trip.stops?.length || 0} stops</span>
                        {trip.startDate && (
                          <span>
                            • {new Date(trip.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            Distance:{" "}
                          </span>
                          <span className="font-medium">
                            {trip.totalDistance
                              ? `${(trip.totalDistance / 1000).toFixed(1)} km`
                              : "--"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time: </span>
                          <span className="font-medium">
                            {trip.totalTime
                              ? `${Math.round(
                                  trip.totalTime / 3600
                                )}h ${Math.round(
                                  (trip.totalTime % 3600) / 60
                                )}m`
                              : "--"}
                          </span>
                        </div>
                      </div>
                      {trip.estimatedFuelCost && (
                        <div className="text-xs mt-1">
                          <span className="text-muted-foreground">
                            Est. Cost:{" "}
                          </span>
                          <span className="font-medium text-green-600">
                            ${trip.estimatedFuelCost.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    {currentTrip?.id === trip.id && (
                      <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {selectedFilter === "all"
                ? "No trips found. Create your first trip!"
                : `No ${selectedFilter} trips found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryPanel;
