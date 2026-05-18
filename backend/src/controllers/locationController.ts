import { Request, Response } from 'express'
import { getViewportData } from '../services/locationService'

export async function getLocations(req: Request, res: Response) {
  try {
    const { north, south, east, west, zoom, state, status, brandInitial } =
      req.query

    if (!north || !south || !east || !west || !zoom) {
      return res.status(400).json({ message: 'Missing query params' })
    }

    const data = await getViewportData({
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west),
      zoom: Number(zoom),
      state: state?.toString() || '',
      status: status?.toString() || '',
      brandInitial: brandInitial?.toString() || '',
    })

    return res.json(data)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
