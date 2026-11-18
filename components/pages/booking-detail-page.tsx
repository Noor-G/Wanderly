"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"
import { getUserBookings, confirmBooking, cancelBooking, getBookableAttraction, createBooking } from "@/data/bookings"
import { toast } from "@/hooks/use-toast"
import { Loader2, MapPin, DollarSign, Calendar, Clock, Users, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface BookingDetailPageProps {
  onNavigate: (screen: string, params?: any) => void
  currentScreen: string
  params?: {
    id?: string
    attractionId?: string
    fromItinerary?: boolean
    attractionName?: string
    date?: string
    time?: string
    cost?: number
    location?: string
  }
}

export default function BookingDetailPage({ onNavigate, currentScreen, params }: BookingDetailPageProps) {
  const [booking, setBooking] = useState<any>(null)
  const [attraction, setAttraction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedBooking, setEditedBooking] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeClashError, setTimeClashError] = useState<string | null>(null)

  // New state for booking form
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split("T")[0], // Today's date as default
    time: "10:00",
    numberOfPeople: 1,
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // If we have a booking ID, fetch the booking details
        if (params?.id) {
          const bookings = await getUserBookings()
          const foundBooking = bookings.find((b) => b.id === params.id)

          if (!foundBooking) {
            toast({
              title: "Error",
              description: "Booking not found.",
              variant: "destructive",
            })
            onNavigate("bookings")
            return
          }

          setBooking(foundBooking)
          setEditedBooking({
            ...foundBooking,
            date: foundBooking.date,
            time: foundBooking.time,
            numberOfPeople: foundBooking.numberOfPeople,
            notes: foundBooking.notes || "",
          })
        }
        // If we have an attraction ID, fetch the attraction details
        else if (params?.attractionId) {
          const attractionData = await getBookableAttraction(params.attractionId)

          if (!attractionData) {
            toast({
              title: "Error",
              description: "Attraction not found.",
              variant: "destructive",
            })
            onNavigate("bookings")
            return
          }

          setAttraction(attractionData)
        }
        // If we have attraction details from itinerary
        else if (params?.fromItinerary && params?.attractionName) {
          setAttraction({
            id: "",
            name: params.attractionName,
            description: "",
            location: params.location || "Singapore",
            cost: params.cost || 0,
            requiresBooking: true,
          })
        } else {
          toast({
            title: "Error",
            description: "No booking or attraction information provided.",
            variant: "destructive",
          })
          onNavigate("bookings")
          return
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params, onNavigate])

  // Check for time clashes with existing bookings
  const checkTimeClash = async (date: string, time: string) => {
    try {
      const userBookings = await getUserBookings()

      const bookingsOnSameDay = userBookings.filter(
        (b) => (b.status === "confirmed" || b.status === "pending") && b.date === date,
      )

      if (bookingsOnSameDay.length === 0) return false

      const [hours, minutes] = time.split(":").map(Number)
      const timeInMinutes = hours * 60 + minutes

      // Check against existing bookings
      for (const existingBooking of bookingsOnSameDay) {
        if (!existingBooking.time) continue

        const [existingHours, existingMinutes] = existingBooking.time.split(":").map(Number)
        const existingTimeInMinutes = existingHours * 60 + existingMinutes

        // considering a conflict if within 90 minutes 
        const timeDifference = Math.abs(timeInMinutes - existingTimeInMinutes)
        if (timeDifference < 90) {
          return {
            hasClash: true,
            clashingBooking: existingBooking,
          }
        }
      }

      return false
    } catch (error) {
      console.error("Error checking time clash:", error)
      return false
    }
  }

  const handleConfirmBooking = async () => {
    try {
      setIsConfirming(true)
      const updatedBooking = await confirmBooking(booking.id)

      if (updatedBooking) {
        setBooking(updatedBooking)
        toast({
          title: "Success",
          description: "Booking confirmed successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to confirm booking. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast({
        title: "Error",
        description: "Failed to confirm booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancelBooking = async () => {
    try {
      setIsCancelling(true)
      const success = await cancelBooking(booking.id)

      if (success) {
        setBooking({
          ...booking,
          status: "cancelled",
        })
        toast({
          title: "Success",
          description: "Booking cancelled successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleUpdateBooking = async () => {
    try {
      setIsUpdating(true)

      // Check if booking date is in the past
      const bookingDate = new Date(editedBooking.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (bookingDate < today) {
        toast({
          title: "Error",
          description: "Cannot modify bookings for past dates.",
          variant: "destructive",
        })
        setIsUpdating(false)
        return
      }

      setBooking({
        ...booking,
        date: editedBooking.date,
        time: editedBooking.time,
        numberOfPeople: editedBooking.numberOfPeople,
        notes: editedBooking.notes,
      })

      setIsEditMode(false)

      toast({
        title: "Success",
        description: "Booking updated successfully!",
      })
    } catch (error) {
      console.error("Error updating booking:", error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingForm({
      ...bookingForm,
      [name]: name === "numberOfPeople" ? Number.parseInt(value) || 1 : value,
    })

    // Clear time clash error when date or time changes
    if (name === "date" || name === "time") {
      setTimeClashError(null)
    }
  }

  // Handle booking creation
  const handleCreateBooking = async () => {
    try {
      setIsSubmitting(true)
      setTimeClashError(null)

      // Check for time clashes
      const clash = await checkTimeClash(bookingForm.date, bookingForm.time)

      if (clash && clash.hasClash) {
        const clashingBooking = clash.clashingBooking
        setTimeClashError(
          `This time conflicts with your existing booking for "${clashingBooking.attractionName}" at ${clashingBooking.time}. Please select a different time.`,
        )
        setIsSubmitting(false)
        return
      }

      // Create booking object
      const newBooking = {
        attractionId: attraction.id,
        attractionName: attraction.name,
        date: bookingForm.date,
        time: bookingForm.time,
        numberOfPeople: bookingForm.numberOfPeople,
        notes: bookingForm.notes,
        cost: attraction.cost || 0,
        location: attraction.location || "Singapore",
      }

      // Call API to create booking
      const result = await createBooking(newBooking)

      if (result) {
        toast({
          title: "Success",
          description: "Booking created successfully!",
        })

        // Navigate to booking confirmation
        onNavigate("booking-confirmation", {
          attractionName: attraction.name,
          date: bookingForm.date,
          time: bookingForm.time,
          location: attraction.location,
        })
      } else {
        throw new Error("Failed to create booking")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wanderly-button" />
          <p className="ml-2">Loading details...</p>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  // Render booking form for new bookings
  if (attraction && !booking) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6">Book Attraction</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{attraction.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{attraction.location || "Singapore"}</span>
              </div>

              {attraction.description && <p className="text-gray-700 mb-4">{attraction.description}</p>}

              {attraction.cost > 0 && (
                <div className="flex items-center text-gray-800 mb-4">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span className="font-semibold">${attraction.cost.toFixed(2)}</span>
                </div>
              )}

              {timeClashError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p>{timeClashError}</p>
                </div>
              )}

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block h-4 w-4 mr-2" />
                    Date
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="inline-block h-4 w-4 mr-2" />
                    Time
                  </label>
                  <Input
                    type="time"
                    name="time"
                    value={bookingForm.time}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users className="inline-block h-4 w-4 mr-2" />
                    Number of People
                  </label>
                  <Input
                    type="number"
                    name="numberOfPeople"
                    value={bookingForm.numberOfPeople}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Info className="inline-block h-4 w-4 mr-2" />
                    Notes (Optional)
                  </label>
                  <Textarea
                    name="notes"
                    value={bookingForm.notes}
                    onChange={handleInputChange}
                    placeholder="Any special requests or notes"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button
              className="flex-1 bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
              onClick={handleCreateBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>

            <Button
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black"
              onClick={() => onNavigate("bookings")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="bg-wanderly-background flex flex-col min-h-[500px]">
        <AppHeader />
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          <p className="text-center mb-4">Booking not found.</p>
          <Button
            className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
            onClick={() => onNavigate("bookings")}
          >
            Go to Bookings
          </Button>
        </div>
        <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col">
        <h1 className="text-2xl font-bold text-black mb-4">Booking Details</h1>

        {isEditMode ? (
          // Edit mode view
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">{booking.attractionName}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editedBooking.date}
                    onChange={(e) => setEditedBooking({ ...editedBooking, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editedBooking.time}
                    onChange={(e) => setEditedBooking({ ...editedBooking, time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editedBooking.numberOfPeople}
                    onChange={(e) =>
                      setEditedBooking({ ...editedBooking, numberOfPeople: Number.parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editedBooking.notes}
                    onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <Button
                  className="flex-1 bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                  onClick={handleUpdateBooking}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black"
                  onClick={() => setIsEditMode(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // View mode (existing code with added Edit button)
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{booking.attractionName}</h2>

              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{booking.location || "Location not specified"}</span>
              </div>

              {booking.notes && <p className="text-gray-700 mb-3">{booking.notes}</p>}

              <div className="flex items-center text-gray-800 mb-3">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="font-semibold">
                  {booking.cost ? `$${booking.cost.toFixed(2)}` : "Price not available"}
                </span>
              </div>

              <div className="bg-gray-100 p-3 rounded-md mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Booking Date</p>
                    <p className="font-medium">{booking.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p
                      className={`font-medium ${
                        booking.status === "confirmed"
                          ? "text-green-600"
                          : booking.status === "cancelled"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {(() => {
                const bookingDate = new Date(booking.date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                if (bookingDate >= today && booking.status !== "cancelled") {
                  return (
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1 bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                        onClick={() => setIsEditMode(true)}
                      >
                        Edit Booking
                      </Button>

                      {booking.status === "pending" && (
                        <Button
                          className="flex-1 bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                          onClick={handleConfirmBooking}
                          disabled={isConfirming}
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            "Confirm Booking"
                          )}
                        </Button>
                      )}

                      <Button
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700"
                        onClick={handleCancelBooking}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  )
                } else if (booking.status === "confirmed") {
                  return (
                    <Button
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700"
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Booking"
                      )}
                    </Button>
                  )
                }

                return null
              })()}
            </div>
          </div>
        )}

        <Button className="bg-gray-200 hover:bg-gray-300 text-black" onClick={() => onNavigate("bookings")}>
          Back to Bookings
        </Button>
      </div>

      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
