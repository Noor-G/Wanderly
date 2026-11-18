"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import WelcomePage from "@/components/pages/welcome-page"
import LoginPage from "@/components/pages/login-page"
import SignUpPage from "@/components/pages/sign-up-page"
import OtpVerificationPage from "@/components/pages/otp-verification-page"
import ForgotPasswordPage from "@/components/pages/forgot-password-page"
import ResetPasswordPage from "@/components/pages/reset-password-page"
import PasswordResetSuccessPage from "@/components/pages/password-reset-success-page"
import AccountCreatedPage from "@/components/pages/account-created-page"
import GetStartedPage from "@/components/pages/get-started-page"
import PreferencesPage from "@/components/pages/preferences-page"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import ProfilePage from "@/components/pages/profile-page"
import MapPage from "@/components/pages/map-page"
import ItineraryPage from "@/components/pages/itinerary-page"
import BookingsPage from "@/components/pages/bookings-page"
import BookingDetailPage from "@/components/pages/booking-detail-page"
import BookingConfirmationPage from "@/components/pages/booking-confirmation-page"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("welcome")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [screenParams, setScreenParams] = useState<Record<string, any>>({})
  const [isClient, setIsClient] = useState(false)

  // Add this effect to handle client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsAuthLoading(true)

        // Check for demo user first
        const demoUser = localStorage.getItem("demoUser")
        if (demoUser) {
          console.log("Demo user found in localStorage")
          setIsAuthenticated(true)

          // If on an auth page, redirect to map
          if (isAuthRoute(currentScreen)) {
            setCurrentScreen("map")
          }

          setIsAuthLoading(false)
          return
        }

        // Check for pendingUserData (newly signed up user)
        const pendingUserData = localStorage.getItem("pendingUserData")
        if (pendingUserData && isAuthRoute(currentScreen)) {
          console.log("Pending user data found in localStorage")
          // Don't set isAuthenticated yet, but allow them to proceed to account created page
          if (currentScreen === "signup") {
            setCurrentScreen("account-created")
          }
        }

        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking auth:", error)
          setIsAuthenticated(false)
          // If on a protected page, redirect to login
          if (isProtectedRoute(currentScreen)) {
            setCurrentScreen("login")
          }
        } else {
          const isAuthed = !!session
          setIsAuthenticated(isAuthed)

          // If authenticated and on an auth page, redirect to map
          if (isAuthed && isAuthRoute(currentScreen)) {
            setCurrentScreen("map")
          }
          // If not authenticated and on a protected page, redirect to login
          else if (!isAuthed && isProtectedRoute(currentScreen)) {
            setCurrentScreen("login")
          }
        }
      } catch (error) {
        console.error("Error in auth check:", error)
        setIsAuthenticated(false)
        // If on a protected page, redirect to login
        if (isProtectedRoute(currentScreen)) {
          setCurrentScreen("login")
        }
      } finally {
        setIsAuthLoading(false)
      }
    }

    if (isClient) {
      checkAuth()
    }

    // Set up auth state listener
    let subscription: { unsubscribe: () => void } | null = null

    if (isClient) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event)
        const isAuthed = !!session
        setIsAuthenticated(isAuthed)

        // Handle auth state changes
        if (event === "SIGNED_IN" || event === "SIGNED_UP") {
          // If on an auth page, redirect to map
          if (isAuthRoute(currentScreen)) {
            setCurrentScreen("map")
          }
        } else if (event === "SIGNED_OUT") {
          // Clear demo user from localStorage
          localStorage.removeItem("demoUser")
          localStorage.removeItem("pendingUserData")

          // If on a protected page, redirect to login
          if (isProtectedRoute(currentScreen)) {
            setCurrentScreen("login")
          }
        }
      })

      subscription = data.subscription
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [currentScreen, isClient])

  // Helper function to check if a route requires authentication
  const isProtectedRoute = (screen: string) => {
    const protectedRoutes = [
      "map",
      "profile",
      "itinerary",
      "bookings",
      "booking-detail",
      "booking-confirmation",
      "preferences",
    ]
    return protectedRoutes.includes(screen)
  }

  // Helper function to check if a route is an auth route
  const isAuthRoute = (screen: string) => {
    const authRoutes = [
      "welcome",
      "login",
      "signup",
      "otp-verification",
      "forgot-password",
      "reset-password",
      "password-reset-success",
      "account-created",
      "get-started",
    ]
    return authRoutes.includes(screen)
  }

  // Navigation handler
  const handleNavigate = (screen: string, params?: any) => {
    console.log(`Navigating to ${screen}`, params)
    setCurrentScreen(screen)

    if (params) {
      setScreenParams((prev) => ({
        ...prev,
        [screen]: params,
      }))
    }
  }

  // Helper to get current screen params
  const getCurrentParams = () => {
    return screenParams[currentScreen] || {}
  }

  // Render loading state while checking auth
  if (!isClient || isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  // Render the appropriate screen
  const renderScreen = () => {
    // For protected routes, wrap in DashboardLayout if authenticated
    if (isProtectedRoute(currentScreen) && isAuthenticated) {
      return (
        <DashboardLayout currentScreen={currentScreen} onNavigate={handleNavigate}>
          {renderProtectedScreen()}
        </DashboardLayout>
      )
    }

    // For auth routes or when not authenticated
    switch (currentScreen) {
      case "welcome":
        return <WelcomePage onNavigate={handleNavigate} />
      case "login":
        return <LoginPage onNavigate={handleNavigate} />
      case "signup": // Make sure this matches exactly what's used in the login page
        return (
          <SignUpPage
            onLoginClick={() => handleNavigate("login")}
            onBackClick={() => handleNavigate("welcome")}
            onSignUpSuccess={() => handleNavigate("account-created")}
          />
        )
      case "otp-verification":
        return <OtpVerificationPage onNavigate={handleNavigate} params={getCurrentParams()} />
      case "forgot-password":
        return <ForgotPasswordPage onBackClick={() => handleNavigate("login")} onNavigate={handleNavigate} />
      case "reset-password":
        return <ResetPasswordPage onNavigate={handleNavigate} params={getCurrentParams()} />
      case "password-reset-success":
        return <PasswordResetSuccessPage onNavigate={handleNavigate} />
      case "account-created":
        return <AccountCreatedPage onContinueClick={() => handleNavigate("login")} />
      case "get-started":
        return <GetStartedPage onNavigate={handleNavigate} />
      default:
        // If not authenticated and trying to access a protected route, show login
        return <LoginPage onNavigate={handleNavigate} />
    }
  }

  // Render protected screens (used within DashboardLayout)
  const renderProtectedScreen = () => {
    switch (currentScreen) {
      case "map":
        return <MapPage onNavigate={handleNavigate} currentScreen={currentScreen} />
      case "profile":
        return <ProfilePage onNavigate={handleNavigate} currentScreen={currentScreen} />
      case "itinerary":
        return <ItineraryPage onNavigate={handleNavigate} currentScreen={currentScreen} params={getCurrentParams()} />
      case "bookings":
        return <BookingsPage onNavigate={handleNavigate} currentScreen={currentScreen} />
      case "booking-detail":
        return (
          <BookingDetailPage onNavigate={handleNavigate} currentScreen={currentScreen} params={getCurrentParams()} />
        )
      case "booking-confirmation":
        return (
          <BookingConfirmationPage
            onNavigate={handleNavigate}
            currentScreen={currentScreen}
            params={getCurrentParams()}
          />
        )
      case "preferences":
        return <PreferencesPage onNavigate={handleNavigate} currentScreen={currentScreen} />
      default:
        return <MapPage onNavigate={handleNavigate} currentScreen={currentScreen} />
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <main className="min-h-screen bg-background">{renderScreen()}</main>
    </ThemeProvider>
  )
}
