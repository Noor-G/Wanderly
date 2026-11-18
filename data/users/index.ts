import type { User } from "./types"
import { supabase } from "@/lib/supabase"

// Get user data from Supabase
export const getUserData = async (): Promise<User> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    // Get username from user data if available, otherwise have to use email prefix
    const username = user.user_metadata?.username || user.email?.split("@")[0] || "user"

    // This is to get the user preferences from the preferences table 
    const { data: userPreferencesData, error: preferencesError } = await supabase
      .from("user_preferences")
      .select("preference_id")
      .eq("user_id", user.id)

    if (preferencesError) {
      console.error("Error fetching user preferences:", preferencesError)
    }

    // If we have preference IDs can get their names
    let preferences: string[] = []
    if (userPreferencesData && userPreferencesData.length > 0) {
      const preferenceIds = userPreferencesData.map((p) => p.preference_id)

      const { data: prefCategoriesData, error: prefCatError } = await supabase
        .from("preference_categories")
        .select("name")
        .in("id", preferenceIds)

      if (prefCatError) {
        console.error("Error fetching preference category names:", prefCatError)
      }

      preferences = prefCategoriesData ? prefCategoriesData.map((p) => p.name) : []
    }

    return {
      id: user.id,
      username,
      email: user.email || "",
      preferences,
    }
  } catch (error) {
    console.error("Error getting user data:", error)
    // Return a default user object to prevent errors
    return {
      id: "unknown",
      username: "Guest",
      email: "",
      preferences: [],
    }
  }
}

export const updateUsername = async (newUsername: string): Promise<User> => {
  try {
    // Update the username in user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: { username: newUsername },
    })

    if (error) {
      throw error
    }

    if (!data.user) {
      throw new Error("User not found")
    }

    return {
      id: data.user.id,
      username: newUsername,
      email: data.user.email || "",
      preferences: [],
    }
  } catch (error) {
    console.error("Error updating username:", error)
    throw error
  }
}

// Update the updateUserPreferences function to correctly handle the user ID
export const updateUserPreferences = async (preferenceNames: string[]): Promise<User> => {
  try {
    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    console.log("Updating preferences for user:", user.id, "Preferences:", preferenceNames)

    // First, get the preference category IDs from the names
    const { data: preferenceCategories, error: prefCatError } = await supabase
      .from("preference_categories")
      .select("id, name")
      .in("name", preferenceNames)

    if (prefCatError) {
      console.error("Error fetching preference categories:", prefCatError)
      throw prefCatError
    }

    if (!preferenceCategories || preferenceCategories.length === 0) {
      console.error("No matching preference categories found")
      throw new Error("No matching preference categories found")
    }

    console.log("Found preference categories:", preferenceCategories)

    // Delete existing user preferences
    const { error: deleteError } = await supabase.from("user_preferences").delete().eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting existing preferences:", deleteError)
      // Continue anyway - we'll try to insert new preferences
    } else {
      console.log("Deleted existing preferences")
    }

    // Insert new preferences one by one
    for (const category of preferenceCategories) {
      console.log(`Inserting preference ${category.name} (${category.id}) for user ${user.id}`)

      const { error: insertError } = await supabase.from("user_preferences").insert({
        user_id: user.id,
        preference_id: category.id,
      })

      if (insertError) {
        console.error(`Error inserting preference ${category.name}:`, insertError)
      } else {
        console.log(`Successfully inserted preference: ${category.name}`)
      }
    }

    // Store preferences in localStorage as a fallback
    localStorage.setItem("userPreferences", JSON.stringify(preferenceNames))

    // Get username from user metadata if available, otherwise use email prefix
    const username = user.user_metadata?.username || user.email?.split("@")[0] || "user"

    return {
      id: user.id,
      username,
      email: user.email || "",
      preferences: preferenceNames,
    }
  } catch (error) {
    console.error("Error updating user preferences:", error)
    // Store in localStorage as fallback
    localStorage.setItem("userPreferences", JSON.stringify(preferenceNames))

    // Return a user object with the preferences to maintain UI consistency
    return {
      id: "unknown",
      username: "Guest",
      email: "",
      preferences: preferenceNames,
    }
  }
}

