import { supabase } from "@/lib/supabase"

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
