import { supabase } from "@/lib/supabase"
import type { Attraction } from "@/types/attraction"
import type { ItineraryDay, ItineraryItem } from "@/data/itinerary/types"

// Constants for time slots
const TIME_SLOTS = {
  MORNING: ["08:00:00", "10:00:00", "12:00:00"],
  AFTERNOON: ["13:00:00", "15:00:00"],
  EVENING: ["18:00:00", "20:00:00"],
}

// Duration in minutes for different activity types
const ACTIVITY_DURATIONS = {
  ATTRACTION: 120, // 2 hours
  MEAL: 90, // 1.5 hours
  TRANSPORT: 60, // 1 hour
}

interface GenerateItineraryParams {
  userId: string
  budget: number
  days: number
  location?: string
  startDate: string
}

interface UserPreference {
  category: string
  weight: number
}

//Fetches user preferences from the database
export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
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

    // Get preference categories from preference_categories table
    const preferenceIds = userPrefs.map((pref) => pref.preference_id)
    const { data: prefCategories, error: prefCatError } = await supabase
      .from("preference_categories")
      .select("id, name")
      .in("id", preferenceIds)

    if (prefCatError) {
      console.error("Error fetching preference categories:", prefCatError)
      return []
    }

    // Convert to UserPreference format with weights and then we assign higher weights to user-selected preferences
    const preferences = prefCategories.map((cat) => ({
      category: cat.name,
      weight: 1.0, // Base weight
    }))

    console.log("Found user preferences:", preferences)
    return preferences
  } catch (error) {
    console.error("Error in getUserPreferences:", error)
    return []
  }
}

