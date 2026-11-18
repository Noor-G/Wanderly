import type { Itinerary, ItineraryItem, ItineraryDay } from "./types"
import { supabase } from "@/lib/supabase"

// to get current user
const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

//  formatting time for display in 24-hour format
function formatTimeForDisplay(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    return timeStr
  }
}

//getting user preferences from Supabase
async function getUserPreferences(userId: string): Promise<string[]> {
  try {
    console.log("Fetching user preferences for user:", userId)

    // Get preference IDs from user_preferences table
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from("user_preferences")
      .select("preference_id")
      .eq("user_id", userId)

    if (userPrefsError) {
      console.error("Error fetching user preferences:", userPrefsError)
      return []
    }

    if (!userPrefs || userPrefs.length === 0) {
      console.log("No preferences found for user")
      return []
    }

    // Get preference names from preference_categories table
    const preferenceIds = userPrefs.map((pref) => pref.preference_id)
    const { data: prefCategories, error: prefCatError } = await supabase
      .from("preference_categories")
      .select("name")
      .in("id", preferenceIds)

    if (prefCatError) {
      console.error("Error fetching preference categories:", prefCatError)
      return []
    }

    const preferenceNames = prefCategories.map((cat) => cat.name)
    console.log("Found user preferences:", preferenceNames)
    return preferenceNames
  } catch (error) {
    console.error("Error in getUserPreferences:", error)
    return []
  }
}

// getting trip details from Supabase
async function getTripDetails(userId: string) {
  try {
    console.log("Fetching trip details for user:", userId)

    const { data, error } = await supabase.from("trip_preferences").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching trip details:", error)
      return null
    }

    console.log("Found trip details:", data)
    return data
  } catch (error) {
    console.error("Error in getTripDetails:", error)
    return null
  }
}

// Getting the current itinerary from Supabase
export const getCurrentItinerary = async (): Promise<Itinerary | null> => {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, returning null")
      return null
    }

    // Try to get the itinerary header from Supabase
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (itineraryError) {
      if (itineraryError.code === "PGRST116") {
        // No itinerary found
        console.log("No active itinerary found for user")
        return null
      }
      console.error("Error fetching itinerary:", itineraryError)
      return null
    }

    if (!itineraryData) {
      console.log("No itinerary data returned")
      return null
    }

    // Fetch the days for this itinerary
    const { data: daysData, error: daysError } = await supabase
      .from("itinerary_days")
      .select("*")
      .eq("itinerary_id", itineraryData.id)
      .order("day_number", { ascending: true })

    if (daysError) {
      console.error("Error fetching itinerary days:", daysError)
      return null
    }

    // Prepare to fetch items for all days
    const days: ItineraryDay[] = []
    let totalCost = 0

    // Process each day
    for (const day of daysData || []) {
      // Fetch items for this day
      const { data: itemsData, error: itemsError } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("itinerary_day_id", day.id)
        .order("order_index", { ascending: true })

      if (itemsError) {
        console.error(`Error fetching items for day ${day.id}:`, itemsError)
        continue
      }

      // Convert database items to our app format
      const items: ItineraryItem[] = (itemsData || []).map((item) => ({
        id: item.id,
        title: item.title,
        time: item.start_time ? formatTimeForDisplay(item.start_time) : undefined,
        cost: item.cost,
        location: item.location,
        notes: item.notes,
        order: item.order_index,
        date: day.date,
      }))

      // Calculate day total cost
      const dayTotalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0)
      totalCost += dayTotalCost

      // Add this day to our days array
      days.push({
        id: day.id,
        dayNumber: day.day_number,
        date: day.date,
        totalCost: dayTotalCost,
        items: items,
      })
    }

    // If we have no days from the database, return null
    if (days.length === 0) {
      console.log("No days found for itinerary")
      return null
    }

    // Return the complete itinerary
    return {
      id: itineraryData.id,
      name: "Your Itinerary", // Changed from itineraryData.name to remove "Trip to X"
      totalCost: totalCost,
      days: days,
    }
  } catch (error) {
    console.error("Error fetching itinerary:", error)
    return null
  }
}

