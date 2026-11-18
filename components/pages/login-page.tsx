"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface LoginPageProps {
  onNavigate: (screen: string) => void
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check for demo login
      if (email === "demo@example.com" && password === "demo123") {
        console.log("Demo login successful")
        localStorage.setItem("demoUser", JSON.stringify({ email }))
        onNavigate("map")
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5eeff] flex flex-col">
      <header className="p-4">
        <div className="flex items-center">
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
          <span className="font-bold ml-2">WANDERLY</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-8 text-center">Login</h1>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-lavender pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-lavender pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <div className="text-right">
              <button type="button" onClick={() => onNavigate("forgot-password")} className="text-sm underline">
                forgot password?
              </button>
            </div>

            <button type="submit" className="btn-lavender w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p>
              Don't have an account?{" "}
              <button onClick={() => onNavigate("signup")} className="underline font-medium">
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
