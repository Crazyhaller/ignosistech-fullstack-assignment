import { create } from 'zustand'

interface FilterState {
  state: string
  status: string
  brandInitial: string

  setStateFilter: (state: string) => void
  setStatusFilter: (status: string) => void
  setBrandInitialFilter: (brandInitial: string) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  state: '',
  status: '',
  brandInitial: '',

  setStateFilter: (state) => set({ state }),
  setStatusFilter: (status) => set({ status }),
  setBrandInitialFilter: (brandInitial) => set({ brandInitial }),
}))
