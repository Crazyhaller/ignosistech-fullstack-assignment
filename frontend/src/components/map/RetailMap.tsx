import { APIProvider, InfoWindow, Map, Marker } from '@vis.gl/react-google-maps'
import { useEffect, useMemo, useState } from 'react'
import { useViewportData } from '../../hooks/useViewportData'
import { useMapStore } from '../../store/mapStore'
import FilterSidebar from '../ui/FilterSidebar'

// ── Helpers ──────────────────────────────────────────────
const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// Known brand code → real Clearbit domain
const BRAND_DOMAIN_MAP: Record<string, string> = {
  // Big Box / General
  w: 'walmart.com',
  t: 'target.com',
  k: 'kroger.com',
  hd: 'homedepot.com',
  l: 'lowes.com',
  c: 'costco.com',
  b: 'bestbuy.com',
  // Grocery
  wfm: 'wholefoodsmarket.com',
  sfm: 'sprouts.com',
  nc: 'natchezcola.com',
  sc: 'safeway.com',
  am: 'aldi.com',
  hc: 'harristeeter.com',
  // Dollar / Discount
  dg: 'dollargeneral.com',
  dt: 'dollartree.com',
  fd: 'familydollar.com',
  // Pharmacy / Health
  cw: 'cvs.com',
  r: 'riteaid.com',
  // Clothing / Apparel
  od: 'oldnavy.com',
  es: 'expressfashion.com',
  // Home / Furniture
  bbm: 'bedbathandbeyond.com',
  // Sports / Outdoor
  dsg: 'dickssportinggoods.com',
  bps: 'basspro.com',
  // Auto
  hl: 'harborfreight.com',
  hft: 'harborfreight.com',
  // Food / Restaurant
  m: 'mcdonalds.com',
  p: 'pizzahut.com',
  s: 'subway.com',
  // Other
  tj: 'traderjoes.com',
  nr: 'nordstromrack.com',
  i: 'ikea.com',
  ng: 'gap.com',
  ms: 'macys.com',
  ah: 'acehardware.com',
  tsc: 'tractorsupply.com',
  tvc: 'tractor.com',
  tm: 'tjmaxx.com',
  tmr: 'marshalls.com',
  lm: 'lehmanns.com',
  a: 'amazon.com',
  fb: 'fivebelow.com',
  bcf: 'burlingtoncoatfactory.com',
  ssnl: 'seasonal.com',
  sfads: 'safeway.com',
  k: 'kroger.com',
  hd: 'homedepot.com',
  jf: 'jiffylube.com',
  twam: 'walmart.com',
  sc: 'starbucks.com',
  dib: 'dicks.com',
  lpas: 'lpas.com',
  fkcpf: 'dollar.com',
  b5sg: 'dollar.com',
}

const getBrandDomain = (brandCode: string): string | null => {
  const key = brandCode.toLowerCase().trim()
  return BRAND_DOMAIN_MAP[key] ?? null
}

/**
 * Tier 1 — white circular SVG bubble with state abbrev + count (two lines)
 * Renders as a data URL so no AdvancedMarker / Map ID needed.
 */
const getStateIcon = (state: string, count: number) => {
  const label = formatCount(count)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">
      <circle cx="28" cy="28" r="26" fill="white" stroke="#cbd5e1" stroke-width="2"/>
      <text x="28" y="22" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#0f172a">
        ${state}
      </text>
      <text x="28" y="36" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial,sans-serif" font-size="10" font-weight="600" fill="#475569">
        ${label}
      </text>
    </svg>
  `.trim()

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(56, 56),
    anchor: new google.maps.Point(28, 28),
  }
}

const getFallbackLetterIcon = (brandName: string) => {
  const letter = (brandName?.[0] ?? '?').toUpperCase()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="2"/>
      <text x="16" y="16" text-anchor="middle" dominant-baseline="central"
        font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="white">
        ${letter}
      </text>
    </svg>
  `.trim()
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
  }
}

