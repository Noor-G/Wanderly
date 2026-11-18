"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import AppHeader from "@/components/UI/app-header"

interface AccountCreatedPageProps {
  onContinueClick: () => void
}

export default function AccountCreatedPage({ onContinueClick }: AccountCreatedPageProps) {
  // Ensuring that the click handler is properly defined
  const handleContinueClick = () => {
    console.log("Continue to Login button clicked")
    onContinueClick()
  }

  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <div className="mb-6 border border-black rounded-full p-2">
          <Check className="h-6 w-6 text-black" />
        </div>

        <h2 className="text-xl font-medium text-center mb-4">Account created successfully!</h2>

        <p className="text-center text-gray-700 mb-8">
          Your account has been created successfully. You can now log in to access your account.
        </p>

        <Button
          className="w-full max-w-xs bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
          onClick={handleContinueClick}
          type="button"
        >
          Continue to Login
        </Button>
      </div>
    </div>
  )
}
