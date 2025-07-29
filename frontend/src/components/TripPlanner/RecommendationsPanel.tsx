import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  Star,
  DollarSign,
  Utensils,
  Camera,
  Bed,
  Loader2,
  Navigation,
} from "lucide-react";
import { mapboxService } from "@/services/mapbox";
import { Recommendation } from "@/types/trip";
import { toastService } from "@/services/toast";

interface RecommendationsPanelProps {
  selectedStops?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
  onAddToTrip?: (recommendation: Recommendation) => void;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  selectedStops,
  onAddToTrip,
}) => {
  const [recommendations, setRecommendations] = useState<{
    restaurants: Recommendation[];
    attractions: Recommendation[];
    accommodations: Recommendation[];
  }>({
    restaurants: [],
    attractions: [],
    accommodations: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("restaurants");

  // Fetch recommendations when stops change
  useEffect(() => {
    if (selectedStops && selectedStops.length > 0) {
      fetchRecommendations();
    } else {
      setRecommendations({
        restaurants: [],
        attractions: [],
        accommodations: [],
      });
    }
  }, [selectedStops]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      // Get the center point of all selected stops
      const centerLat =
        selectedStops.reduce((sum, stop) => sum + stop.lat, 0) /
        selectedStops.length;
      const centerLng =
        selectedStops.reduce((sum, stop) => sum + stop.lng, 0) /
        selectedStops.length;

      // Fetch recommendations for each type
      const [restaurants, attractions, accommodations] = await Promise.all([
        mapboxService.searchPOI(centerLat, centerLng, "restaurant", {
          limit: 8,
        }),
        mapboxService.searchPOI(centerLat, centerLng, "attraction", {
          limit: 8,
        }),
        mapboxService.searchPOI(centerLat, centerLng, "accommodation", {
          limit: 8,
        }),
      ]);

      // Convert to Recommendation format
      const convertToRecommendation = (poi: any): Recommendation => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        rating: poi.rating || 4.0,
        distance: poi.distance,
        duration: poi.duration,
        description: poi.description,
        imageUrl: poi.imageUrl,
        tags: poi.tags,
        lat: poi.lat,
        lng: poi.lng,
        priceLevel: poi.priceLevel,
        openingHours: poi.openingHours,
      });

      setRecommendations({
        restaurants: restaurants.map(convertToRecommendation),
        attractions: attractions.map(convertToRecommendation),
        accommodations: accommodations.map(convertToRecommendation),
      });
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toastService.api.recommendationsLoadFailed();
      
      // Set empty recommendations on error
      setRecommendations({
        restaurants: [],
        attractions: [],
        accommodations: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-200"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return Array.from({ length: 4 }, (_, i) => (
      <DollarSign
        key={i}
        className={`h-3 w-3 ${i < level ? "text-green-600" : "text-gray-300"}`}
      />
    ));
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case "restaurants":
        return <Utensils className="h-4 w-4" />;
      case "attractions":
        return <Camera className="h-4 w-4" />;
      case "accommodations":
        return <Bed className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const renderRecommendationCard = (recommendation: Recommendation) => (
    <Card key={recommendation.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <img
            src={recommendation.imageUrl}
            alt={recommendation.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/64x64?text=${encodeURIComponent(
                recommendation.name.charAt(0)
              )}`;
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-sm truncate">
                {recommendation.name}
              </h4>
              <div className="flex items-center gap-1 ml-2">
                {renderStars(recommendation.rating)}
                <span className="text-xs text-muted-foreground ml-1">
                  {recommendation.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {recommendation.description}
            </p>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {recommendation.distance}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.duration}
                </div>
              </div>
              {recommendation.priceLevel && (
                <div className="flex items-center">
                  {renderPriceLevel(recommendation.priceLevel)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {recommendation.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-1 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {onAddToTrip && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={() => onAddToTrip(recommendation)}
                >
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!selectedStops || selectedStops.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Add stops to see recommendations
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Click on the map to add stops and discover nearby attractions,
            restaurants, and places to stay
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Recommendations</h2>
        <p className="text-sm text-muted-foreground">
          Based on {selectedStops.length} selected stop
          {selectedStops.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger
              value="restaurants"
              className="flex items-center gap-2"
            >
              {getTabIcon("restaurants")}
              <span className="hidden sm:inline">Food</span>
            </TabsTrigger>
            <TabsTrigger
              value="attractions"
              className="flex items-center gap-2"
            >
              {getTabIcon("attractions")}
              <span className="hidden sm:inline">Attractions</span>
            </TabsTrigger>
            <TabsTrigger
              value="accommodations"
              className="flex items-center gap-2"
            >
              {getTabIcon("accommodations")}
              <span className="hidden sm:inline">Stay</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Finding recommendations...</span>
              </div>
            ) : (
              <>
                <TabsContent value="restaurants" className="mt-0">
                  <div className="space-y-0">
                    {recommendations.restaurants.length > 0 ? (
                      recommendations.restaurants.map(renderRecommendationCard)
                    ) : (
                      <div className="text-center py-8">
                        <Utensils className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No restaurants found nearby
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attractions" className="mt-0">
                  <div className="space-y-0">
                    {recommendations.attractions.length > 0 ? (
                      recommendations.attractions.map(renderRecommendationCard)
                    ) : (
                      <div className="text-center py-8">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No attractions found nearby
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="accommodations" className="mt-0">
                  <div className="space-y-0">
                    {recommendations.accommodations.length > 0 ? (
                      recommendations.accommodations.map(
                        renderRecommendationCard
                      )
                    ) : (
                      <div className="text-center py-8">
                        <Bed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No accommodations found nearby
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RecommendationsPanel;
