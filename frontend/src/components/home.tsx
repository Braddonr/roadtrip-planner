import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import InteractiveMap from "./TripPlanner/InteractiveMap";
import ItineraryPanel from "./TripPlanner/ItineraryPanel";
import RecommendationsPanel from "./TripPlanner/RecommendationsPanel";
import TripDetailsDashboard from "./TripPlanner/TripDetailsDashboard";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Search,
  Menu,
  Bell,
  User,
  MapPin,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import { useTripStore } from "../hooks/useTripStore";
import { useSearch } from "../hooks/useSearch";
import { useAuth } from "../contexts/AuthContext";
import { SearchAutocomplete } from "./ui/search-autocomplete";

export default function Home() {
  const tripStore = useTripStore();
  const search = useSearch();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  // Load initial data
  useEffect(() => {
    // Load trips from backend when component mounts
    console.log('Home: Loading trips on mount');
    tripStore.loadTrips();
  }, []);

  // Debug: Log when allTrips changes
  useEffect(() => {
    console.log('Home: allTrips changed:', tripStore.allTrips.length, 'trips');
    console.log('Home: allTrips data:', tripStore.allTrips);
    console.log('Home: currentTrip:', tripStore.currentTrip);
    console.log('Home: hasExistingTrips will be:', tripStore.allTrips.length > 0);
  }, [tripStore.allTrips]);

  // Load weather and recommendations when current trip changes
  useEffect(() => {
    if (tripStore.currentTrip) {
      console.log('Home: Current trip changed, loading data for:', tripStore.currentTrip.name);
      tripStore.loadWeatherForecasts();
      
      // Load recommendations based on the last stop or first stop if available
      if (tripStore.currentTrip.stops && tripStore.currentTrip.stops.length > 0) {
        const lastStop = tripStore.currentTrip.stops[tripStore.currentTrip.stops.length - 1];
        if (lastStop.lat && lastStop.lng) {
          console.log('Home: Loading recommendations for last stop:', lastStop.name);
          tripStore.loadRecommendations(lastStop.lat, lastStop.lng);
        }
      } else {
        // If no stops, try to load recommendations for a default location (e.g., trip's general area)
        console.log('Home: No stops in current trip, loading general recommendations');
        // Load recommendations for a default location (e.g., center of USA)
        tripStore.loadRecommendations(39.8283, -98.5795);
      }
    }
  }, [tripStore.currentTrip?.id, tripStore.currentTrip?.stops?.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search.searchPlaces(searchQuery);
    }
  };

  // Handle search result selection from header search
  const handleHeaderSearchSelect = (result: any) => {
    // Add the selected result as a stop to the current trip
    if (tripStore.currentTrip) {
      tripStore.addStop({
        name: result.name,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
      });
    }
    // Clear the search query
    setSearchQuery("");
  };
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Road Trip Planner</h1>
          <Link to="/demo">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Quick Demo Search
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <div className="max-w-xs hidden md:block">
            <SearchAutocomplete
              placeholder="Search destinations..."
              onSearch={search.searchPlaces}
              onResultSelect={handleHeaderSearchSelect}
              searchResults={search.results}
              isSearching={search.isLoading}
              className="w-64"
            />
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">
                {user?.full_name || `${user?.first_name} ${user?.last_name}`}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                  user?.email || "user"
                }`}
                alt={user?.full_name || "User"}
              />
              <AvatarFallback>
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Itinerary */}
        <motion.div
          initial={{ x: -350 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[350px] border-r overflow-y-auto flex-shrink-0 bg-background"
        >
          <ItineraryPanel
            stops={tripStore.currentTrip?.stops || []}
            onAddStop={(stop) => tripStore.addStop(stop)}
            onRemoveStop={tripStore.removeStop}
            onReorderStops={tripStore.reorderStops}
            onRouteTypeChange={tripStore.updateRouteType}
            selectedRouteType={tripStore.currentTrip?.routeType || "fastest"}
            searchResults={search.results}
            isSearching={search.isLoading}
            onSearch={search.searchPlaces}
            onCreateTrip={async (tripData) => {
              try {
                await tripStore.createTrip(tripData);
              } catch (error) {
                console.error("Failed to create trip:", error);
              }
            }}
            hasExistingTrips={tripStore.allTrips.length > 0}
            isLoading={tripStore.isLoading}
            // New props for trip management
            allTrips={tripStore.allTrips}
            currentTrip={tripStore.currentTrip}
            onSelectTrip={tripStore.setCurrentTrip}
          />
        </motion.div>

        {/* Center - Map */}
        <div className="flex-1 relative overflow-hidden">
          <InteractiveMap
            waypoints={
              tripStore.currentTrip?.stops?.map((stop) => ({
                id: stop.id,
                name: stop.name,
                lat: stop.lat || 0,
                lng: stop.lng || 0,
              })) || []
            }
            selectedRouteType={tripStore.currentTrip?.routeType || "fastest"}
            searchResults={search.results}
            onRouteTypeChange={tripStore.updateRouteType}
            onSearchResultClick={(result) => {
              // Add search result as a stop to the current trip
              if (tripStore.currentTrip) {
                tripStore.addStop({
                  name: result.name,
                  address: result.address,
                  lat: result.lat,
                  lng: result.lng,
                });
              }
            }}
          />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md"
              onClick={() => {
                const stops = tripStore.currentTrip?.stops;
                if (stops && stops.length > 0) {
                  const lastStop = stops[stops.length - 1];
                  if (lastStop?.lat && lastStop?.lng) {
                    tripStore.loadRecommendations(lastStop.lat, lastStop.lng);
                  }
                }
              }}
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Recommendations */}
        <motion.div
          initial={{ x: 350 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[350px] border-l overflow-y-auto flex-shrink-0 bg-background"
        >
          <RecommendationsPanel
            selectedStop={
              tripStore.currentTrip?.stops && tripStore.currentTrip.stops.length > 0
                ? tripStore.currentTrip.stops[tripStore.currentTrip.stops.length - 1]?.name || "Current Location"
                : tripStore.currentTrip?.name || "Current Location"
            }
            recommendations={tripStore.recommendations}
            onAddToTrip={(rec) =>
              tripStore.addStop({
                name: rec.name,
                address: rec.description,
                lat: rec.lat,
                lng: rec.lng,
              })
            }
            isLoading={tripStore.isLoading}
            currentTrip={tripStore.currentTrip}
            onLoadRecommendations={(lat, lng) => tripStore.loadRecommendations(lat, lng)}
          />
        </motion.div>
      </div>

      {/* Bottom Panel - Trip Details */}
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="h-[150px] border-t flex-shrink-0 bg-background"
      >
        <TripDetailsDashboard
          totalDistance={tripStore.currentTrip?.totalDistance || 0}
          totalTime={tripStore.currentTrip?.totalTime || 0}
          estimatedFuelCost={tripStore.currentTrip?.estimatedFuelCost || 0}
          weatherForecasts={tripStore.weatherForecasts}
          completionPercentage={
            // Calculate completion based on trip data
            tripStore.currentTrip ? 
              Math.min(100, 
                (tripStore.currentTrip.stops?.length || 0) * 20 + // 20% per stop (up to 5 stops = 100%)
                (tripStore.currentTrip.startDate ? 15 : 0) + // 15% for start date
                (tripStore.currentTrip.endDate ? 15 : 0) + // 15% for end date
                (tripStore.currentTrip.totalDistance > 0 ? 10 : 0) // 10% for route calculation
              ) : 0
          }
          startDate={tripStore.currentTrip?.startDate}
          endDate={tripStore.currentTrip?.endDate}
          onSave={() => console.log("Saving trip...", tripStore.currentTrip)}
          onShare={() => console.log("Sharing trip...", tripStore.currentTrip)}
        />
      </motion.div>
    </div>
  );
}
