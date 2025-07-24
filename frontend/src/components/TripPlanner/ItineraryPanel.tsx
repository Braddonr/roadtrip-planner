import React, { useState, useEffect } from "react";
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
import { CustomSelect } from "@/components/ui/custom-select";
import { Stop, Trip } from "@/types/trip";
import { SearchResult } from "@/types/trip";
import {
  cars,
  getCarsByType,
  getCarById,
  formatCarName,
  Car,
} from "@/data/cars";

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
  }) => void;
  hasExistingTrips?: boolean;
  isLoading?: boolean;
  // New props for trip management
  allTrips?: Trip[];
  currentTrip?: Trip | null;
  onSelectTrip?: (trip: Trip) => void;
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
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateTrip, setShowCreateTrip] = useState(!hasExistingTrips);
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
  const carOptions = React.useMemo(() => {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

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
    setSearchQuery("");
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
      });
      // Reset form
      setTripName("");
      setTripDescription("");
      setRouteType("fastest");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedCar("toyota-camry-2024");
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
                <CustomSelect
                  options={carOptions}
                  value={selectedCar}
                  onValueChange={setSelectedCar}
                  placeholder="Search for your car..."
                  disabled={isLoading}
                />
              </div>

              {/* Custom MPG input - only show when "custom" is selected */}
              {selectedCar === "custom" && (
                <div>
                  <Label
                    htmlFor="custom-mpg"
                    className="text-sm font-medium mb-2 block"
                  >
                    <Fuel className="inline h-4 w-4 mr-1" />
                    Custom Fuel Efficiency (MPG)
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateTrip(true)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Trip
          </Button>
        </div>

        {/* Trip Selector */}
        {isLoading && allTrips.length === 0 ? (
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              Loading trips...
            </Label>
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        ) : allTrips.length > 0 ? (
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              Select Trip ({allTrips.length} available)
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {allTrips.map((trip) => (
                <div
                  key={trip.id}
                  className={`p-2 rounded-md border cursor-pointer transition-colors ${
                    currentTrip?.id === trip.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card hover:bg-accent border-border"
                  }`}
                  onClick={() => onSelectTrip?.(trip)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {trip.name}
                      </p>
                      {trip.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {trip.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {trip.stops?.length || 0} stops
                        </span>
                        {(trip.start_date || trip.startDate) && (
                          <span className="text-xs text-muted-foreground">
                            •{" "}
                            {new Date(
                              trip.start_date || trip.startDate
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentTrip?.id === trip.id && (
                      <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a destination"
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isSearching || !searchQuery}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-2">
              <p className="text-sm text-muted-foreground mb-2">
                Search Results
              </p>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2 hover:bg-accent rounded-md cursor-pointer flex items-center justify-between"
                  onClick={() => handleAddStop(result)}
                >
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.address}
                    </p>
                  </div>
                  <Plus className="h-4 w-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Route Type</p>
          <RadioGroup
            defaultValue={selectedRouteType}
            className="flex space-x-2"
            onValueChange={onRouteTypeChange}
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="fastest" id="fastest" />
              <Label htmlFor="fastest">Fastest</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="scenic" id="scenic" />
              <Label htmlFor="scenic">Scenic</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">Custom</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stops">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {stops.map((stop, index) => (
                  <Draggable key={stop.id} draggableId={stop.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="border rounded-md bg-card"
                      >
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-primary-foreground text-xs mr-2">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-medium">{stop.name}</h3>
                                <p className="text-xs text-muted-foreground flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {stop.address}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onRemoveStop(stop.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {(stop.arrivalTime || stop.departureTime) && (
                            <div className="mt-2 text-xs">
                              {stop.arrivalTime && (
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Arrive: {stop.arrivalTime}</span>
                                </div>
                              )}
                              {stop.departureTime && (
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Depart: {stop.departureTime}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {index < stops.length - 1 && (
                          <div className="px-3 py-2 border-t bg-muted/30 text-xs flex items-center">
                            <CarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {stops[index + 1].travelTime} (
                              {stops[index + 1].travelDistance})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Total Distance</p>
            <p className="text-lg font-bold">408 miles</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Time</p>
            <p className="text-lg font-bold">8h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPanel;
