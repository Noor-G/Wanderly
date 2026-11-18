import { createClient } from "@supabase/supabase-js"

// thiri's-project->api docs-> has the Supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Log environment variable status for debugging
console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key available:", !!supabaseAnonKey)

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Add global error handler
  global: {
    fetch: (...args) => {
      return fetch(...args).catch((error) => {
        console.error("Supabase fetch error:", error)
        throw new Error("Failed to connect to database. Please try again later.")
      })
    },
  },
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    // First check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return null
    }

    if (!sessionData.session) {
      console.log("No active session found")
      return null
    }

    // If we have a session, get the user
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return data?.user || null
  } catch (error) {
    console.error("Exception in getCurrentUser:", error)
    return null
  }
}

// Helper function to get the current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting current session:", error)
      return null
    }

    return data?.session || null
  } catch (error) {
    console.error("Exception in getCurrentSession:", error)
    return null
  }
}

// Check if user is authenticated
export const isAuthenticated = async () => {
  const session = await getCurrentSession()
  return !!session
}

// Helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    // Simple health check query
    const { error } = await supabase.from("attractions").select("count", { count: "exact" }).limit(0)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Exception during Supabase connection test:", error)
    return false
  }
}

// Helper function to check and update email confirmation status
export const checkAndConfirmEmail = async (email: string) => {
  try {
    console.log("Attempting to confirm email for:", email)

    // First try to get the current session
    const { data: sessionData } = await supabase.auth.getSession()

    if (sessionData.session) {
      console.log("User already has a session, no need to confirm email")
      return true
    }

    // If no session, try to sign in without password (this won't work but helps check if email exists)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    // If the error indicates the user exists but email is not confirmed like we know the user exists and we can try to work around the confirmation
    if (signInError && signInError.message.includes("Email not confirmed")) {
      console.log("Email exists but not confirmed")
      return false
    }

    return false
  } catch (error) {
    console.error("Error checking email confirmation:", error)
    return false
  }
}