// Update the saveTripDetails function to remove references to start_date and end_date
export const saveTripDetails = async (tripDetails: {
  budget: string
  date: string
  people: string
  location: string
  duration: string
}): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No authenticated user found")
      throw new Error("User not found")
    }

    console.log("Saving trip details for user:", user.id, "Details:", tripDetails)

    // Parse the budget as an integer
    const budget = Number.parseInt(tripDetails.budget) || 0

    // Parse the number of people
    const peopleCount = Number.parseInt(tripDetails.people) || 1

    // Parse the duration
    const durationDays = Number.parseInt(tripDetails.duration) || 1

    // Store trip details in localStorage as a fallback
    // We'll keep the date in localStorage for UI purposes even though it's not in the DB
    const localTripDetails = {
      budget,
      peopleCount,
      durationDays,
      date: tripDetails.date || new Date().toISOString().split("T")[0],
      location: tripDetails.location,
      userId: user.id,
    }

    localStorage.setItem("tripDetails", JSON.stringify(localTripDetails))
    console.log("Saved trip details to localStorage")

    // First check if the user already has trip details
    const { data: existingTrip, error: fetchError } = await supabase
      .from("trip_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching existing trip details:", fetchError)
      throw fetchError
    }

    console.log("Existing trip details:", existingTrip)

    if (existingTrip) {
      // If user already has trip details, update them
      console.log("Updating existing trip details with ID:", existingTrip.id)

      // Create a minimal update object with only the fields that exist in the DB
      const updateData = {
        budget: budget,
        location: tripDetails.location,
        duration_days: durationDays,
        people_count: peopleCount,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from("trip_preferences")
        .update(updateData)
        .eq("id", existingTrip.id)

      if (updateError) {
        console.error("Error updating trip details:", updateError)
        throw updateError
      }

      console.log("Trip details updated successfully")
    } else {
      // If user doesn't have trip details yet, insert new record
      console.log("Inserting new trip details")

      // Insert only the fields that exist in the DB
      const { data: insertData, error: insertError } = await supabase
        .from("trip_preferences")
        .insert({
          user_id: user.id,
          budget: budget,
          location: tripDetails.location,
          duration_days: durationDays,
          people_count: peopleCount,
        })
        .select()

      if (insertError) {
        console.error("Error inserting trip details:", insertError)
        throw insertError
      }

      console.log("Trip details inserted successfully:", insertData)
    }

    return
  } catch (error) {
    console.error("Error in saveTripDetails:", error)
    // Store in localStorage as fallback
    const fallbackDetails = {
      budget: Number.parseInt(tripDetails.budget) || 500,
      peopleCount: Number.parseInt(tripDetails.people) || 2,
      durationDays: Number.parseInt(tripDetails.duration) || 1,
      date: tripDetails.date || new Date().toISOString().split("T")[0],
      location: tripDetails.location || "Singapore",
      userId: "guest",
    }
    localStorage.setItem("tripDetails", JSON.stringify(fallbackDetails))
    throw error
  }
}

// Get trip details - first try Supabase, then fall back to localStorage
export const getTripDetails = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    // Try to get from Supabase
    const { data, error } = await supabase.from("trip_preferences").select("*").eq("user_id", user.id).single()

    if (error || !data) {
      // Fall back to localStorage
      const localData = localStorage.getItem("tripDetails")
      if (localData) {
        return JSON.parse(localData)
      }

      // Default values if nothing is found
      return {
        budget: 500,
        peopleCount: 2,
        durationDays: 1,
        date: new Date().toISOString().split("T")[0],
        location: "Singapore",
        userId: user.id,
      }
    }

    // Map database fields to our return object
    return {
      budget: data.budget,
      peopleCount: data.people_count,
      durationDays: data.duration_days,
      date: new Date().toISOString().split("T")[0], // Use current date since start_date is not in DB
      location: data.location,
      userId: data.user_id,
    }
  } catch (error) {
    console.error("Error getting trip details:", error)

    // Fall back to localStorage
    const localData = localStorage.getItem("tripDetails")
    if (localData) {
      return JSON.parse(localData)
    }

    // Default values if nothing is found
    return {
      budget: 500,
      peopleCount: 2,
      durationDays: 1,
      date: new Date().toISOString().split("T")[0],
      location: "Singapore",
      userId: "guest",
    }
  }
}
