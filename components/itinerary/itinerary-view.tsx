"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Clock, MapPin, Plus, X } from "lucide-react"
import { addItineraryItem, removeItineraryItem } from "@/data/itinerary"
import { toast } from "@/hooks/use-toast"
import type { Itinerary, ItineraryDay, ItineraryItem } from "@/data/itinerary/types"
import { createBookingFromItineraryItem } from "@/data/bookings"

interface ItineraryViewProps {
  itinerary: Itinerary
  onNavigate: (screen: string, params?: any) => void
  onItineraryUpdate: (updatedItinerary: Itinerary) => void
}

export default function ItineraryView({ itinerary, onNavigate, onItineraryUpdate }: ItineraryViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({
    title: "",
    time: "",
    cost: 0,
    location: "",
  })
  const [isAddingItem, setIsAddingItem] = useState(false)

  // Add state for confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [itemToBook, setItemToBook] = useState<ItineraryItem | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  // Check for time conflicts
  const checkTimeConflict = (time: string, dayId: string): boolean => {
    if (!time) return false

    // Find the day with the given ID
    const day = itinerary.days.find((d) => d.id === dayId)
    if (!day) return false

    // Convert input time to minutes for easier comparison
    const [hours, minutes] = time.split(":").map(Number)
    const timeInMinutes = hours * 60 + minutes

    // Check against existing items
    for (const item of day.items) {
      if (!item.time) continue

      const [itemHours, itemMinutes] = item.time.split(":").map(Number)
      const itemTimeInMinutes = itemHours * 60 + itemMinutes

      // Consider a conflict if within 60 minutes (1 hour)
      const timeDifference = Math.abs(timeInMinutes - itemTimeInMinutes)
      if (timeDifference < 60) {
        return true
      }
    }

    return false
  }

  const handleAddItem = async () => {
    if (!selectedDay) {
      toast({
        title: "Error",
        description: "Please select a day first.",
        variant: "destructive",
      })
      return
    }

    if (!newItem.title) {
      toast({
        title: "Error",
        description: "Please enter a title for the item.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingItem(true)

      // Find the day object for the selected day
      const day = itinerary.days.find((d) => d.dayNumber === selectedDay)
      if (!day) {
        throw new Error("Selected day not found")
      }

      // Format time properly if provided
      let formattedTime = newItem.time
      if (formattedTime) {
        // Ensure time is in HH:MM format
        const [hours, minutes] = formattedTime.split(":").map(Number)
        formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

        // Check for time conflicts
        if (checkTimeConflict(formattedTime, day.id)) {
          toast({
            title: "Time Conflict",
            description: "There is already an activity scheduled around this time. Please choose a different time.",
            variant: "destructive",
          })
          setIsAddingItem(false)
          return
        }
      }

      // Calculate the next order number
      const nextOrder = day.items.length > 0 ? Math.max(...day.items.map((i) => i.order)) + 1 : 1

      // Add the item
      const updatedItinerary = await addItineraryItem(day.id, {
        title: newItem.title,
        time: formattedTime,
        cost: typeof newItem.cost === "number" ? newItem.cost : Number.parseFloat(newItem.cost as string) || 0,
        location: newItem.location || undefined,
        notes: newItem.notes || undefined,
        order: nextOrder,
        date: day.date,
      })

      if (updatedItinerary) {
        onItineraryUpdate(updatedItinerary)

        // Reset form
        setNewItem({
          title: "",
          time: "",
          cost: 0,
          location: "",
        })

        // Hide the form after successful addition
        setShowAddForm(false)

        toast({
          title: "Success",
          description: "Item added to itinerary.",
        })
      } else {
        throw new Error("Failed to update itinerary")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedItinerary = await removeItineraryItem(itemId)
      if (updatedItinerary) {
        onItineraryUpdate(updatedItinerary)
        toast({
          title: "Item Removed",
          description: "The item has been removed from your itinerary.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from itinerary.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Function to handle booking confirmation
  const handleBookNow = async (item: ItineraryItem) => {
    setItemToBook(item)
    setShowConfirmation(true)
  }

  // Function to confirm booking
  const confirmBooking = async () => {
    if (!itemToBook) return

    setIsBooking(true)
    try {
      // Show loading toast
      toast({
        title: "Creating booking...",
        description: "Please wait while we process your booking.",
      })

      // Create booking directly from itinerary item
      const result = await createBookingFromItineraryItem(itemToBook)

      if (result) {
        // Show success toast
        toast({
          title: "Booking Created!",
          description: "Your booking has been successfully created.",
        })

        // Navigate to booking confirmation
        onNavigate("booking-confirmation", {
          attractionName: itemToBook.title,
          date: itemToBook.date,
          time: itemToBook.time,
          location: itemToBook.location,
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
      setIsBooking(false)
      setShowConfirmation(false)
      setItemToBook(null)
    }
  }

  // Function to cancel booking
  const cancelBooking = () => {
    setShowConfirmation(false)
    setItemToBook(null)
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {/* Total Cost Display */}
        <div className="flex justify-end mb-4">
          <span className="text-sm font-normal text-gray-500">Total: ${itinerary.totalCost?.toFixed(2) || "0.00"}</span>
        </div>

        {/* Add Attraction Button */}
        <div className="mb-4">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
          >
            {showAddForm ? (
              <>
                <X className="mr-2 h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add Attraction
              </>
            )}
          </Button>
        </div>

        {/* Add New Item Form - Only shown when showAddForm is true */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-2xl font-bold mb-4">Add New Item</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Visit Museum"
                  value={newItem.title || ""}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={newItem.time || ""}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="e.g., 25"
                  value={newItem.cost || ""}
                  onChange={(e) => setNewItem({ ...newItem, cost: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="e.g., City Museum"
                    value={newItem.location || ""}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                disabled={isAddingItem}
              >
                {isAddingItem ? "Adding..." : "Add to Itinerary"}
              </Button>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            {itinerary.days.map((day) => (
              <TabsTrigger key={day.id} value={day.dayNumber.toString()} onClick={() => setSelectedDay(day.dayNumber)}>
                Day {day.dayNumber} ({day.date})
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content for each day */}
          {itinerary.days.map((day) => (
            <TabsContent key={day.id} value={day.dayNumber.toString()}>
              <DayView day={day} onRemoveItem={handleRemoveItem} onBookNow={handleBookNow} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Confirmation Dialog */}
        {showConfirmation && itemToBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Are you sure you want to book "{itemToBook.title}"?</h3>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelBooking}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBooking}
                  disabled={isBooking}
                  className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DayViewProps {
  day: ItineraryDay
  onRemoveItem: (itemId: string) => void
  onBookNow: (item: ItineraryItem) => void
}

function DayView({ day, onRemoveItem, onBookNow }: DayViewProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Day {day.dayNumber} - {day.date}
        </h2>
        <span className="text-sm text-gray-500">Total: ${day.totalCost?.toFixed(2) || "0.00"}</span>
      </div>

      {/* Itinerary Items for the day */}
      {day.items.length > 0 ? (
        day.items
          .sort((a, b) => {
            if (!a.time) return 1
            if (!b.time) return -1
            return a.time > b.time ? 1 : -1
          })
          .map((item) => (
            <div key={item.id} className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  {item.time && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{item.time}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-4">
                    ${item.cost !== undefined && item.cost !== null ? Number(item.cost).toFixed(2) : "0.00"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBookNow(item)}
                    className="mr-2 bg-wanderly-button hover:bg-wanderly-buttonHover text-black"
                  >
                    Book Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {item.location && (
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{item.location}</span>
                </div>
              )}
            </div>
          ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No activities planned for this day.</p>
          <p className="mt-2">Click the "Add Attraction" button to add activities.</p>
        </div>
      )}
    </div>
  )
}
