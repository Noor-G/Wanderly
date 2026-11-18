"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"
import ItineraryView from "@/components/itinerary/itinerary-view"
import { getCurrentItinerary } from "@/data/itinerary"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ItineraryPageProps {
  onNavigate: (screen: string, params?: any) => void
  currentScreen: string
}

export default function ItineraryPage({ onNavigate, currentScreen }: ItineraryPageProps) {
  const [itinerary, setItinerary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setIsLoading(true)

        // Try to get itinerary from database
        const data = await getCurrentItinerary()

        if (data) {
          console.log("Fetched itinerary from database:", data)
          setItinerary(data)
          return
        }

        // If no itinerary in database, try localStorage
        const localItinerary = localStorage.getItem("currentItinerary")
        if (localItinerary) {
          try {
            const parsedItinerary = JSON.parse(localItinerary)
            console.log("Using itinerary from localStorage:", parsedItinerary)
            setItinerary(parsedItinerary)
            return
          } catch (e) {
            console.error("Error parsing itinerary from localStorage:", e)
          }
        }

        console.log("No itinerary found")
      } catch (error) {
        console.error("Error fetching itinerary:", error)
        toast({
          title: "Error",
          description: "Failed to load itinerary. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchItinerary()
  }, [])

  const handleItineraryUpdate = (updatedItinerary: any) => {
    setItinerary(updatedItinerary)
  }

  if (isLoading) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wanderly-button" />
          <p className="ml-2">Loading itinerary...</p>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          <p className="text-center mb-4">No itinerary found. Create one in the Preferences section.</p>
          <Button
            className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
            onClick={() => onNavigate("preferences")}
          >
            Go to Preferences
          </Button>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 overflow-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Your Itinerary</h1>

        <ItineraryView itinerary={itinerary} onNavigate={onNavigate} onItineraryUpdate={handleItineraryUpdate} />
      </div>

      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