// Update the getAttractionsByCategories function to handle the latlong format
export async function getAttractionsByCategories(
  categories: string[],
  location?: string,
  limit = 50,
): Promise<Attraction[]> {
  try {
    console.log("Fetching attractions with categories:", categories)

    // Start with a basic query
    let query = supabase.from("attractions").select("*")

    // Filter by categories if provided, but only if they exist
    if (categories && categories.length > 0) {
      const { data: tableInfo, error: tableError } = await supabase.from("attractions").select("categories").limit(1)

      if (!tableError && tableInfo && tableInfo.length > 0) {
        if (tableInfo[0].categories && Array.isArray(tableInfo[0].categories)) {
          console.log("Using array overlap for categories")
          query = query.overlaps("categories", categories)
        } else if (tableInfo[0].category) {
          console.log("Using category column instead of categories")
          query = query.in("category", categories)
        } else {
          console.log("No category or categories column found, skipping category filter")
        }
      } else {
        console.log("Could not determine column type, using simple category filter")
        query = query.in("category", categories)
      }
    }

    // Filter by location if provided
    if (location) {
      query = query.ilike("location", `%${location}%`)
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      console.error("Error fetching attractions:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("No attractions found with the specified filters, fetching all attractions")
      // If no attractions found with filters, get all attractions
      const { data: allData, error: allError } = await supabase.from("attractions").select("*").limit(limit)

      if (allError) {
        console.error("Error fetching all attractions:", allError)
        return []
      }

      return processAttractions(allData || [])
    }

    return processAttractions(data)
  } catch (error) {
    console.error("Error in getAttractionsByCategories:", error)
    return []
  }
}

// Helper function to process attractions and extract coordinates
function processAttractions(attractions: any[]): Attraction[] {
  return attractions.map((attraction) => {
    let latitude = 0
    let longitude = 0

    if (attraction.latlong && Array.isArray(attraction.latlong) && attraction.latlong.length === 2) {
      latitude = Number.parseFloat(attraction.latlong[0])
      longitude = Number.parseFloat(attraction.latlong[1])
    } else if (attraction.latitude && attraction.longitude) {
      latitude = attraction.latitude
      longitude = attraction.longitude
    }

    return {
      id: attraction.id,
      name: attraction.name,
      description: attraction.description || "No description available",
      location: attraction.location || "Singapore",
      categories: attraction.categories || [attraction.category || "attraction"],
      cost: attraction.cost || 0,
      currency: attraction.currency || "SGD",
      latitude,
      longitude,
    }
  })
}

//Scores attractions based on user preferences
function scoreAttractions(attractions: Attraction[], preferences: UserPreference[]): Attraction[] {
  return attractions
    .map((attraction) => {
      let score = 0

      // Base score
      score += 0.5

      preferences.forEach((pref) => {
        if (attraction.category === pref.category) {
          score += pref.weight
        }
      })

      // Add some randomness to avoid same recommendations
      score += Math.random() * 0.2

      return {
        ...attraction,
        score,
      }
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

// Distributes attractions across days based on budget and time constraints

function distributeAttractions(scoredAttractions: Attraction[], days: number, budget: number): Attraction[][] {
  const dailyBudget = budget / days
  const result: Attraction[][] = Array(days)
    .fill(null)
    .map(() => [])

  const availableAttractions = [...scoredAttractions]

  for (let day = 0; day < days; day++) {
    let dayBudget = dailyBudget
    const dayAttractions: Attraction[] = []

    for (let i = 0; i < 4; i++) {
      if (availableAttractions.length === 0) break

      // have to find an attraction that fits in the budget
      const attractionIndex = availableAttractions.findIndex((attr) => (attr.cost || 0) <= dayBudget)

      if (attractionIndex === -1) break

      const attraction = availableAttractions.splice(attractionIndex, 1)[0]
      dayBudget -= attraction.cost || 0
      dayAttractions.push(attraction)
    }

    result[day] = dayAttractions
  }

  for (let day = 0; day < days; day++) {
    if (result[day].length < 3 && availableAttractions.length > 0) {
      const totalDayCost = result[day].reduce((sum, attr) => sum + (attr.cost || 0), 0)
      const remainingBudget = dailyBudget - totalDayCost

      // Find an attraction that fits in the remaining budget
      const attractionIndex = availableAttractions.findIndex((attr) => (attr.cost || 0) <= remainingBudget)

      if (attractionIndex !== -1) {
        const attraction = availableAttractions.splice(attractionIndex, 1)[0]
        result[day].push(attraction)
      }
    }
  }

  return result
}

//Creates itinerary days and items in the database

async function createItineraryInDatabase(
  userId: string,
  itineraryId: string,
  dailyAttractions: Attraction[][],
  startDate: string,
  location: string,
): Promise<{ days: ItineraryDay[]; totalCost: number }> {
  const days: ItineraryDay[] = []
  let totalCost = 0

  // Process each day
  for (let dayIndex = 0; dayIndex < dailyAttractions.length; dayIndex++) {
    const dayNumber = dayIndex + 1
    const dayDate = new Date(startDate)
    dayDate.setDate(dayDate.getDate() + dayIndex)
    const formattedDate = dayDate.toISOString().split("T")[0]

    // Create day record in database
    const { data: dayData, error: dayError } = await supabase
      .from("itinerary_days")
      .insert({
        itinerary_id: itineraryId,
        day_number: dayNumber,
        date: formattedDate,
        total_cost: 0, // Will update later
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dayError) {
      console.error(`Error creating day ${dayNumber}:`, dayError)
      continue
    }

    const dayId = dayData.id
    const attractions = dailyAttractions[dayIndex]
    const items: ItineraryItem[] = []
    let dayTotalCost = 0

    // Add breakfast
    const breakfastCost = 15 // Fixed cost for breakfast
    const { data: breakfastItem, error: breakfastError } = await supabase
      .from("itinerary_items")
      .insert({
        itinerary_day_id: dayId,
        title: `Breakfast in ${location}`,
        start_time: "08:00:00",
        end_time: "09:00:00",
        duration_minutes: ACTIVITY_DURATIONS.MEAL,
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
        time: formatTimeForDisplay("08:00:00"),
        cost: breakfastCost,
        location: location,
        order: 1,
        date: formattedDate,
      })
      dayTotalCost += breakfastCost
    }

    // Add attractions with appropriate times
    let currentOrder = 2

    // Morning attraction
    if (attractions.length > 0) {
      const attraction = attractions[0]
      await addAttractionToItinerary(dayId, attraction, TIME_SLOTS.MORNING[1], currentOrder, items, formattedDate)
      dayTotalCost += attraction.cost || 0
      currentOrder++
    }

    // Add lunch
    const lunchCost = 25 // Fixed cost for lunch
    const { data: lunchItem, error: lunchError } = await supabase
      .from("itinerary_items")
      .insert({
        itinerary_day_id: dayId,
        title: "Lunch",
        start_time: "13:00:00",
        end_time: "14:30:00",
        duration_minutes: ACTIVITY_DURATIONS.MEAL,
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
        time: formatTimeForDisplay("13:00:00"),
        cost: lunchCost,
        location: location,
        order: currentOrder,
        date: formattedDate,
      })
      dayTotalCost += lunchCost
      currentOrder++
    }

    // Afternoon attractions
    for (let i = 1; i < Math.min(attractions.length, 3); i++) {
      const attraction = attractions[i]
      const timeSlot = TIME_SLOTS.AFTERNOON[i - 1] || "15:00:00"

      await addAttractionToItinerary(dayId, attraction, timeSlot, currentOrder, items, formattedDate)
      dayTotalCost += attraction.cost || 0
      currentOrder++
    }

    // Add dinner
    const dinnerCost = 35 // Fixed cost for dinner
    const { data: dinnerItem, error: dinnerError } = await supabase
      .from("itinerary_items")
      .insert({
        itinerary_day_id: dayId,
        title: "Dinner",
        start_time: "19:00:00",
        end_time: "20:30:00",
        duration_minutes: ACTIVITY_DURATIONS.MEAL,
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
        time: formatTimeForDisplay("19:00:00"),
        cost: dinnerCost,
        location: location,
        order: currentOrder,
        date: formattedDate,
      })
      dayTotalCost += dinnerCost
      currentOrder++
    }

    // Evening attraction if available
    if (attractions.length > 3) {
      const attraction = attractions[3]
      await addAttractionToItinerary(dayId, attraction, TIME_SLOTS.EVENING[1], currentOrder, items, formattedDate)
      dayTotalCost += attraction.cost || 0
    }

    // Update day's total cost
    await supabase.from("itinerary_days").update({ total_cost: dayTotalCost }).eq("id", dayId)

    days.push({
      id: dayId,
      dayNumber,
      date: formattedDate,
      totalCost: dayTotalCost,
      items,
    })

    totalCost += dayTotalCost
  }

  return { days, totalCost }
}

// Helper function to add an attraction to the itinerary

async function addAttractionToItinerary(
  dayId: string,
  attraction: Attraction,
  startTime: string,
  orderIndex: number,
  items: ItineraryItem[],
  date: string,
): Promise<void> {
  // Calculate end time
  const startDate = new Date(`2000-01-01T${startTime}`)
  startDate.setMinutes(startDate.getMinutes() + ACTIVITY_DURATIONS.ATTRACTION)
  const endTime = startDate.toTimeString().split(" ")[0]

  const { data: attractionItem, error: attractionError } = await supabase
    .from("itinerary_items")
    .insert({
      itinerary_day_id: dayId,
      title: attraction.name,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: ACTIVITY_DURATIONS.ATTRACTION,
      cost: attraction.cost || 0,
      location: attraction.location || "",
      notes: attraction.description || "",
      order_index: orderIndex,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (attractionError) {
    console.error(`Error adding attraction ${attraction.name}:`, attractionError)
    return
  }

  items.push({
    id: attractionItem.id,
    title: attractionItem.title,
    time: formatTimeForDisplay(startTime),
    cost: attraction.cost || 0,
    location: attraction.location || "",
    notes: attraction.description,
    order: orderIndex,
    date,
  })
}

//  format time for display in 24-hour format
 
function formatTimeForDisplay(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (e) {
    return timeStr
  }
}

// Main function to generate an itinerary

export async function generateDynamicItinerary(params: GenerateItineraryParams) {
  try {
    const { userId, budget, days, location, startDate } = params

    // Step 1: Get user preferences
    const userPreferences = await getUserPreferences(userId)

    const preferredCategories =
      userPreferences.length > 0
        ? userPreferences.map((p) => p.category)
        : ["arts_entertainment", "nature_adventure", "cultural_heritage"]

    console.log("Using preferred categories:", preferredCategories)

    // Step 2: Fetch attractions based on preferences
    let attractions = await getAttractionsByCategories(preferredCategories, location)

    if (attractions.length === 0) {
      console.log("No attractions found matching preferences, fetching all attractions")
      // If no attractions found with preferences, get all attractions
      attractions = await getAttractionsByCategories([], location)

      if (attractions.length === 0) {
        console.log("Still no attractions found, using mock data")
        attractions = getMockAttractions(location || "Singapore")
      }
    }

    console.log(`Found ${attractions.length} attractions to use for itinerary`)

    // Step 3: Score attractions based on preferences
    const scoredAttractions = scoreAttractions(attractions, userPreferences)

    // Step 4: Distribute attractions across days
    const dailyAttractions = distributeAttractions(scoredAttractions, days, budget)

    // Step 5: Create itinerary in database
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        user_id: userId,
        name: `Trip to ${location || "Destination"}`,
        location: location || "Destination",
        is_active: true,
        total_cost: 0, // Will update later
        duration_days: days,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (itineraryError) {
      console.error("Error creating itinerary:", itineraryError)
      throw new Error("Failed to create itinerary")
    }

    // Step 6: Create days and items
    const { days: itineraryDays, totalCost } = await createItineraryInDatabase(
      userId,
      itineraryData.id,
      dailyAttractions,
      startDate,
      location || "Destination",
    )

    // Step 7: Update itinerary with total cost
    await supabase.from("itineraries").update({ total_cost: totalCost }).eq("id", itineraryData.id)

    // Return the complete itinerary
    return {
      id: itineraryData.id,
      name: `Trip to ${location || "Destination"}`,
      totalCost,
      days: itineraryDays,
    }
  } catch (error) {
    console.error("Error generating dynamic itinerary:", error)
    throw error
  }
}

// Generate mock attractions when no real attractions are found
function getMockAttractions(location: string): Attraction[] {
  return [
    {
      id: "mock-1",
      name: `${location} City Tour`,
      description: `Explore the beautiful city of ${location} with a guided tour.`,
      location: location,
      categories: ["cultural_heritage", "arts_entertainment"],
      cost: 50,
      currency: "USD",
    },
    {
      id: "mock-2",
      name: `${location} Museum Visit`,
      description: `Discover the rich history of ${location} at the local museum.`,
      location: location,
      categories: ["arts_entertainment", "cultural_heritage"],
      cost: 25,
      currency: "USD",
    },
    {
      id: "mock-3",
      name: `${location} Nature Park`,
      description: `Enjoy the natural beauty of ${location} at this scenic park.`,
      location: location,
      categories: ["nature_adventure"],
      cost: 15,
      currency: "USD",
    },
    {
      id: "mock-4",
      name: `${location} Shopping District`,
      description: `Shop for souvenirs and local goods in ${location}'s famous shopping area.`,
      location: location,
      categories: ["shopping_luxury"],
      cost: 0,
      currency: "USD",
    },
    {
      id: "mock-5",
      name: `${location} Cultural Show`,
      description: `Experience the local culture with a traditional performance.`,
      location: location,
      categories: ["arts_entertainment", "cultural_heritage"],
      cost: 35,
      currency: "USD",
    },
    {
      id: "mock-6",
      name: `${location} Historical Site`,
      description: `Visit an important historical landmark in ${location}.`,
      location: location,
      categories: ["historical_memorials", "cultural_heritage"],
      cost: 20,
      currency: "USD",
    },
    {
      id: "mock-7",
      name: `${location} Family Fun Center`,
      description: `A perfect place for family entertainment in ${location}.`,
      location: location,
      categories: ["family_fun"],
      cost: 45,
      currency: "USD",
    },
    {
      id: "mock-8",
      name: `${location} Local Food Tour`,
      description: `Taste the local cuisine of ${location} with this guided food tour.`,
      location: location,
      categories: ["cultural_heritage"],
      cost: 60,
      currency: "USD",
    },
  ]
}
