"use client"

import type { ReactNode } from "react"
import { MapIcon, HeartIcon, UserIcon, CalendarIcon, MapPinIcon, LogOutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import LocationPinIcon from "@/components/UI/location-pin-icon"
import { logout } from "@/data/auth"

interface DashboardLayoutProps {
  children: ReactNode
  currentScreen: string
  onNavigate: (screen: string) => void
}

export default function DashboardLayout({ children, currentScreen, onNavigate }: DashboardLayoutProps) {
  const handleLogout = async () => {
    try {
      // Check if we're in demo mode
      const demoUser = localStorage.getItem("demoUser")
      if (demoUser) {
        console.log("Logging out demo user")
        localStorage.removeItem("demoUser")
        onNavigate("welcome")
        return
      }

      // Otherwise use the regular logout
      await logout()
      onNavigate("welcome")
    } catch (error) {
      console.error("Error logging out:", error)
      // Fallback: remove demo user and navigate to welcome
      localStorage.removeItem("demoUser")
      onNavigate("welcome")
    }
  }

  const navItems = [
    { name: "Map", icon: MapIcon, screen: "map" },
    { name: "Preferences", icon: HeartIcon, screen: "preferences" },
    { name: "Profile", icon: UserIcon, screen: "profile" },
    { name: "Bookings", icon: CalendarIcon, screen: "bookings" },
    { name: "Itinerary", icon: MapPinIcon, screen: "itinerary" },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#f0e0ff] py-4 px-6 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <LocationPinIcon className="h-8 w-8 mr-3 text-black" />
          <span className="font-bold text-2xl text-black">WANDERLY</span>
        </div>
        <button onClick={handleLogout} className="flex items-center text-gray-700 hover:text-black">
          <LogOutIcon className="h-5 w-5 mr-2" />
          <span>Logout</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation */}
        <nav className="w-64 bg-white shadow-md p-6">
          <div className="space-y-6">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={cn(
                  "flex items-center w-full p-3 rounded-lg transition-colors",
                  currentScreen === item.screen ? "bg-[#d9b3e6] text-black" : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-wanderly-background p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
