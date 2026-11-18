"use client"

import { useState } from "react"
import { User, Mail, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppHeader from "@/components/UI/app-header"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface SignUpPageProps {
  onLoginClick: () => void
  onBackClick: () => void
  onSignUpSuccess?: () => void
}

export default function SignUpPage({ onLoginClick, onBackClick, onSignUpSuccess }: SignUpPageProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create a safe version of onSignUpSuccess that won't throw an error if not provided
  const handleSignUpSuccess = () => {
    if (onSignUpSuccess) {
      onSignUpSuccess()
    } else {
      // Default behavior if onSignUpSuccess is not provided
      console.log("Sign up successful, but no success handler provided")
      // Navigate to login page as a fallback
      onLoginClick()
    }
  }

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Starting signup process for:", email)

      // Clear any existing sessions first to avoid conflicts
      await supabase.auth.signOut()

      // Sign up with Supabase
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signupError) {
        console.error("Signup error:", signupError)
        throw signupError
      }

      console.log("Signup response:", data)

      // Check if user was created successfully
      if (data.user) {
        console.log("User created successfully:", data.user.id)

        // Store user data in localStorage as a fallback
        localStorage.setItem(
          "pendingUserData",
          JSON.stringify({
            id: data.user.id,
            email,
            username,
            signupDate: new Date().toISOString(),
          }),
        )

     

        // If we have a session, the user is already logged in
        if (data.session) {
          console.log("User signed up and logged in successfully")
          setSuccessMessage("Account created successfully!")

          // Navigate directly to the map page
          setTimeout(() => {
            window.location.href = "/" // Force a full page reload to update auth state
          }, 1000)
          return
        }

        // If no session but user was created, show success and go to account created page
        setSuccessMessage("Account created successfully! Please check your email for verification.")

        // Short delay before navigating to account created page
        setTimeout(() => {
          handleSignUpSuccess()
        }, 1500)
      } else {
        throw new Error("Failed to create user account")
      }
    } catch (err: any) {
      console.error("Error in signup:", err)

      // Handle specific error messages
      if (err.message?.includes("already registered")) {
        setError("This email is already registered. Please try logging in instead.")
      } else if (err.message?.includes("valid email")) {
        setError("Please enter a valid email address.")
      } else {
        setError(err.message || "Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-screen">
      <AppHeader />

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-wanderly-border shadow-wanderly-md">
          <CardHeader className="bg-wanderly-header rounded-t-lg">
            <div className="flex items-center mb-4">
              <button onClick={onBackClick} className="mr-2 text-black hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <CardTitle>Sign Up</CardTitle>
            </div>
            <CardDescription>Create your Wanderly account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-white border-wanderly-border focus:ring-wanderly-button"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-white border-wanderly-border focus:ring-wanderly-button"
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-white border-wanderly-border focus:ring-wanderly-button"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Button variant="link" className="p-0 text-wanderly-link" onClick={onLoginClick}>
                Login
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
