"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import AppHeader from "@/components/UI/app-header"

interface PasswordResetSuccessPageProps {
  onNavigate: (screen: string) => void
}
//just showing password is resest confirmation
export default function PasswordResetSuccessPage({ onNavigate }: PasswordResetSuccessPageProps) {
  const handleReturnClick = () => {
    onNavigate("login")
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <div className="mb-6 border border-black rounded-full p-2">
          <Check className="h-6 w-6 text-black" />
        </div>

        <h2 className="text-xl font-medium text-center mb-8">Password Reset successfully!</h2>

        <Button
          className="w-full max-w-xs bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
          onClick={handleReturnClick}
        >
          Return to Login
        </Button>
      </div>
    </div>
  )
}
