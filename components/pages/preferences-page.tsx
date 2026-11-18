"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getUserData, updateUserPreferences, saveTripDetails } from "@/data/users"
import { generateItinerary } from "@/data/itinerary"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/supabase"

interface PreferencesPageProps {
  onNavigate: (screen: string) => void
  currentScreen: string
}

// Preference categories from the database
const PREFERENCE_CATEGORIES = [
  { id: "1", name: "shopping_luxury" },
  { id: "2", name: "arts_entertainment" },
  { id: "3", name: "nature_adventure" },
  { id: "4", name: "cultural_heritage" },
  { id: "5", name: "family_fun" },
  { id: "6", name: "historical_memorials" },
  { id: "7", name: "no_preference" },
]

export default function PreferencesPage({ onNavigate, currentScreen }: PreferencesPageProps) {
  const [step, setStep] = useState(1)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [tripDetails, setTripDetails] = useState({
    budget: "",
    date: new Date().toISOString().split("T")[0], // Set today as default date
    duration: "1",
    people: "",
    location: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [availablePreferences, setAvailablePreferences] = useState<{ id: string; name: string }[]>([])
  const [dbError, setDbError] = useState<string | null>(null)

  // Fetch available preferences and user preferences on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        console.log("Fetching preferences data...")

        const cachedPrefs = localStorage.getItem("availablePreferences")
        if (cachedPrefs) {
          try {
            const parsedPrefs = JSON.parse(cachedPrefs)
            if (Array.isArray(parsedPrefs) && parsedPrefs.length > 0) {
              console.log("Using cached preferences:", parsedPrefs)
              setAvailablePreferences(parsedPrefs)

              fetchPreferencesFromDB()

              // Try to get user preferences
              await fetchUserPreferences()

              setIsLoading(false)
              return
            }
          } catch (e) {
            console.error("Error parsing cached preferences:", e)
          }
        }

        await fetchPreferencesFromDB()

        // Try to get user preferences
        await fetchUserPreferences()
      } catch (error) {
        console.error("Error in fetchData:", error)
        // Use default preferences as fallback
        setAvailablePreferences(PREFERENCE_CATEGORIES)
        toast({
          title: "Warning",
          description: "Using default preferences due to a connection issue.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchPreferencesFromDB = async () => {
      try {
        console.log("Fetching preferences from database...")
        const { data: prefCategories, error: prefError } = await supabase
          .from("preference_categories")
          .select("id, name")

        console.log("Preference categories response:", { data: prefCategories, error: prefError })

        if (prefError) {
          setDbError(prefError.message)
          throw new Error(`Error fetching preference categories: ${prefError.message}`)
        }

        if (!prefCategories || prefCategories.length === 0) {
          console.log("No preference categories found in database, using defaults")
          setAvailablePreferences(PREFERENCE_CATEGORIES)
        } else {
          console.log("Setting preferences from database:", prefCategories)
          setAvailablePreferences(prefCategories)
          // Cache the preferences
          localStorage.setItem("availablePreferences", JSON.stringify(prefCategories))
        }
      } catch (error) {
        console.error("Error in fetchPreferencesFromDB:", error)
        setAvailablePreferences(PREFERENCE_CATEGORIES)
      }
    }

    const fetchUserPreferences = async () => {
      try {
        console.log("Fetching user preferences...")
        const user = await getUserData()
        console.log("User data:", user)

        if (user.preferences && user.preferences.length > 0) {
          console.log("Setting user preferences:", user.preferences)
          setSelectedInterests(user.preferences)
        } else {
          // Try to get from localStorage
          const localPrefs = localStorage.getItem("userPreferences")
          if (localPrefs) {
            try {
              const parsedPrefs = JSON.parse(localPrefs)
              if (Array.isArray(parsedPrefs) && parsedPrefs.length > 0) {
                console.log("Using cached user preferences:", parsedPrefs)
                setSelectedInterests(parsedPrefs)
              }
            } catch (e) {
              console.error("Error parsing cached user preferences:", e)
            }
          }
        }
      } catch (userError) {
        console.error("Error fetching user preferences:", userError)
      }
    }

    fetchData()
  }, [])

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest))
    } else {
      setSelectedInterests([...selectedInterests, interest])
    }

    // Save to localStorage for backup
    localStorage.setItem(
      "userPreferences",
      JSON.stringify(
        selectedInterests.includes(interest)
          ? selectedInterests.filter((item) => item !== interest)
          : [...selectedInterests, interest],
      ),
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setTripDetails({ ...tripDetails, [field]: value })
  }

  const handleNext = async () => {
    // Save preferences before moving to next step please
    try {
      setIsSaving(true)
      setDbError(null)

      try {
        console.log("Saving preferences:", selectedInterests)
        await updateUserPreferences(selectedInterests)
        console.log("Preferences saved to database successfully")

        // Show success toast
        toast({
          title: "Success",
          description: "Your preferences have been saved.",
        })
      } catch (error: any) {
        console.error("Error saving preferences to database:", error)

        // error message
        setDbError(error.message || "Failed to save preferences to database")

        // Show warning toast
        toast({
          title: "Warning",
          description: "Preferences saved locally only. Some features may be limited.",
          variant: "destructive",
        })
      }

      // Always proceed to next step, even if there was an error
      setStep(2)
    } catch (error: any) {
      console.error("Error in handleNext:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save your preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update the handleGenerateItinerary function to handle errors better
  const handleGenerateItinerary = async () => {
    // Validate all fields are required
    if (!tripDetails.budget || !tripDetails.people || !tripDetails.location || !tripDetails.duration) {
      toast({
        title: "Missing information",
        description: "All fields are required to generate your itinerary.",
        variant: "destructive",
      })
      return
    }

    // Validate budget is not less than 0
    if (Number(tripDetails.budget) <= 0) {
      toast({
        title: "Invalid budget",
        description: "Budget cannot be less than or equal to 0.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setDbError(null)

    try {
      // Check if user is authenticated
      const user = await getCurrentUser()
      console.log("Current user:", user ? user.id : "Not authenticated")

      if (!user) {
        toast({
          title: "Authentication",
          description: "You're not logged in. Your preferences will be saved locally.",
        })
      }

      // Format the trip details for better compatibility
      const formattedTripDetails = {
        budget: tripDetails.budget,
        date: tripDetails.date,
        duration: tripDetails.duration,
        people: tripDetails.people,
        location: tripDetails.location,
      }

      console.log("Formatted trip details:", formattedTripDetails)

      // Save trip details to trip_preferences table
      try {
        await saveTripDetails(formattedTripDetails)
        console.log("Trip details saved successfully")

        toast({
          title: "Success",
          description: "Your trip preferences have been saved.",
        })
      } catch (error: any) {
        console.error("Error saving trip details:", error)
        setDbError(error.message || "Failed to save trip details to database")

        toast({
          title: "Warning",
          description: "Trip details saved locally only. Some features may be limited.",
          variant: "destructive",
        })
      }

      // Always store in localStorage as a backup
      localStorage.setItem("tripDetails", JSON.stringify(formattedTripDetails))

      // Generate itinerary based on preferences and trip details
      console.log("Generating itinerary with:", {
        interests: selectedInterests,
        tripDetails: formattedTripDetails,
      })

      try {
        const generatedItinerary = await generateItinerary({
          interests: selectedInterests,
          tripDetails: formattedTripDetails,
        })

        console.log("Itinerary generated:", generatedItinerary)

        // Set flag that itinerary has been generated
        localStorage.setItem("itineraryGenerated", "true")

        localStorage.setItem("currentItinerary", JSON.stringify(generatedItinerary))

        toast({
          title: "Success!",
          description: "Your itinerary has been generated.",
        })

        // Navigate to itinerary page
        onNavigate("itinerary")
      } catch (itineraryError: any) {
        console.error("Error generating itinerary:", itineraryError)

        // Create a basic mock itinerary
        const mockItinerary = {
          id: `local-${Date.now()}`,
          name: `Trip to ${tripDetails.location}`,
          totalCost: 500,
          days: [
            {
              id: "day-1",
              dayNumber: 1,
              date: tripDetails.date,
              totalCost: 250,
              items: [
                {
                  id: "item-1",
                  title: "Breakfast at Hotel",
                  time: "08:00 AM",
                  cost: 25,
                  location: tripDetails.location,
                  order: 1,
                },
                {
                  id: "item-2",
                  title: "Local Sightseeing",
                  time: "10:00 AM",
                  cost: 50,
                  location: "City Center",
                  order: 2,
                },
                {
                  id: "item-3",
                  title: "Lunch at Local Restaurant",
                  time: "01:00 PM",
                  cost: 35,
                  location: "City Center",
                  order: 3,
                },
                {
                  id: "item-4",
                  title: "Visit Museum",
                  time: "03:00 PM",
                  cost: 20,
                  location: "City Museum",
                  order: 4,
                },
                {
                  id: "item-5",
                  title: "Dinner",
                  time: "07:00 PM",
                  cost: 60,
                  location: "Restaurant District",
                  order: 5,
                },
              ],
            },
          ],
        }

        // Set flag that itinerary has been generated
        localStorage.setItem("itineraryGenerated", "true")

        localStorage.setItem("currentItinerary", JSON.stringify(mockItinerary))

        toast({
          title: "Warning",
          description: "There was an issue, but we've created a sample itinerary for you.",
        })

        onNavigate("itinerary")
      }
    } catch (error: any) {
      console.error("Error in handleGenerateItinerary:", error)

      // Create a fallback itinerary
      const fallbackItinerary = {
        id: `fallback-${Date.now()}`,
        name: `Trip to ${tripDetails.location || "Destination"}`,
        totalCost: 500,
        days: [
          {
            id: "day-1",
            dayNumber: 1,
            date: tripDetails.date || new Date().toISOString().split("T")[0],
            totalCost: 250,
            items: [
              {
                id: "item-1",
                title: "Breakfast at Hotel",
                time: "08:00 AM",
                cost: 25,
                location: tripDetails.location || "Hotel",
                order: 1,
              },
              {
                id: "item-2",
                title: "Local Sightseeing",
                time: "10:00 AM",
                cost: 50,
                location: "City Center",
                order: 2,
              },
              {
                id: "item-3",
                title: "Lunch at Local Restaurant",
                time: "01:00 PM",
                cost: 35,
                location: "City Center",
                order: 3,
              },
              {
                id: "item-4",
                title: "Visit Museum",
                time: "03:00 PM",
                cost: 20,
                location: "City Museum",
                order: 4,
              },
              {
                id: "item-5",
                title: "Dinner",
                time: "07:00 PM",
                cost: 60,
                location: "Restaurant District",
                order: 5,
              },
            ],
          },
        ],
      }

      // Set flag that itinerary has been generated
      localStorage.setItem("itineraryGenerated", "true")

      localStorage.setItem("currentItinerary", JSON.stringify(fallbackItinerary))

      toast({
        title: "Warning",
        description: "There was an issue, but we've created a sample itinerary for you.",
      })

      // Navigate to itinerary page even if there was an error
      onNavigate("itinerary")
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wanderly-button" />
          <p className="ml-2">Loading preferences...</p>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center mb-4">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="mr-2">
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-black">Preferences</h1>
        </div>

        {dbError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Database Connection Issue</p>
            <p className="text-sm">Using local storage as fallback. Some features may be limited.</p>
            <p className="text-xs mt-1">{dbError}</p>
          </div>
        )}

        {step === 1 ? (
          <div className="flex-1">
            {availablePreferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-center mb-4">No preferences available. Please try again later.</p>
                <Button
                  className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8">
                  {availablePreferences.map((preference) => (
                    <div
                      key={preference.id}
                      className="bg-[#d9b3e6] p-3 rounded-md flex items-center cursor-pointer"
                      onClick={() => toggleInterest(preference.name)}
                    >
                      <div className="h-5 w-5 rounded-full border border-black flex items-center justify-center mr-3">
                        {selectedInterests.includes(preference.name) && (
                          <div className="h-3 w-3 rounded-full bg-black"></div>
                        )}
                      </div>
                      <span>{preference.name}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
                  onClick={handleNext}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Next"
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <div className="space-y-4 mb-8">
              <div className="bg-[#d9b3e6] p-3 rounded-md">
                <label className="text-black font-medium block mb-1">Budget:</label>
                <input
                  type="text"
                  className="w-full bg-transparent outline-none text-black"
                  value={tripDetails.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>

              <div className="bg-[#d9b3e6] p-3 rounded-md">
                <label className="text-black font-medium block mb-1">Duration (days):</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="w-full bg-transparent outline-none text-black"
                  value={tripDetails.duration || "1"}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>

              <div className="bg-[#d9b3e6] p-3 rounded-md">
                <label className="text-black font-medium block mb-1">No. of people:</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-transparent outline-none text-black"
                  value={tripDetails.people}
                  onChange={(e) => handleInputChange("people", e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>

              <div className="bg-[#d9b3e6] p-3 rounded-md">
                <label className="text-black font-medium block mb-1">Location of stay:</label>
                <input
                  type="text"
                  className="w-full bg-transparent outline-none text-black"
                  value={tripDetails.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g. Marina Bay Sands"
                />
              </div>
            </div>

            {/* Generate Itinerary button with loading state */}
            <Button
              className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
              onClick={handleGenerateItinerary}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Itinerary...
                </>
              ) : (
                "Generate Itinerary"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
