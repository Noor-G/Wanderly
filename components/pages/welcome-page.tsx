"use client"

interface WelcomePageProps {
  onNavigate: (screen: string) => void
}

export default function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5eeff" }}>
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-black"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <h1 className="text-xl font-bold text-black">WANDERLY</h1>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center py-12">
          <div className="mb-12 flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-24 w-24 text-black mb-6"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <h2 className="text-4xl font-bold text-black mb-8">WANDERLY</h2>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button className="btn-lavender w-full" onClick={() => onNavigate("signup")}>
                Sign Up
              </button>
              <button className="btn-lavender w-full" onClick={() => onNavigate("login")}>
                Login
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