// Generate an itinerary based on user preferences
export const generateItinerary = async (preferences: {
  interests: string[]
  tripDetails: {
    budget: string
    date: string
    people: string
    location: string
    duration: string
  }
}): Promise<Itinerary | null> => {
  console.log("Generating itinerary with preferences:", preferences)

  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("No authenticated user found, cannot generate itinerary")
      return null
    }

    // Get user preferences from Supabase
    const userPreferences = await getUserPreferences(user.id)

    // Get trip details from Supabase
    const dbTripDetails = await getTripDetails(user.id)

    const startDate = preferences.tripDetails.date || dbTripDetails?.date || new Date().toISOString().split("T")[0]
    const durationDays = Number.parseInt(preferences.tripDetails.duration) || dbTripDetails?.duration_days || 1
    const location = preferences.tripDetails.location || dbTripDetails?.location || "Singapore"
    const budget = Number.parseFloat(preferences.tripDetails.budget) || dbTripDetails?.budget || 500
    const numPeople = Number.parseInt(preferences.tripDetails.people) || dbTripDetails?.people_count || 1

    console.log("Using trip details:", {
      startDate,
      durationDays,
      location,
      budget,
      numPeople,
    })

    // Combine with preferences passed to the function
    const combinedInterests = [...new Set([...userPreferences, ...preferences.interests])]
    console.log("Combined interests for itinerary generation:", combinedInterests)

    // Fetch attractions from the database
    const { data: attractions, error: attractionsError } = await supabase.from("attractions").select("*")

    if (attractionsError) {
      console.error("Error fetching attractions:", attractionsError)
      throw new Error("Failed to fetch attractions from database")
    }

    if (!attractions || attractions.length === 0) {
      console.error("No attractions found in database")
      throw new Error("No attractions found in database")
    }

    console.log(`Found ${attractions.length} attractions in database`)

    // Log some sample attractions to debug
    console.log("Sample attractions:", attractions.slice(0, 3))

    // Create a new itinerary in Supabase
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        name: "Your Itinerary", 
        location: location,
        is_active: true,
        total_cost: 0, 
        duration_days: durationDays,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (itineraryError) {
      console.error("Error creating itinerary in Supabase:", itineraryError)
      throw new Error("Failed to create itinerary in database")
    }

    const itineraryId = itineraryData.id
    console.log("Created itinerary in Supabase with ID:", itineraryId)

    // Filter attractions based on user interests
    let filteredAttractions = [...attractions]

    // If user has specific interests, prioritize those attractions
    if (combinedInterests.length > 0 && !combinedInterests.includes("no_preference")) {
      console.log("Filtering attractions based on user interests")

      const matchedAttractions = filteredAttractions.filter((attraction) => {
        if (!attraction.categories || !Array.isArray(attraction.categories)) {
          return false
        }

        return combinedInterests.some((interest) => attraction.categories.includes(interest))
      })

      console.log(`Found ${matchedAttractions.length} attractions with exact category matches`)

      if (matchedAttractions.length >= 3) {
        filteredAttractions = matchedAttractions
      } else {
        console.log("Not enough exact matches, using all attractions")
      }
    }

    // Ensure we have enough attractions
    if (filteredAttractions.length < 3) {
      console.log("Not enough attractions after filtering, using all attractions")
      filteredAttractions = [...attractions]
    }

    console.log(`Using ${filteredAttractions.length} attractions for itinerary generation`)

    // Create days and items for the itinerary
    let totalCost = 0
    const days: ItineraryDay[] = []

    for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
      // Calculate the date for this day
      const dayDate = new Date(startDate)
      dayDate.setDate(dayDate.getDate() + dayNum - 1)
      const formattedDate = dayDate.toISOString().split("T")[0]

      console.log(`Generating day ${dayNum} for ${formattedDate}`)

      // Create the day record in Supabase
      const { data: dayData, error: dayError } = await supabase
        .from("itinerary_days")
        .insert({
          itinerary_id: itineraryId,
          day_number: dayNum,
          date: formattedDate,
          total_cost: 0, // Will update this later
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (dayError) {
        console.error(`Error creating day ${dayNum} in Supabase:`, dayError)
        continue
      }

      const dayId = dayData.id
      console.log(`Created day ${dayNum} in Supabase with ID:`, dayId)

      // Shuffle the attractions and take a subset for this day
      const shuffledAttractions = [...filteredAttractions].sort(() => 0.5 - Math.random())

      // Take different attractions for each day to avoid repetition
      const attractionsPerDay = Math.min(4, Math.floor(filteredAttractions.length / durationDays))
      const startIndex = ((dayNum - 1) * attractionsPerDay) % filteredAttractions.length
      const dayAttractions = shuffledAttractions.slice(
        startIndex,
        Math.min(startIndex + attractionsPerDay, filteredAttractions.length),
      )

      // If we don't have enough attractions, take from the beginning
      if (dayAttractions.length < 2) {
        const additionalNeeded = 2 - dayAttractions.length
        dayAttractions.push(...shuffledAttractions.slice(0, additionalNeeded))
      }

      console.log(`Selected ${dayAttractions.length} attractions for day ${dayNum}`)

      // Create items for this day
      const items: ItineraryItem[] = []
      let dayTotalCost = 0

      // Standard meal times
      const mealTimes = {
        breakfast: "08:00:00",
        lunch: "13:00:00",
        dinner: "19:00:00",
      }

      // Add breakfast
      const breakfastCost = Math.min(budget * 0.05, 25) // 5% of budget, max $25
      const { data: breakfastItem, error: breakfastError } = await supabase
        .from("itinerary_items")
        .insert({
          itinerary_day_id: dayId,
          title: `Breakfast in ${location}`,
          start_time: mealTimes.breakfast,
          end_time: "09:00:00",
          duration_minutes: 60,
          cost: breakfastCost,
          location: location,
          order_index: 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!breakfastError) {
        items.push({
          id: breakfastItem.id,
          title: breakfastItem.title,
          time: formatTimeForDisplay(mealTimes.breakfast),
          cost: breakfastCost,
          location: location,
          order: 1,
          date: formattedDate,
        })
        dayTotalCost += breakfastCost
      }

      // Add attractions with appropriate times
      let currentOrder = 2
      const attractionTimes = ["10:00:00", "11:30:00", "15:00:00", "16:30:00"]

      for (let i = 0; i < Math.min(dayAttractions.length, attractionTimes.length); i++) {
        const attraction = dayAttractions[i]
        const attractionName = attraction.name || `Attraction ${i + 1}`
        const attractionLocation = attraction.location || location

        // Use the attraction's cost if available, otherwise estimate
        const attractionCost =
          attraction.cost ||
          Math.min(
            budget * 0.1, // Max 10% of budget per attraction
            20 + Math.random() * 30 * (budget / 500),
          )

        // Calculate end time (1.5 hours after start)
        const startTime = attractionTimes[i]
        const startDateObj = new Date(`2000-01-01T${startTime}`)
        startDateObj.setMinutes(startDateObj.getMinutes() + 90)
        const endTime = startDateObj.toTimeString().split(" ")[0]

        console.log(`Adding attraction: ${attractionName} at ${startTime} for ${attractionCost.toFixed(2)}`)

        // Create itinerary item
        const { data: attractionItem, error: attractionError } = await supabase
          .from("itinerary_items")
          .insert({
            itinerary_day_id: dayId,
            title: attractionName,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: 90,
            cost: attractionCost,
            location: attractionLocation,
            notes: attraction.description || "",
            order_index: currentOrder,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!attractionError) {
          items.push({
            id: attractionItem.id,
            title: attractionItem.title,
            time: formatTimeForDisplay(startTime),
            cost: attractionCost,
            location: attractionLocation,
            notes: attraction.description,
            order: currentOrder,
            date: formattedDate,
          })
          dayTotalCost += attractionCost
          currentOrder++
        } else {
          console.error(`Error adding attraction ${attractionName}:`, attractionError)
        }

        // Add lunch after the second attraction
        if (i === 1) {
          const lunchCost = Math.min(budget * 0.07, 35) // 7% of budget, max $35
          const { data: lunchItem, error: lunchError } = await supabase
            .from("itinerary_items")
            .insert({
              itinerary_day_id: dayId,
              title: "Lunch",
              start_time: mealTimes.lunch,
              end_time: "14:00:00",
              duration_minutes: 60,
              cost: lunchCost,
              location: location,
              order_index: currentOrder,
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (!lunchError) {
            items.push({
              id: lunchItem.id,
              title: lunchItem.title,
              time: formatTimeForDisplay(mealTimes.lunch),
              cost: lunchCost,
              location: location,
              order: currentOrder,
              date: formattedDate,
            })
            dayTotalCost += lunchCost
            currentOrder++
          } else {
            console.error("Error adding lunch:", lunchError)
          }
        }
      }

      // Add dinner
      const dinnerCost = Math.min(budget * 0.1, 50) // 10% of budget, max $50
      const { data: dinnerItem, error: dinnerError } = await supabase
        .from("itinerary_items")
        .insert({
          itinerary_day_id: dayId,
          title: "Dinner",
          start_time: mealTimes.dinner,
          end_time: "20:30:00",
          duration_minutes: 90,
          cost: dinnerCost,
          location: location,
          order_index: currentOrder,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!dinnerError) {
        items.push({
          id: dinnerItem.id,
          title: dinnerItem.title,
          time: formatTimeForDisplay(mealTimes.dinner),
          cost: dinnerCost,
          location: location,
          order: currentOrder,
          date: formattedDate,
        })
        dayTotalCost += dinnerCost
      } else {
        console.error("Error adding dinner:", dinnerError)
      }

      console.log(`Day ${dayNum} total cost: ${dayTotalCost.toFixed(2)}`)

      // Update the day's total cost
      await supabase.from("itinerary_days").update({ total_cost: dayTotalCost }).eq("id", dayId)

      // Add this day to our days array
      days.push({
        id: dayId,
        dayNumber: dayNum,
        date: formattedDate,
        totalCost: dayTotalCost,
        items: items,
      })

      totalCost += dayTotalCost
    }

    console.log(`Itinerary total cost: ${totalCost.toFixed(2)}`)

    // Update the itinerary's total cost
    await supabase.from("itineraries").update({ total_cost: totalCost }).eq("id", itineraryId)

    // Return the complete itinerary
    return {
      id: itineraryId,
      name: "Your Itinerary", // Changed from "Trip to ${location}" to "Your Itinerary"
      totalCost: totalCost,
      days: days,
    }
  } catch (error) {
    console.error("Error generating itinerary:", error)
    throw error
  }
}

// Add an itinerary item to Supabase
export const addItineraryItem = async (dayId: string, item: Omit<ItineraryItem, "id">): Promise<Itinerary | null> => {
  try {
    // Convert time string to proper time format
    let startTime = null
    let endTime = null

    if (item.time) {
      // Handle time in HH:MM format
      const timeParts = item.time.split(":")
      if (timeParts.length === 2) {
        const hours = Number.parseInt(timeParts[0], 10)
        const minutes = Number.parseInt(timeParts[1], 10)

        if (!isNaN(hours) && !isNaN(minutes)) {
          startTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`

          // Set end time to 1 hour after start time by default
          const endTimeDate = new Date(`2000-01-01T${startTime}`)
          endTimeDate.setHours(endTimeDate.getHours() + 1)
          endTime = endTimeDate.toTimeString().split(" ")[0]
        }
      }
    }

    console.log("Adding item with time:", item.time, "formatted as:", startTime)

    // Add to Supabase - NO updated_at field as per schema
    const { data: newItem, error: itemError } = await supabase
      .from("itinerary_items")
      .insert({
        itinerary_day_id: dayId,
        title: item.title,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: 60, // Default 1 hour
        cost: item.cost || 0,
        location: item.location,
        notes: item.notes,
        order_index: item.order,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (itemError) {
      console.error("Error adding itinerary item to Supabase:", itemError)
      return null
    }

    // Get the day to update its total cost
    const { data: dayData, error: dayError } = await supabase
      .from("itinerary_days")
      .select("*, itinerary_items(*)")
      .eq("id", dayId)
      .single()

    if (dayError) {
      console.error("Error fetching day data:", dayError)
      return null
    }

    // Calculate new total cost for the day
    const dayTotalCost = dayData.itinerary_items.reduce((sum, item) => sum + (item.cost || 0), 0)

    // Update the day's total cost - NO updated_at field as per schema
    await supabase.from("itinerary_days").update({ total_cost: dayTotalCost }).eq("id", dayId)

    // Update the itinerary's total cost
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itinerary_days")
      .select("itinerary_id, total_cost")
      .eq("itinerary_id", dayData.itinerary_id)

    if (!itineraryError) {
      const itineraryTotalCost = itineraryData.reduce((sum, day) => sum + (day.total_cost || 0), 0)

      // NO updated_at field as per schema
      await supabase.from("itineraries").update({ total_cost: itineraryTotalCost }).eq("id", dayData.itinerary_id)
    }

    // Fetch the updated itinerary
    return await getCurrentItinerary()
  } catch (error) {
    console.error("Error adding itinerary item:", error)
    return null
  }
}

// Remove an itinerary item from Supabase
export const removeItineraryItem = async (itemId: string): Promise<Itinerary | null> => {
  try {
    // Get the item to find its day
    const { data: itemData, error: itemFetchError } = await supabase
      .from("itinerary_items")
      .select("itinerary_day_id, cost")
      .eq("id", itemId)
      .single()

    if (itemFetchError) {
      console.error("Error fetching itinerary item:", itemFetchError)
      return null
    }

    const dayId = itemData.itinerary_day_id
    const itemCost = itemData.cost || 0

    // Remove from Supabase
    const { error } = await supabase.from("itinerary_items").delete().eq("id", itemId)

    if (error) {
      console.error("Error removing itinerary item from Supabase:", error)
      return null
    }

    // Get the day to update its total cost
    const { data: dayData, error: dayError } = await supabase
      .from("itinerary_days")
      .select("*, itinerary_items(*)")
      .eq("id", dayId)
      .single()

    if (dayError) {
      console.error("Error fetching day data:", dayError)
      return null
    }

    // Calculate new total cost for the day
    const dayTotalCost = dayData.itinerary_items.reduce((sum, item) => sum + (item.cost || 0), 0)

    // Update the day's total cost - NO updated_at field as per schema
    await supabase.from("itinerary_days").update({ total_cost: dayTotalCost }).eq("id", dayId)

    // Update the itinerary's total cost
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itinerary_days")
      .select("itinerary_id, total_cost")
      .eq("itinerary_id", dayData.itinerary_id)

    if (!itineraryError) {
      const itineraryTotalCost = itineraryData.reduce((sum, day) => sum + (day.total_cost || 0), 0)

      // NO updated_at field as per schema
      await supabase.from("itineraries").update({ total_cost: itineraryTotalCost }).eq("id", dayData.itinerary_id)
    }

    // Fetch the updated itinerary
    return await getCurrentItinerary()
  } catch (error) {
    console.error("Error removing itinerary item:", error)
    return null
  }
}

// Add a new day to the itinerary in Supabase
export const addItineraryDay = async (
  itineraryId: string,
  dayNumber: number,
  date: string,
): Promise<Itinerary | null> => {
  try {
    // NO updated_at field as per schema
    const { data, error } = await supabase
      .from("itinerary_days")
      .insert({
        itinerary_id: itineraryId,
        day_number: dayNumber,
        date: date,
        total_cost: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding itinerary day to Supabase:", error)
      return null
    }

    // Fetch the updated itinerary
    return await getCurrentItinerary()
  } catch (error) {
    console.error("Error adding itinerary day:", error)
    return null
  }
}
