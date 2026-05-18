import { create } from 'zustand'

interface MapState {
  zoom: number
  setZoom: (zoom: number) => void
}

export const useMapStore = create<MapState>((set) => ({
  zoom: 4,
  setZoom: (zoom) => set({ zoom }),
}))
