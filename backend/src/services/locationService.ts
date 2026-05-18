import Supercluster from 'supercluster'
import { pool } from '../db'

interface ViewportParams {
  north: number
  south: number
  east: number
  west: number
  zoom: number
  state?: string
  status?: string
  brandInitial?: string // ← new
}

export async function getViewportData({
  north,
  south,
  east,
  west,
  zoom,
  state,
  status,
  brandInitial,
}: ViewportParams) {
  // =========================
  // DYNAMIC FILTERS
  // =========================

  const filters: string[] = []
  const values: any[] = [south, north, west, east]
  let paramIndex = 5

  if (state) {
    filters.push(`LOWER(state) = LOWER($${paramIndex})`)
    values.push(state)
    paramIndex++
  }

  if (status) {
    filters.push(`LOWER(status) = LOWER($${paramIndex})`)
    values.push(status)
    paramIndex++
  }

  // ✅ brand initial: match brand_name starting with that letter
  if (brandInitial) {
    filters.push(`UPPER(brand_name) LIKE $${paramIndex}`)
    values.push(`${brandInitial.toUpperCase()}%`)
    paramIndex++
  }

  const filterSql = filters.length > 0 ? `AND ${filters.join(' AND ')}` : ''

  // =========================
  // TIER 1 — STATE VIEW
  // =========================

  if (zoom <= 4) {
    const result = await pool.query(
      `
      SELECT
        state,
        COUNT(*)::int AS count,
        AVG(latitude)  AS latitude,
        AVG(longitude) AS longitude
      FROM stores
      WHERE latitude  BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
        ${filterSql}
      GROUP BY state
      ORDER BY state
      `,
      values,
    )

    return { tier: 'state', data: result.rows }
  }

  // =========================
  // FETCH STORES IN VIEWPORT
  // =========================

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
  WHERE latitude  BETWEEN $1 AND $2
    AND longitude BETWEEN $3 AND $4
    ${filterSql}
  `,
    values,
  )

  const stores = result.rows

  // =========================
  // TIER 3 — INDIVIDUAL STORES
  // =========================

  if (zoom >= 10) {
    return { tier: 'stores', data: stores }
  }

  // =========================
  // TIER 2 — CLUSTERS
  // =========================

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
      coordinates: [Number(store.longitude), Number(store.latitude)],
    },
  }))

  const supercluster = new Supercluster({ radius: 60, maxZoom: 16 })
  supercluster.load(points as any)

  const clusters = supercluster.getClusters(
    [west, south, east, north],
    Math.floor(zoom),
  )

  return { tier: 'clusters', data: clusters }
}
