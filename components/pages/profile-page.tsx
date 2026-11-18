"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, Camera, Edit2, Save, X } from "lucide-react"
import type { User as UserType } from "@/data/users/types"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

interface ProfilePageProps {
  onNavigate: (screen: string, params?: any) => void
  currentScreen: string
}

export default function ProfilePage({ onNavigate, currentScreen }: ProfilePageProps) {
  const [userData, setUserData] = useState<UserType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        setAuthError(null)

        // First check if we have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setAuthError("Authentication session error. Please log in again.")
          setIsLoading(false)
          return
        }

        if (!sessionData.session) {
          console.log("No active session found")
          setAuthError("No active session found. Please log in.")
          setIsLoading(false)
          return
        }

        // If we have a session, get the user
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("Error getting user:", error)
          setAuthError("Failed to get user data. Please log in again.")
          setIsLoading(false)
          return
        }

        if (!data.user) {
          console.error("User not found")
          setAuthError("User not found. Please log in again.")
          setIsLoading(false)
          return
        }

        // Create user data object
        const userData: UserType = {
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split("@")[0] || "user",
          email: data.user.email || "",
          preferences: [],
        }

        // Try to fetch user preferences
        try {
          const { data: userPreferencesData, error: preferencesError } = await supabase
            .from("user_preferences")
            .select("preference_id")
            .eq("user_id", data.user.id)

          if (preferencesError) {
            console.error("Error fetching user preferences:", preferencesError)
          }

          // If we have preference IDs, get their names
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

          userData.preferences = preferences
        } catch (prefError) {
          console.error("Error processing preferences:", prefError)
        }

        setUserData(userData)
        setEditedUsername(userData.username)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setAuthError("Error fetching user data. Please try logging in again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
    if (userData) {
      setEditedUsername(userData.username)
    }
  }

  const handleSave = async () => {
    if (editedUsername.trim() === "") {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      // Update username in Supabase user metadata
      const { error } = await supabase.auth.updateUser({
        data: { username: editedUsername },
      })

      if (error) {
        throw error
      }

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          username: editedUsername,
        })
      }

      setIsEditing(false)

      toast({
        title: "Success",
        description: "Your profile has been updated",
      })
    } catch (error) {
      console.error("Error updating username:", error)
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (userData) {
      setEditedUsername(userData.username)
    }
  }

  const handleLogin = () => {
    onNavigate("login")
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{authError}</p>
        <Button className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black" onClick={handleLogin}>
          Go to Login
        </Button>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="mb-4">User not found. Please log in again.</p>
        <Button className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black" onClick={handleLogin}>
          Go to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-white shadow-md">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
                <button className="absolute bottom-0 right-1/3 bg-wanderly-button hover:bg-wanderly-buttonHover text-black p-2 rounded-full shadow-md">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <CardTitle>{userData.username}</CardTitle>
              <CardDescription>{userData.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600">Member since {new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wanderly-button"
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      value={userData.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="p-2 bg-gray-100 rounded-md">{userData.username}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-2 bg-gray-100 rounded-md">{userData.email}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </>
              ) : (
                <Button className="bg-wanderly-button hover:bg-wanderly-buttonHover text-black" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Your travel preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.preferences && userData.preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userData.preferences.map((pref, index) => (
                    <span key={index} className="bg-wanderly-button text-black px-3 py-1 rounded-full text-sm">
                      {pref}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No preferences set yet</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => onNavigate("preferences")}>
                Manage Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
