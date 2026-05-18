export interface StateAggregate {
  state: string
  count: string
  latitude: string
  longitude: string
}

export interface Store {
  id: string
  brand_name: string
  latitude: number
  longitude: number
  state: string
  city: string
  status: string
  // address and type removed — not in DB schema
}

export interface ApiResponse {
  tier: 'state' | 'clusters' | 'stores'
  data: any[]
}
