import { useEffect, useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { fetchLocations } from '../api/locationApi'
import { useFilterStore } from '../store/filterStore'

interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

const MAX_CACHE = 50
const cache = new Map()

const setCache = (key: string, value: any) => {
  if (cache.size >= MAX_CACHE) {
    cache.delete(cache.keys().next().value)
  }
  cache.set(key, value)
}

export function useViewportData(bounds: Bounds | null, zoom: number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { state, status, brandInitial } = useFilterStore()

  const debouncedFetch = useMemo(
    () =>
      debounce(
        async (
          bounds: Bounds,
          zoom: number,
          state: string,
          status: string,
          brandInitial: string,
        ) => {
          try {
            setLoading(true)

            const cacheKey = JSON.stringify({
              ...bounds,
              zoom,
              state,
              status,
              brandInitial,
            })

            if (cache.has(cacheKey)) {
              setData(cache.get(cacheKey))
              return
            }

            const response = await fetchLocations({
              ...bounds,
              zoom,
              state,
              status,
              brandInitial,
            })

            setCache(cacheKey, response)
            setData(response)
          } catch (error) {
            console.error(error)
          } finally {
            setLoading(false)
          }
        },
        300,
      ),
    [],
  )

  useEffect(() => {
    if (!bounds) return
    debouncedFetch(bounds, zoom, state, status, brandInitial)
    return () => debouncedFetch.cancel()
  }, [bounds, zoom, state, status, brandInitial])

  return { data, loading }
}
