"use client"

import { Button } from "@/components/ui/button"
import AppHeader from "@/components/UI/app-header"
import BottomNavigation from "@/components/UI/bottom-navigation"

interface GetStartedPageProps {
  onGetStartedClick: () => void
  onNavigate: (screen: string) => void
  currentScreen: string
}

export default function GetStartedPage({ onGetStartedClick, onNavigate, currentScreen }: GetStartedPageProps) {
  return (
    <div className="bg-wanderly-background flex flex-col min-h-[500px]">
      <AppHeader />

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2 text-black">Welcome to WANDERLY!</h1>
        <p className="text-wanderly-textSecondary mb-8">Let's plan your next trip.</p>

        <Button
          className="w-full max-w-xs bg-wanderly-button hover:bg-wanderly-buttonHover text-black font-medium py-2 rounded-md"
          onClick={onGetStartedClick}
        >
          Get started!
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  )
}
