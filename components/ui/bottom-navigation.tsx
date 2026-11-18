"use client"

import { MapIcon, HeartIcon, UserIcon, CalendarIcon, MapPinIcon } from "lucide-react"

interface BottomNavigationProps {
  currentScreen: string
  onNavigate: (screen: string) => void
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  return (
    <div className="mt-auto pt-4 border-t border-gray-200 bg-[#f0e0ff]">
      <div className="flex justify-between items-center px-4 pb-2">
        <button className="flex flex-col items-center" onClick={() => onNavigate("map")}>
          <MapIcon className={`h-6 w-6 ${currentScreen === "map" ? "text-wanderly-button" : "text-black"}`} />
          <span className={`text-xs mt-1 ${currentScreen === "map" ? "text-wanderly-button" : "text-black"}`}>Map</span>
        </button>

        <button className="flex flex-col items-center" onClick={() => onNavigate("preferences")}>
          <HeartIcon className={`h-6 w-6 ${currentScreen === "preferences" ? "text-wanderly-button" : "text-black"}`} />
          <span className={`text-xs mt-1 ${currentScreen === "preferences" ? "text-wanderly-button" : "text-black"}`}>
            Preferences
          </span>
        </button>

        <button className="flex flex-col items-center" onClick={() => onNavigate("profile")}>
          <UserIcon className={`h-6 w-6 ${currentScreen === "profile" ? "text-wanderly-button" : "text-black"}`} />
          <span className={`text-xs mt-1 ${currentScreen === "profile" ? "text-wanderly-button" : "text-black"}`}>
            Profile
          </span>
        </button>

        <button className="flex flex-col items-center" onClick={() => onNavigate("bookings")}>
          <CalendarIcon className={`h-6 w-6 ${currentScreen === "bookings" ? "text-wanderly-button" : "text-black"}`} />
          <span className={`text-xs mt-1 ${currentScreen === "bookings" ? "text-wanderly-button" : "text-black"}`}>
            Bookings
          </span>
        </button>

        <button className="flex flex-col items-center" onClick={() => onNavigate("itinerary")}>
          <MapPinIcon className={`h-6 w-6 ${currentScreen === "itinerary" ? "text-wanderly-button" : "text-black"}`} />
          <span className={`text-xs mt-1 ${currentScreen === "itinerary" ? "text-wanderly-button" : "text-black"}`}>
            Itinerary
          </span>
        </button>
      </div>
    </div>
  )
}
