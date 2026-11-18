"use client"

import { Button } from "@/components/ui/button"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"
import { Check, Calendar, Clock, MapPin } from "lucide-react"

interface BookingConfirmationPageProps {
  onNavigate: (screen: string) => void
  currentScreen: string
  params?: {
    attractionName?: string
    date?: string
    time?: string
    location?: string
  }
}

export default function BookingConfirmationPage({ onNavigate, currentScreen, params }: BookingConfirmationPageProps) {
  const handleReturn = () => {
    // Navigate to bookings page instead of bookings-manage
    onNavigate("bookings")
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <div className="mb-6 border-2 border-black rounded-full p-4">
          <Check className="h-8 w-8 text-black" />
        </div>

        <h2 className="text-xl font-medium text-center mb-4">Booking Confirmed!</h2>

        {params && (
          <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md mb-6">
            <h3 className="font-bold text-lg mb-2">{params.attractionName || "Attraction"}</h3>
            {params.location && (
              <div className="flex items-center text-sm mb-2">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span>{params.location}</span>
              </div>
            )}
            {params.date && (
              <div className="flex items-center text-sm mb-2">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span>{params.date}</span>
              </div>
            )}
            {params.time && (
              <div className="flex items-center text-sm mb-2">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>{params.time}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-gray-600 mb-8">
          Your booking has been confirmed. You can view and manage your bookings in the "My Bookings" tab.
        </p>

        <Button
          className="w-full max-w-xs bg-[#d9b3e6] hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
          onClick={handleReturn}
        >
          Return
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
