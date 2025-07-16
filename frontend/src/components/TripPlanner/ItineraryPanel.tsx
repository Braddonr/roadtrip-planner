import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  Car,
  Trash2,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Stop } from "@/types/trip";
import { SearchResult } from "@/types/trip";

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
}) => {
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="h-full w-[350px] bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Trip Itinerary</h2>

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
                            <Car className="h-3 w-3 mr-1 text-muted-foreground" />
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
