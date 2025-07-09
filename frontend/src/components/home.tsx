import React from "react";
import { motion } from "framer-motion";
import InteractiveMap from "./TripPlanner/InteractiveMap";
import ItineraryPanel from "./TripPlanner/ItineraryPanel";
import RecommendationsPanel from "./TripPlanner/RecommendationsPanel";
import TripDetailsDashboard from "./TripPlanner/TripDetailsDashboard";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Search, Menu, Bell, User, MapPin, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Road Trip Planner</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative rounded-md shadow-sm max-w-xs hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-input bg-background"
              placeholder="Search destinations..."
            />
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=roadtripper"
              alt="User"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
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
          <ItineraryPanel />
        </motion.div>

        {/* Center - Map */}
        <div className="flex-1 relative overflow-hidden">
          <InteractiveMap />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md"
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
          <RecommendationsPanel />
        </motion.div>
      </div>

      {/* Bottom Panel - Trip Details */}
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="h-[150px] border-t flex-shrink-0 bg-background"
      >
        <TripDetailsDashboard />
      </motion.div>
    </div>
  );
}
