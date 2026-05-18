import { FiFilter, FiX } from 'react-icons/fi'
import { useFilterStore } from '../../store/filterStore'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function FilterSidebar() {
  const {
    state,
    status,
    brandInitial,
    setStateFilter,
    setStatusFilter,
    setBrandInitialFilter,
  } = useFilterStore()

  const hasFilters = state || status || brandInitial

  const clearAll = () => {
    setStateFilter('')
    setStatusFilter('')
    setBrandInitialFilter('')
  }

  return (
    <div className="absolute right-5 top-5 z-50 w-64 rounded-2xl border border-white/10 bg-[#080f1e]/90 p-4 text-white shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            <FiFilter size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Filters</p>
            <p className="text-[10px] leading-tight text-white/35">
              Refine locations
            </p>
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white/80"
          >
            <FiX size={10} />
            Clear all
          </button>
        )}
      </div>

      <div className="my-3.5 h-px bg-white/[0.06]" />

      {/* State */}
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-white/30">
          State
        </label>
        <input
          value={state}
          onChange={(e) => setStateFilter(e.target.value)}
          placeholder="e.g. Texas"
          className="w-full rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-xs text-white placeholder:text-white/25 outline-none transition-all focus:border-blue-500/40 focus:bg-white/[0.07]"
        />
      </div>

      {/* Brand Initial */}
      <div className="mt-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Brand (by first letter)
        </label>
        <div className="flex flex-wrap gap-1">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() =>
                setBrandInitialFilter(brandInitial === letter ? '' : letter)
              }
              className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold transition-all ${
                brandInitial === letter
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Status
        </label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none transition-all focus:border-blue-500/40 focus:bg-white/[0.07]"
          >
            <option value="" className="bg-[#0e1828]">
              All statuses
            </option>
            <option value="Active" className="bg-[#0e1828]">
              Active
            </option>
            <option value="Closed" className="bg-[#0e1828]">
              Closed
            </option>
            <option value="Planned" className="bg-[#0e1828]">
              Planned
            </option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
          >
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Active filter pills */}
      {hasFilters && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {state && (
            <Pill
              label={state}
              color="blue"
              onRemove={() => setStateFilter('')}
            />
          )}
          {brandInitial && (
            <Pill
              label={`Brand: ${brandInitial}…`}
              color="purple"
              onRemove={() => setBrandInitialFilter('')}
            />
          )}
          {status && (
            <Pill
              label={status}
              color={
                status === 'Active'
                  ? 'green'
                  : status === 'Closed'
                    ? 'red'
                    : 'amber'
              }
              onRemove={() => setStatusFilter('')}
            />
          )}
        </div>
      )}

      <p className="mt-3.5 text-[10px] leading-relaxed text-white/25">
        Results update live as you pan and zoom.
      </p>
    </div>
  )
}

type PillColor = 'blue' | 'purple' | 'green' | 'red' | 'amber'

function Pill({
  label,
  color,
  onRemove,
}: {
  label: string
  color: PillColor
  onRemove: () => void
}) {
  const styles: Record<PillColor, string> = {
    blue: 'bg-blue-500/15 text-blue-300',
    purple: 'bg-purple-500/15 text-purple-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    red: 'bg-red-500/15 text-red-300',
    amber: 'bg-amber-500/15 text-amber-300',
  }
  return (
    <span
      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] ${styles[color]}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 opacity-60 hover:opacity-100"
      >
        <FiX size={9} />
      </button>
    </span>
  )
}
