"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Search, MapPin, Info } from "lucide-react"
import { loadAttractions } from "@/lib/geo-utils"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

// Dynamically importing the MapboxMap c
const MapboxMap = dynamic(() => import("../UI/mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-wanderly-button mr-2" />
      <p>Loading map...</p>
    </div>
  ),
})

interface MapPageProps {
  onNavigate: (screen: string, params?: any) => void
  currentScreen: string
  selectedAttractionName?: string
}

// Singapore center coordinates
const SINGAPORE_CENTER = {
  lat: 1.3521,
  lng: 103.8198,
}

export default function MapPage({ onNavigate, currentScreen, selectedAttractionName }: MapPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [attractions, setAttractions] = useState<any[]>([])
  const [selectedAttraction, setSelectedAttraction] = useState<any | null>(null)
  const [locationFilter, setLocationFilter] = useState<string>("")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  const extractLocations = (attractions: any[]) => {
    const locations = attractions
      .map((attraction) => attraction.location)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)

    setAvailableLocations(locations)
  }

  useEffect(() => {
    if (attractions.length > 0) {
      extractLocations(attractions)
    }
  }, [attractions])

  // Fetch attractions from Supabase or fallback to mock data
  const fetchAttractions = async () => {
    try {
      setIsLoading(true)

      // fetching attractions from Supabase
      const { data: attractionsData, error } = await supabase.from("attractions").select("*")

      if (error) {
        console.error("Error fetching attractions from Supabase:", error)
        throw error
      }

      if (attractionsData && attractionsData.length > 0) {
        console.log("Fetched attractions from Supabase:", attractionsData)

        // Map the attractions to our expected format
        const mappedAttractions = attractionsData.map((attraction) => {
          let latitude = 0
          let longitude = 0

          if (attraction.latlong && Array.isArray(attraction.latlong) && attraction.latlong.length === 2) {
            // The values might be strings, so we need to ensure they're converted to numbers
            latitude =
              typeof attraction.latlong[0] === "string"
                ? Number.parseFloat(attraction.latlong[0])
                : attraction.latlong[0]
            longitude =
              typeof attraction.latlong[1] === "string"
                ? Number.parseFloat(attraction.latlong[1])
                : attraction.latlong[1]
          } else if (attraction.latitude && attraction.longitude) {
            // Fallback to separate latitude/longitude fields if they exist
            latitude = attraction.latitude
            longitude = attraction.longitude
          }

          return {
            id: attraction.id,
            name: attraction.name,
            description: attraction.description || "No description available",
            address: attraction.location || "Singapore",
            openingHours: attraction.opening_hours || "Hours not available",
            imageUrl: attraction.image_url || "/placeholder.svg?height=100&width=100",
            latitude: latitude,
            longitude: longitude,
            location: attraction.location || "Singapore",
          }
        })

        // Filter out attractions without coordinates
        const validAttractions = mappedAttractions.filter((attraction) => attraction.latitude && attraction.longitude)

        if (validAttractions.length > 0) {
          setAttractions(validAttractions)
          return
        } else {
          console.log("No attractions with valid coordinates found in database")
        }
      }

      const data = await loadAttractions()

      // Extract attractions from GeoJSON
      if (data && data.features) {
        const extractedAttractions = data.features
          .map((feature: any) => {
            if (!feature.geometry || !feature.geometry.coordinates) return null

            const coords = feature.geometry.coordinates
            const longitude = coords[0]
            const latitude = coords[1]

            return {
              id: feature.properties.NAME || `attraction-${Math.random().toString(36).substr(2, 9)}`,
              name: feature.properties.NAME || feature.properties.DESCRIPTION || "Unknown Attraction",
              description: feature.properties.OVERVIEW || "No description available",
              address: feature.properties.ADDRESS || "Singapore",
              openingHours: feature.properties.OPENING_HOURS || "Hours not available",
              imageUrl: feature.properties.IMAGE_PATH || "/placeholder.svg?height=100&width=100",
              latitude: latitude,
              longitude: longitude,
              location: feature.properties.ADDRESS || "Singapore",
            }
          })
          .filter(Boolean)

        setAttractions(extractedAttractions)
      } else {
        // Fallback to mock data if GeoJSON loading fails
        const mockAttractions = getMockAttractions()
        setAttractions(mockAttractions)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load map data. Using mock data instead.",
        variant: "destructive",
      })

      // Fallback to mock data
      const mockAttractions = getMockAttractions()
      setAttractions(mockAttractions)
    } finally {
      setIsLoading(false)
    }
  }

  // Get mock attractions
  const getMockAttractions = () => {
    return [
      {
        id: "1",
        name: "Gardens by the Bay",
        description: "Iconic garden with Supertree structures",
        address: "18 Marina Gardens Dr, Singapore 018953",
        openingHours: "5:00 AM - 2:00 AM",
        latitude: 1.2815,
        longitude: 103.8636,
        imageUrl: "/placeholder.svg?height=200&width=300",
        location: "Marina Bay",
      },
      {
        id: "2",
        name: "Marina Bay Sands",
        description: "Iconic hotel with rooftop infinity pool",
        address: "10 Bayfront Ave, Singapore 018956",
        openingHours: "24 hours",
        latitude: 1.2834,
        longitude: 103.8607,
        imageUrl: "/placeholder.svg?height=200&width=300",
        location: "Marina Bay",
      },
      {
        id: "3",
        name: "Singapore Zoo",
        description: "World-class zoo with open enclosures",
        address: "80 Mandai Lake Rd, Singapore 729826",
        openingHours: "8:30 AM - 6:00 PM",
        latitude: 1.4043,
        longitude: 103.793,
        imageUrl: "/placeholder.svg?height=200&width=300",
        location: "Mandai",
      },
      {
        id: "4",
        name: "Sentosa Island",
        description: "Resort island with beaches and attractions",
        address: "Sentosa Island, Singapore",
        openingHours: "24 hours",
        latitude: 1.2494,
        longitude: 103.8303,
        imageUrl: "/placeholder.svg?height=200&width=300",
        location: "Sentosa",
      },
      {
        id: "5",
        name: "Merlion Park",
        description: "Iconic statue and landmark of Singapore",
        address: "1 Fullerton Rd, Singapore 049213",
        openingHours: "24 hours",
        latitude: 1.2868,
        longitude: 103.8545,
        imageUrl: "/placeholder.svg?height=200&width=300",
        location: "Marina Bay",
      },
    ]
  }

  // Fetch attractions when component mounts
  useEffect(() => {
    fetchAttractions()
  }, [])

  useEffect(() => {
    if (attractions.length === 0) return

    const storedAttractionName = localStorage.getItem("selectedAttractionName")
    if (storedAttractionName) {
      console.log("Found attraction in localStorage:", storedAttractionName)
      // Clear it immediately to prevent it from being used again
      localStorage.removeItem("selectedAttractionName")

      const nameToUse = selectedAttractionName || storedAttractionName

      // Find the attraction by name
      selectAttractionByName(nameToUse)
    } else if (selectedAttractionName) {
      selectAttractionByName(selectedAttractionName)
    }
  }, [selectedAttractionName, attractions])

  const selectAttractionByName = (name: string) => {
    if (!name) return

    console.log("Searching for attraction:", name)
    const searchTerm = name.toLowerCase().trim()

    // First try exact match
    let attraction = attractions.find((a) => a.name?.toLowerCase() === searchTerm)

    // If no exact match, try partial match in name
    if (!attraction) {
      attraction = attractions.find((a) => a.name?.toLowerCase().includes(searchTerm))
    }

    // then in description
    if (!attraction) {
      attraction = attractions.find((a) => a.description?.toLowerCase().includes(searchTerm))
    }

    // then in location
    if (!attraction) {
      attraction = attractions.find((a) => a.location?.toLowerCase().includes(searchTerm))
    }

    if (attraction) {
      console.log("Found attraction:", attraction)
      setSelectedAttraction(attraction)
    } else {
      console.log("Attraction not found:", name)
      toast({
        title: "Not Found",
        description: `No attractions found matching "${name}". Try a different search term.`,
      })
    }
  }

  const searchByPlaceName = (placeName: string) => {
    if (!placeName.trim()) return

    console.log("Searching for:", placeName)
    const searchTerm = placeName.toLowerCase().trim()

    let attraction = attractions.find((a) => a.name.toLowerCase() === searchTerm)

    if (!attraction) {
      attraction = attractions.find((a) => a.name.toLowerCase().includes(searchTerm))
    }

    if (!attraction) {
      attraction = attractions.find((a) => a.description?.toLowerCase().includes(searchTerm))
    }

    if (!attraction) {
      attraction = attractions.find((a) => a.location?.toLowerCase().includes(searchTerm))
    }

    if (attraction) {
      console.log("Found attraction:", attraction.name)
      setSelectedAttraction(attraction)
      return
    }

    // If not found, show a message
    console.log("No attraction found for:", placeName)
    toast({
      title: "Not Found",
      description: `No attractions found matching "${placeName}". Try a different search term.`,
    })
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    searchByPlaceName(searchQuery)
  }

  // Handle search on Enter key press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Handle booking an attraction
  const handleBookAttraction = (attractionId: string) => {
    onNavigate("booking-detail", { attractionId: attractionId })
  }

  // Handle map load event
  const handleMapLoaded = () => {
    setMapLoaded(true)
    setIsLoading(false)
  }

  if (isLoading && !mapLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wanderly-button mr-2" />
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Explore Singapore</h1>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search attractions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wanderly-button"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <Button className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black" onClick={handleSearch}>
            Search
          </Button>

          {/* Location Filter Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wanderly-button appearance-none"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">All Locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 h-[calc(100vh-220px)]">
        {/* Map Container */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-lg bg-gray-100 relative">
          <MapboxMap
            center={[SINGAPORE_CENTER.lng, SINGAPORE_CENTER.lat]}
            zoom={11}
            attractions={
              locationFilter
                ? attractions.filter((a) => a.location?.toLowerCase().includes(locationFilter.toLowerCase()))
                : attractions
            }
            selectedAttraction={selectedAttraction}
            onAttractionSelect={setSelectedAttraction}
            onMapLoaded={handleMapLoaded}
          />

          {/* Custom Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-xs z-10">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-d9b3e6 mr-2"></div>
              <span>Attraction</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-c99dd6 mr-2"></div>
              <span>Selected Attraction</span>
            </div>
          </div>
        </div>

        {/* Attraction Details Panel */}
        <div className="w-96 bg-white rounded-xl shadow-lg overflow-hidden">
          {selectedAttraction ? (
            <div className="h-full flex flex-col">
              <div className="h-48 bg-gray-200 relative">
                <img
                  src={selectedAttraction.imageUrl || "/placeholder.svg?height=200&width=300"}
                  alt={selectedAttraction.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedAttraction.name}</h2>

                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-wanderly-button mt-0.5" />
                  <p className="text-gray-600">{selectedAttraction.address}</p>
                </div>

                {selectedAttraction.openingHours && (
                  <div className="flex items-start mb-4">
                    <Info className="h-5 w-5 mr-2 text-wanderly-button mt-0.5" />
                    <p className="text-gray-600">{selectedAttraction.openingHours}</p>
                  </div>
                )}

                <div className="flex items-start mb-6">
                  <Info className="h-5 w-5 mr-2 text-wanderly-button mt-0.5" />
                  <p className="text-gray-700">{selectedAttraction.description}</p>
                </div>

                <Button
                  className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-3 rounded-lg"
                  onClick={() => handleBookAttraction(selectedAttraction.id)}
                >
                  Book This Attraction
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="h-12 w-12 text-wanderly-button mb-4" />
              <h3 className="text-xl font-medium mb-2">Select an Attraction</h3>
              <p className="text-gray-600">Click on a marker on the map to view details about the attraction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
