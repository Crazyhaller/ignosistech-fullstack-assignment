export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

export interface Store {
  id: string
  brand_name: string
  latitude: number
  longitude: number
  state: string
  city: string
  address: string // ✅ added
  status: string
  type: string // ✅ added
}
