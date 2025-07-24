import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MapPin, Clock, Plus, X, Info, Loader2, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Recommendation } from "@/types/trip";

interface RecommendationsPanelProps {
  selectedStop?: string;
  recommendations?: Recommendation[];
  onAddToTrip?: (recommendation: Recommendation) => void;
  onDismiss?: (recommendationId: string) => void;
  onViewDetails?: (recommendation: Recommendation) => void;
  isLoading?: boolean;
  currentTrip?: any;
  onLoadRecommendations?: (lat: number, lng: number) => void;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  selectedStop = "Current Location",
  recommendations = [],
  onAddToTrip = () => {},
  onDismiss = () => {},
  onViewDetails = () => {},
  isLoading = false,
  currentTrip,
  onLoadRecommendations = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredRecommendations =
    activeTab === "all"
      ? recommendations
      : recommendations.filter((rec) => rec.type === activeTab);

  return (
    <Card className="w-full h-full bg-white border rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recommendations</CardTitle>
            <CardDescription>Suggested places near {selectedStop}</CardDescription>
          </div>
          {currentTrip?.stops && currentTrip.stops.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const lastStop = currentTrip.stops[currentTrip.stops.length - 1];
                      if (lastStop?.lat && lastStop?.lng) {
                        onLoadRecommendations(lastStop.lat, lastStop.lng);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh recommendations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="attraction">Attractions</TabsTrigger>
            <TabsTrigger value="restaurant">Food</TabsTrigger>
            <TabsTrigger value="accommodation">Stays</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[220px] p-0">
          <div className="p-4 pt-0 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[180px] text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading recommendations...</p>
              </div>
            ) : filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onAddToTrip={onAddToTrip}
                  onDismiss={onDismiss}
                  onViewDetails={onViewDetails}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-center text-muted-foreground">
                <p>No recommendations available for this location.</p>
                <p className="text-sm">
                  Try selecting a different category or location.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddToTrip: (recommendation: Recommendation) => void;
  onDismiss: (recommendationId: string) => void;
  onViewDetails: (recommendation: Recommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAddToTrip,
  onDismiss,
  onViewDetails,
}) => {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="flex">
        <div
          className="w-24 h-24 bg-cover bg-center"
          style={{ backgroundImage: `url(${recommendation.imageUrl})` }}
        />
        <div className="flex-1 p-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm">{recommendation.name}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
                  <span>{recommendation.rating}</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{recommendation.distance}</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{recommendation.duration}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onDismiss(recommendation.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dismiss</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {recommendation.tags.slice(0, 2).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs py-0 px-1"
              >
                {tag}
              </Badge>
            ))}
            {recommendation.tags.length > 2 && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                +{recommendation.tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex justify-between mt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onViewDetails(recommendation)}
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAddToTrip(recommendation)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Trip
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecommendationsPanel;
