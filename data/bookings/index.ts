import { supabase } from "@/lib/supabase"
import type { Booking, BookableAttraction } from "./types"
import type { ItineraryItem } from "@/data/itinerary/types"

// Helper function to get the current user
const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Get all bookings for the current user
export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, returning empty bookings array")
      return []
    }

    // Get bookings without using a join
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: true })

    if (error) {
      console.error("Error fetching bookings:", error)
      return []
    }

    // Fetch attraction details separately if needed
    const bookings: Booking[] = await Promise.all(
      data.map(async (item) => {
        let attractionName = item.attraction_name || "Unknown Attraction"
        let location = "Singapore"

        if (item.attraction_id) {
          // Fetch the attraction details
          const { data: attractionData, error: attractionError } = await supabase
            .from("attractions")
            .select("name, location")
            .eq("id", item.attraction_id)
            .single()

          if (!attractionError && attractionData) {
            attractionName = attractionData.name
            location = attractionData.location || location
          }
        }

        return {
          id: item.id,
          attractionId: item.attraction_id || "",
          attractionName,
          date: item.booking_date,
          time: item.booking_time,
          status: item.status,
          notes: item.notes,
          cost: item.total_cost,
          numberOfPeople: item.number_of_people,
          location,
        }
      }),
    )

    return bookings
  } catch (error) {
    console.error("Error in getUserBookings:", error)
    return []
  }
}

// Get all attractions that can be booked
export const getBookableAttractions = async (): Promise<BookableAttraction[]> => {
  try {
    const { data, error } = await supabase.from("attractions").select("*").order("name")

    if (error) {
      console.error("Error fetching attractions:", error)
      return []
    }

    return data.map((attraction) => ({
      id: attraction.id,
      name: attraction.name,
      description: attraction.description || "No description available",
      location: attraction.location || "Singapore",
      category: attraction.category || "attraction",
      cost: attraction.cost || 0,
      requiresBooking: attraction.requires_booking !== false,
    }))
  } catch (error) {
    console.error("Error in getBookableAttractions:", error)
    return []
  }
}

// Get a single attraction by ID
export const getBookableAttraction = async (id: string): Promise<BookableAttraction | null> => {
  try {
    const { data, error } = await supabase.from("attractions").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching attraction:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || "No description available",
      location: data.location || "Singapore",
      category: data.category || "attraction",
      cost: data.cost || 0,
      requiresBooking: data.requires_booking !== false,
    }
  } catch (error) {
    console.error("Error in getBookableAttraction:", error)
    return null
  }
}

// Check for time clashes with existing bookings
export const checkTimeClash = async (date: string, time: string, excludeBookingId?: string): Promise<any> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot check for time clashes")
      return false
    }

    // Get all user bookings
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .eq("booking_date", date)
      .in("status", ["confirmed", "pending"])

    if (error) {
      console.error("Error checking for time clashes:", error)
      return false
    }

    // Filter out the booking we're currently updating if provided
    const bookingsToCheck = excludeBookingId ? data.filter((booking) => booking.id !== excludeBookingId) : data

    if (bookingsToCheck.length === 0) return false

    // Convert input time to minutes for easier comparison
    const [hours, minutes] = time.split(":").map(Number)
    const timeInMinutes = hours * 60 + minutes

    // Check against existing bookings
    for (const existingBooking of bookingsToCheck) {
      if (!existingBooking.booking_time) continue

      const [existingHours, existingMinutes] = existingBooking.booking_time.split(":").map(Number)
      const existingTimeInMinutes = existingHours * 60 + existingMinutes

      // Consider a conflict if within 90 minutes (1.5 hours)
      const timeDifference = Math.abs(timeInMinutes - existingTimeInMinutes)
      if (timeDifference < 90) {
        let attractionName = existingBooking.attraction_name || "Unknown Attraction"

        if (existingBooking.attraction_id) {
          const { data: attractionData, error: attractionError } = await supabase
            .from("attractions")
            .select("name")
            .eq("id", existingBooking.attraction_id)
            .single()

          if (!attractionError && attractionData) {
            attractionName = attractionData.name
          }
        }

        return {
          hasClash: true,
          clashingBooking: {
            id: existingBooking.id,
            attractionName,
            time: existingBooking.booking_time,
            date: existingBooking.booking_date,
          },
        }
      }
    }

    return false
  } catch (error) {
    console.error("Error in checkTimeClash:", error)
    return false
  }
}