// ── Component ─────────────────────────────────────────────
export default function RetailMap() {
  const [bounds, setBounds] = useState<any>(null)
  const { zoom, setZoom } = useMapStore()
  const [selectedStore, setSelectedStore] = useState<any>(null)
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set())
  const { data, loading } = useViewportData(bounds, zoom)

  const getClusterIcon = (count: number) => {
    const scale = count > 1000 ? 36 : count > 500 ? 30 : count > 100 ? 26 : 20
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#1e293b',
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale,
    }
  }

  const fallbackStoreIcon = useMemo(
    () => ({
      path: window.google?.maps.SymbolPath.CIRCLE,
      fillColor: '#10b981',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 6,
    }),
    [],
  )

  // Pre-validate Clearbit logos so we know which ones to skip before rendering
  useEffect(() => {
    if (data?.tier !== 'stores') return

    data.data.forEach((store: any) => {
      if (logoErrors.has(store.id)) return
      const domain = getBrandDomain(store.brand_name)
      if (!domain) return

      const img = new Image()
      img.onerror = () => setLogoErrors((prev) => new Set(prev).add(store.id))
      img.src = `https://logo.clearbit.com/${domain}`
    })
  }, [data])

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="relative" style={{ width: '100vw', height: '100vh' }}>
        {/* TOP-LEFT: Brand + Legend */}
        <div className="absolute left-5 top-5 z-50 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080f1e]/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#60a5fa"
                />
                <rect
                  x="9"
                  y="1"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#60a5fa"
                  fillOpacity=".5"
                />
                <rect
                  x="1"
                  y="9"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#60a5fa"
                  fillOpacity=".5"
                />
                <rect
                  x="9"
                  y="9"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#60a5fa"
                  fillOpacity=".3"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">
                RetailScope
              </p>
              <p className="text-[10px] leading-tight text-white/40">
                US Retail Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080f1e]/90 px-4 py-2.5 shadow-xl backdrop-blur-xl">
            <LegendDot color="#0f172a" label="States" />
            <div className="h-3 w-px bg-white/10" />
            <LegendDot color="#1e293b" label="Clusters" />
            <div className="h-3 w-px bg-white/10" />
            <LegendDot color="#10b981" label="Stores" />
          </div>
        </div>

        <FilterSidebar />

        {/* Loading toast */}
        {loading && (
          <div className="absolute bottom-6 left-5 z-50 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#080f1e]/90 px-4 py-2.5 text-xs text-white/70 shadow-xl backdrop-blur-xl">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            Fetching viewport data…
          </div>
        )}

        {/* Empty state */}
        {data && data.data.length === 0 && !loading && (
          <div className="absolute bottom-6 left-5 z-50 flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300 shadow-xl backdrop-blur-xl">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            No locations in this viewport
          </div>
        )}

        <Map
          defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
          defaultZoom={4}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={true}
          zoomControl={true}
          fullscreenControl={true}
          streetViewControl={false}
          style={{ width: '100%', height: '100%' }}
          onBoundsChanged={(event) => {
            const map = event.map
            const mapBounds = map.getBounds()
            if (!mapBounds) return
            const ne = mapBounds.getNorthEast()
            const sw = mapBounds.getSouthWest()
            setBounds({
              north: ne.lat(),
              south: sw.lat(),
              east: ne.lng(),
              west: sw.lng(),
            })
            const currentZoom = map.getZoom() || 4
            if (currentZoom !== zoom) setZoom(currentZoom)
          }}
        >
          {/* ── TIER 1 — STATES ── */}
          {data?.tier === 'state' &&
            data.data.map((item: any) => (
              <Marker
                key={item.state}
                position={{
                  lat: Number(item.latitude),
                  lng: Number(item.longitude),
                }}
                // SVG data URL renders "WA / 2.2k" two-line white bubble
                icon={getStateIcon(item.state, Number(item.count))}
                title={`${item.state}: ${formatCount(Number(item.count))} stores`}
              />
            ))}

          {/* ── TIER 2 — CLUSTERS ── */}
          {data?.tier === 'clusters' &&
            data.data.map((cluster: any) => {
              const [lng, lat] = cluster.geometry.coordinates
              const isCluster = cluster.properties.cluster
              return (
                <Marker
                  key={
                    isCluster
                      ? `cluster-${cluster.id}`
                      : cluster.properties.storeId
                  }
                  position={{ lat, lng }}
                  icon={
                    isCluster
                      ? getClusterIcon(cluster.properties.point_count)
                      : fallbackStoreIcon
                  }
                  label={
                    isCluster
                      ? {
                          text: String(cluster.properties.point_count),
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '12px',
                        }
                      : undefined
                  }
                  onClick={() => {
                    if (isCluster) setZoom(zoom + 2)
                  }}
                />
              )
            })}

          {/* ── TIER 3 — STORES ── */}
          {/* ── TIER 3 — STORES ── */}
          {data?.tier === 'stores' &&
            data.data.map((store: any) => {
              const domain = getBrandDomain(store.brand_name)
              // If no known domain, skip Clearbit entirely and go straight to letter icon
              const icon =
                !domain || logoErrors.has(store.id)
                  ? getFallbackLetterIcon(store.brand_name)
                  : {
                      url: `https://logo.clearbit.com/${domain}`,
                      scaledSize: new google.maps.Size(32, 32),
                      anchor: new google.maps.Point(16, 16),
                    }

              return (
                <Marker
                  key={store.id}
                  position={{
                    lat: Number(store.latitude),
                    lng: Number(store.longitude),
                  }}
                  icon={icon}
                  title={store.brand_name}
                  onClick={() => setSelectedStore(store)}
                />
              )
            })}

          {/* ── INFO WINDOW ── */}
          {selectedStore && (
            <InfoWindow
              position={{
                lat: Number(selectedStore.latitude),
                lng: Number(selectedStore.longitude),
              }}
              onCloseClick={() => setSelectedStore(null)}
            >
              <div style={{ minWidth: 180, padding: 4 }}>
                {/* Brand + logo */}
                {/* Brand + logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getBrandDomain(selectedStore.brand_name) && (
                    <img
                      src={`https://logo.clearbit.com/${getBrandDomain(selectedStore.brand_name)}`}
                      alt={selectedStore.brand_name}
                      width={24}
                      height={24}
                      style={{ borderRadius: 4, objectFit: 'contain' }}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    {selectedStore.brand_name.toUpperCase()}
                  </p>
                </div>

                {/* Location */}
                <p
                  style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}
                >
                  {selectedStore.city}, {selectedStore.state}
                </p>

                {/* Status badge only — no address/type since they don't exist in DB */}
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={selectedStore.status} />
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  )
}

// ── Sub-components ────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full border border-white/20"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-white/50">{label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: '#dcfce7', color: '#15803d' },
    Closed: { bg: '#fee2e2', color: '#dc2626' },
    Planned: { bg: '#fef9c3', color: '#b45309' },
  }
  const s = map[status] ?? { bg: '#f1f5f9', color: '#475569' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  )
}
