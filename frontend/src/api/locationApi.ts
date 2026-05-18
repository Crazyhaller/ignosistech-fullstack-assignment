import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

interface FetchLocationsParams {
  north: number
  south: number
  east: number
  west: number
  zoom: number

  state?: string
  status?: string
}

export async function fetchLocations(params: FetchLocationsParams) {
  const response = await api.get('/api/locations', {
    params,
  })

  return response.data
}