// Create a new booking
export const createBooking = async (booking: Omit<Booking, "id" | "status">): Promise<Booking | null> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot create booking")
      return null
    }

    // Check for time clashes
    const clash = await checkTimeClash(booking.date, booking.time)

    if (clash && clash.hasClash) {
      throw new Error(
        `Time conflict with existing booking for "${clash.clashingBooking.attractionName}" at ${clash.clashingBooking.time}`,
      )
    }

    // Prepare booking data - handle case where attractionId might be empty
    const bookingData = {
      user_id: user.id,
      attraction_id: booking.attractionId || null, // Allow null for bookings from itinerary
      attraction_name: booking.attractionName, // Store the name directly
      booking_date: booking.date,
      booking_time: booking.time,
      status: "pending",
      notes: booking.notes,
      total_cost: booking.cost,
      number_of_people: booking.numberOfPeople,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

    if (error) {
      console.error("Error creating booking:", error)
      return null
    }

    return {
      id: data.id,
      attractionId: data.attraction_id || "",
      attractionName: data.attraction_name || booking.attractionName,
      date: data.booking_date,
      time: data.booking_time,
      status: data.status,
      notes: data.notes,
      cost: data.total_cost,
      numberOfPeople: data.number_of_people,
      location: booking.location,
    }
  } catch (error) {
    console.error("Error in createBooking:", error)
    throw error
  }
}

// Confirm a booking
export const confirmBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot confirm booking")
      return null
    }

    // First, get the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
      })
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (bookingError) {
      console.error("Error confirming booking:", bookingError)
      return null
    }

    // Then, get the attraction details if needed
    let attractionName = bookingData.attraction_name || "Unknown Attraction"
    let location = "Singapore"

    if (bookingData.attraction_id) {
      const { data: attractionData, error: attractionError } = await supabase
        .from("attractions")
        .select("name, location")
        .eq("id", bookingData.attraction_id)
        .single()

      if (!attractionError && attractionData) {
        attractionName = attractionData.name
        location = attractionData.location || location
      }
    }

    return {
      id: bookingData.id,
      attractionId: bookingData.attraction_id || "",
      attractionName,
      date: bookingData.booking_date,
      time: bookingData.booking_time,
      status: bookingData.status,
      notes: bookingData.notes,
      cost: bookingData.total_cost,
      numberOfPeople: bookingData.number_of_people,
      location,
    }
  } catch (error) {
    console.error("Error in confirmBooking:", error)
    return null
  }
}

// Cancel a booking
export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot cancel booking")
      return false
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
      })
      .eq("id", bookingId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error cancelling booking:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in cancelBooking:", error)
    return false
  }
}

// Get recommended bookings
export const getRecommendedBookings = async (): Promise<BookableAttraction[]> => {
  try {
    const { data, error } = await supabase.from("attractions").select("*").order("name").limit(5)

    if (error) {
      console.error("Error fetching recommended attractions:", error)
      return []
    }

    return data.map((attraction) => ({
      id: attraction.id,
      name: attraction.name,
      description: attraction.description || "No description available",
      location: attraction.location || "Singapore",
      category: attraction.category || "attraction",
      cost: attraction.cost || 0,
      requiresBooking: attraction.requires_booking !== false,
    }))
  } catch (error) {
    console.error("Error in getRecommendedBookings:", error)
    return []
  }
}

// Find an attraction by name
const findAttractionInDatabase = async (
  name: string,
): Promise<{ id: string; name: string; location: string } | null> => {
  try {
    // Try exact match first
    let { data, error } = await supabase.from("attractions").select("id, name, location").eq("name", name).single()

    if (error && error.code === "PGRST116") {
      // Try partial match if exact match fails
      const { data: partialData, error: partialError } = await supabase
        .from("attractions")
        .select("id, name, location")
        .ilike("name", `%${name}%`)
        .limit(1)
        .single()

      if (!partialError) {
        data = partialData
        error = null
      }
    }

    if (error) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      location: data.location || "Singapore",
    }
  } catch (error) {
    console.error("Error finding attraction:", error)
    return null
  }
}

