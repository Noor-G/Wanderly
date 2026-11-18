"use client"

import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppHeader from "@/components/UI/app-header"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ForgotPasswordPageProps {
  onBackClick?: () => void
  onNavigate: (screen: string, params?: any) => void
}

export default function ForgotPasswordPage({ onBackClick, onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleGenerateOtp = async () => {
    if (!email) {
      setError("Please enter your email")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
//otp generation
    try {
      console.log("Pseudo OTP generation for:", email)

      setSuccessMessage("OTP has been generated (pseudo mode). Any numeric code will work.")

      setTimeout(() => {
        onNavigate("otp-verification", { email })
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to generate OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      onNavigate("login")
    }
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-screen">
      <AppHeader />

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-wanderly-border shadow-wanderly-md">
          <CardHeader className="bg-wanderly-header rounded-t-lg">
            <div className="flex items-center mb-4">
              <button onClick={handleBack} className="mr-2 text-black hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <CardTitle>Forgot Password</CardTitle>
            </div>
            <CardDescription>Enter your email to receive reset instructions</CardDescription>
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
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-white border-wanderly-border focus:ring-wanderly-button"
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
              onClick={handleGenerateOtp}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Reset Password"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
