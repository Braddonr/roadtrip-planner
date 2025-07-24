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
      tripStore.loadWeatherForecasts();
      if (
        tripStore.currentTrip.stops &&
        tripStore.currentTrip.stops.length > 0
      ) {
        const lastStop =
          tripStore.currentTrip.stops[tripStore.currentTrip.stops.length - 1];
        if (lastStop.lat && lastStop.lng) {
          tripStore.loadRecommendations(lastStop.lat, lastStop.lng);
        }
      }
    }
  }, [tripStore.currentTrip]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search.searchPlaces(searchQuery);
    }
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
          <form
            onSubmit={handleSearch}
            className="relative rounded-md shadow-sm max-w-xs hidden md:block"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-input bg-background"
              placeholder="Search destinations..."
            />
          </form>
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
              selectedStopId
                ? tripStore.currentTrip?.stops?.find(
                    (s) => s.id === selectedStopId
                  )?.name || "Current Location"
                : "Current Location"
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
          startDate={tripStore.currentTrip?.startDate}
          endDate={tripStore.currentTrip?.endDate}
          onSave={() => console.log("Saving trip...", tripStore.currentTrip)}
          onShare={() => console.log("Sharing trip...", tripStore.currentTrip)}
        />
      </motion.div>
    </div>
  );
}
