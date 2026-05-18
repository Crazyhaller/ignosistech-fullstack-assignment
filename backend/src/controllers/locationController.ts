import { Request, Response } from 'express'
import { getViewportData } from '../services/locationService'

export async function getLocations(req: Request, res: Response) {
  try {
    const { north, south, east, west, zoom } = req.query

    if (!north || !south || !east || !west || !zoom) {
      return res.status(400).json({
        message: 'Missing query params',
      })
    }

    const data = await getViewportData({
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west),
      zoom: Number(zoom),
    })

    res.json(data)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Internal server error',
    })
  }
}
