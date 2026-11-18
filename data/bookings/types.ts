export interface Booking {
  id: string
  attractionId: string
  attractionName: string 
  date: string
  time: string
  status: string
  notes?: string
  cost: number
  numberOfPeople: number
  location: string 
}

export interface BookableAttraction {
  id: string
  name: string
  description: string
  location: string
  category?: string
  cost: number
  requiresBooking: boolean
}
