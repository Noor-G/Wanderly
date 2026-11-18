"use client"

import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppHeader from "@/components/UI/app-header"
import { useState } from "react"

interface OtpVerificationPageProps {
  onNavigate: (screen: string, params?: any) => void
  params?: any
}

export default function OtpVerificationPage({ onNavigate, params }: OtpVerificationPageProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = () => {
    // Check if OTP is a number (or at least contains only digits)
    if (!otp) {
      setError("Please enter the OTP code")
      return
    }

    if (!/^\d+$/.test(otp)) {
      setError("Please enter a numeric OTP")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Any numeric OTP is considered valid in this pseudo implementation
      console.log("OTP validation successful (pseudo mode)")

      // Generate a fake reset token
      const resetToken = `demo-token-${Date.now()}`

      setTimeout(() => {
        onNavigate("reset-password", { token: resetToken, email: params?.email })
      }, 1000)
    } catch (err) {
      console.error("Error validating OTP:", err)
      setError("Failed to validate OTP. Please try again.")
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    onNavigate("forgot-password")
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col">
        <button onClick={handleBackClick} className="mb-4 flex items-center text-black hover:text-gray-700">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-8 text-black">Verify OTP</h1>

          <div className="w-full space-y-4 max-w-xs">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <Input
              className="bg-wanderly-button border-none text-black placeholder:text-wanderly-placeholder text-center"
              placeholder="enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="mt-8">
              <Button
                className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
                onClick={handleValidate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
