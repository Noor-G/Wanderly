"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"
import { getUserBookings, getBookableAttractions, getRecommendedBookings } from "@/data/bookings"
import type { Booking, BookableAttraction } from "@/data/bookings/types"
import { Calendar, MapPin, Clock, Users, Loader2, DollarSign } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BookingsPageProps {
  onNavigate: (screen: string, params?: any) => void
  currentScreen: string
}

export default function BookingsPage({ onNavigate, currentScreen }: BookingsPageProps) {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [attractions, setAttractions] = useState<BookableAttraction[]>([])
  const [recommendedAttractions, setRecommendedAttractions] = useState<BookableAttraction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch user bookings
        const userBookings = await getUserBookings()
        setBookings(userBookings)

        // Fetch bookable attractions
        const bookableAttractions = await getBookableAttractions()
        setAttractions(bookableAttractions)

        // Fetch recommended attractions from the attractions table
        const recommended = await getRecommendedBookings()
        setRecommendedAttractions(recommended)
      } catch (error: any) {
        console.error("Error fetching bookings data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load bookings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleBookAttraction = (attractionId: string) => {
    // Navigate to booking detail page with the attraction ID
    onNavigate("booking-detail", { attractionId })
  }

  // Filter bookings based on status and date
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to beginning of day for accurate comparison

  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date)
    return (booking.status === "confirmed" || booking.status === "pending") && bookingDate >= today
  })

  const pastBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date)
    return booking.status === "completed" || booking.status === "cancelled" || bookingDate < today
  })

  if (isLoading) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wanderly-button mr-2" />
          <p>Loading bookings...</p>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Bookings</h1>

        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any upcoming bookings</p>
                <Button
                  className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                  onClick={() => setActiveTab("explore")}
                >
                  Explore Attractions
                </Button>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-bold text-lg mb-2">{booking.attractionName}</h3>
                  <div className="flex items-center text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{booking.location || "Singapore"}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {booking.numberOfPeople} {booking.numberOfPeople === 1 ? "person" : "people"}
                      </span>
                    </div>
                    {booking.cost > 0 && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>S${booking.cost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                        onClick={() => onNavigate("booking-detail", { id: booking.id })}
                      >
                        Modify
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You don't have any past bookings</p>
              </div>
            ) : (
              pastBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-bold text-lg mb-2">{booking.attractionName}</h3>
                  <div className="flex items-center text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{booking.location || "Singapore"}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{booking.time}</span>
                    </div>
                    {booking.cost > 0 && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>S${booking.cost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        booking.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="explore" className="space-y-4">
            <h2 className="font-bold text-lg mb-2">Recommended Attractions</h2>
            <div className="space-y-4">
              {recommendedAttractions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No recommendations available</p>
                </div>
              ) : (
                recommendedAttractions.map((attraction) => (
                  <div key={attraction.id} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-bold text-lg mb-2">{attraction.name}</h3>
                    <div className="flex items-center text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{attraction.location}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{attraction.description}</p>
                    {attraction.cost > 0 && (
                      <div className="flex items-center text-sm mb-4">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>From S${attraction.cost.toFixed(2)}</span>
                      </div>
                    )}
                    <Button
                      className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                      onClick={() => handleBookAttraction(attraction.id)}
                    >
                      Book Now
                    </Button>
                  </div>
                ))
              )}
            </div>

            <h2 className="font-bold text-lg mb-2 mt-8">All Attractions</h2>
            <div className="space-y-4">
              {attractions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No attractions available</p>
                </div>
              ) : (
                attractions.map((attraction) => (
                  <div key={attraction.id} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-bold text-lg mb-2">{attraction.name}</h3>
                    <div className="flex items-center text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{attraction.location}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{attraction.description}</p>
                    {attraction.cost > 0 && (
                      <div className="flex items-center text-sm mb-4">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>From S${attraction.cost.toFixed(2)}</span>
                      </div>
                    )}
                    <Button
                      className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                      onClick={() => handleBookAttraction(attraction.id)}
                    >
                      Book Now
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
