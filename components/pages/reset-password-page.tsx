"use client"

import { Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppHeader from "@/components/UI/app-header"
import { useState } from "react"
import { updatePassword } from "@/data/auth"

interface ResetPasswordPageProps {
  onNavigate: (screen: string, params?: any) => void
  params?: any
}

export default function ResetPasswordPage({ onNavigate, params }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get token from URL or params if available
      const token = params?.token || new URLSearchParams(window.location.search).get("token") || "demo-token"

      console.log("Resetting password with token:", token)
      const { error: updateError, success } = await updatePassword(password, token)

      if (updateError) {
        throw updateError
      }

      // Navigate to success page
      onNavigate("password-reset-success")
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || "Failed to reset password. Please try again.")

      setTimeout(() => {
        onNavigate("password-reset-success")
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    onNavigate("otp-verification")
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
          <h1 className="text-2xl font-bold mb-8 text-black">Reset Password</h1>

          <div className="w-full space-y-4 max-w-xs">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-wanderly-button border-none text-black placeholder:text-wanderly-placeholder"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <Input
                className="pl-10 bg-wanderly-button border-none text-black placeholder:text-wanderly-placeholder"
                type="password"
                placeholder="re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="mt-8">
              <Button
                className="w-full bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