// Create a booking from an itinerary item
export const createBookingFromItineraryItem = async (item: ItineraryItem): Promise<Booking | null> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot create booking")
      return null
    }

    // Try to find an attraction with this name in the database
    const attraction = await findAttractionInDatabase(item.title)

    // Parse the time from the itinerary item
    let bookingTime = "12:00:00" // Default to noon
    if (item.time) {
      // Handle time in 24-hour format (e.g., "14:30")
      if (item.time.match(/^\d{1,2}:\d{2}$/)) {
        const [hours, minutes] = item.time.split(":").map(Number)
        bookingTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
      }
      // Handle time in 12-hour format (e.g., "2:30 PM")
      else {
        const timeParts = item.time.match(/(\d+):(\d+)\s*([AP]M)?/)
        if (timeParts) {
          let hours = Number.parseInt(timeParts[1])
          const minutes = Number.parseInt(timeParts[2])
          const ampm = timeParts[3]

          if (ampm === "PM" && hours < 12) hours += 12
          if (ampm === "AM" && hours === 12) hours = 0

          bookingTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
        }
      }
    }

    // Check for time clashes
    const clash = await checkTimeClash(item.date || new Date().toISOString().split("T")[0], bookingTime)

    if (clash && clash.hasClash) {
      throw new Error(
        `Time conflict with existing booking for "${clash.clashingBooking.attractionName}" at ${clash.clashingBooking.time}`,
      )
    }

    // Create the booking
    const bookingData = {
      user_id: user.id,
      attraction_id: attraction?.id || null,
      attraction_name: item.title,
      itinerary_item_id: item.id,
      booking_date: item.date || new Date().toISOString().split("T")[0],
      booking_time: bookingTime,
      status: "confirmed", // Auto-confirm bookings from itinerary
      notes: item.notes || `Booking for: ${item.title}`, 
      total_cost: item.cost || 0,
      number_of_people: 1,
      created_at: new Date().toISOString(),
    }

    const { data, error: bookingError } = await supabase.from("bookings").insert(bookingData).select().single()

    if (bookingError) {
      console.error("Error creating booking:", bookingError)

      return {
        id: `mock-${Date.now()}`,
        attractionId: attraction?.id || "",
        attractionName: item.title,
        date: item.date || new Date().toISOString().split("T")[0],
        time: item.time || "12:00",
        status: "confirmed",
        notes: item.notes || `Booking for: ${item.title}`,
        cost: item.cost || 0,
        numberOfPeople: 1,
        location: item.location || "Singapore",
      }
    }

    return {
      id: data.id,
      attractionId: data.attraction_id || "",
      attractionName: item.title, // Always use the item title
      date: data.booking_date,
      time: data.booking_time,
      status: data.status,
      notes: data.notes,
      cost: data.total_cost,
      numberOfPeople: data.number_of_people,
      location: item.location || "Singapore",
    }
  } catch (error) {
    console.error("Error in createBookingFromItineraryItem:", error)
    throw error
  }
}

// Add a function to update a booking
export const updateBooking = async (
  bookingId: string,
  updates: {
    date?: string
    time?: string
    numberOfPeople?: number
    notes?: string
  },
): Promise<Booking | null> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot update booking")
      return null
    }

    // Check for time clashes if date or time is being updated
    if (updates.date || updates.time) {
      // First get the current booking to get the date/time if not provided in updates
      const { data: currentBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single()

      if (fetchError) {
        console.error("Error fetching current booking:", fetchError)
        return null
      }

      const dateToCheck = updates.date || currentBooking.booking_date
      const timeToCheck = updates.time || currentBooking.booking_time

      // Check for clashes, excluding the current booking
      const clash = await checkTimeClash(dateToCheck, timeToCheck, bookingId)

      if (clash && clash.hasClash) {
        throw new Error(
          `Time conflict with existing booking for "${clash.clashingBooking.attractionName}" at ${clash.clashingBooking.time}`,
        )
      }
    }

    // Create update object with only the fields that are provided
    const updateData: any = {}
    if (updates.date) updateData.booking_date = updates.date
    if (updates.time) updateData.booking_time = updates.time
    if (updates.numberOfPeople) updateData.number_of_people = updates.numberOfPeople
    if (updates.notes !== undefined) updateData.notes = updates.notes

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update the booking in Supabase
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (bookingError) {
      console.error("Error updating booking:", bookingError)
      return null
    }

    // Get attraction details if needed
    let attractionName = bookingData.attraction_name || "Unknown Attraction"
    let location = "Singapore"

    if (bookingData.attraction_id) {
      const { data: attractionData, error: attractionError } = await supabase
        .from("attractions")
        .select("name, location")
        .eq("id", bookingData.attraction_id)
        .single()

      if (!attractionError && attractionData) {
        attractionName = attractionData.name
        location = attractionData.location || location
      }
    }

    return {
      id: bookingData.id,
      attractionId: bookingData.attraction_id || "",
      attractionName,
      date: bookingData.booking_date,
      time: bookingData.booking_time,
      status: bookingData.status,
      notes: bookingData.notes,
      cost: bookingData.total_cost,
      numberOfPeople: bookingData.number_of_people,
      location,
    }
  } catch (error) {
    console.error("Error in updateBooking:", error)
    throw error
  }
}
