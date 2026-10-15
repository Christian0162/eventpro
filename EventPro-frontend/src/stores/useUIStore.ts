import { create } from "zustand"

interface UIState {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

/** Shared, non-sensitive UI state. */
export const useUIStore = create<UIState>()((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}))
