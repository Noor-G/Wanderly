export interface Attraction {
  id: string
  name: string
  description?: string
  location?: string
  categories: string[]
  cost: number
  currency: string
}
