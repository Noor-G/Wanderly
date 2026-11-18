// Itinerary-related type definitions

export interface ItineraryItem {
  id: string
  title: string
  time?: string
  cost?: number
  location?: string
  notes?: string
  order: number
  date?: string 
}

export interface ItineraryDay {
  id: string
  dayNumber: number
  date: string
  items: ItineraryItem[]
  totalCost: number
}

export interface Itinerary {
  id: string
  name: string
  days: ItineraryDay[]
  totalCost: number
}
