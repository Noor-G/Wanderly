// Authentication-related type definitions

export type AuthState = {
  isAuthenticated: boolean
  user: {
    id: string
    username: string
  } | null
}
