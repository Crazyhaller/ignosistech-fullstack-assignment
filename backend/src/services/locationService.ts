import Supercluster from 'supercluster'
import { pool } from '../db'

interface ViewportParams {
  north: number
  south: number
  east: number
  west: number
  zoom: number
}

export async function getViewportData({
  north,
  south,
  east,
  west,
  zoom,
}: ViewportParams) {
  // TIER 1 — STATE AGGREGATION
  if (zoom <= 4) {
    const result = await pool.query(
      `
      SELECT
        state,
        COUNT(*) as count,
        AVG(latitude) as latitude,
        AVG(longitude) as longitude
      FROM stores
      WHERE ST_Within(
        geom::geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      GROUP BY state
      `,
      [west, south, east, north],
    )

    return {
      tier: 'state',
      data: result.rows,
    }
  }

  // FETCH STORES IN VIEWPORT
  const result = await pool.query(
    `
    SELECT
      id,
      brand_name,
      latitude,
      longitude,
      state,
      city,
      status
    FROM stores
    WHERE ST_Within(
      geom::geometry,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )
    `,
    [west, south, east, north],
  )

  const stores = result.rows

  // TIER 3 — INDIVIDUAL STORES
  if (zoom >= 10) {
    return {
      tier: 'stores',
      data: stores,
    }
  }

  // TIER 2 — CLUSTERS

  const points = stores.map((store) => ({
    type: 'Feature',
    properties: {
      cluster: false,
      storeId: store.id,
      brand_name: store.brand_name,
      state: store.state,
      city: store.city,
      status: store.status,
    },
    geometry: {
      type: 'Point',
      coordinates: [store.longitude, store.latitude],
    },
  }))

  const supercluster = new Supercluster({
    radius: 60,
    maxZoom: 16,
  })

  supercluster.load(points as any)

  const clusters = supercluster.getClusters(
    [west, south, east, north],
    Math.floor(zoom),
  )

  return {
    tier: 'clusters',
    data: clusters,
  }
}
