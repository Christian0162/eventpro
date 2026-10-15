import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ThemePreference = "light" | "dark" | "system"

interface UIState {
  theme: ThemePreference
  mobileNavOpen: boolean
  setTheme: (theme: ThemePreference) => void
  setMobileNavOpen: (open: boolean) => void
}

/** Shared, non-sensitive UI preferences. Only `theme` is persisted. */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      mobileNavOpen: false,
      setTheme: (theme) => set({ theme }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
    }),
    {
      name: "eventpro-ui",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)

export function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme
  if (typeof window === "undefined" || !window.matchMedia) return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}
