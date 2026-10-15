import { create } from "zustand"
import type { SessionState } from "@/types/session"

/**
 * Holds the Firebase auth user and their profile document so layouts and route
 * guards share one subscription. Firebase stays the source of truth; this store
 * is only a mirror fed by `useSessionListener`.
 */
export const useSessionStore = create<SessionState>((set) => ({
  status: "initializing",
  user: null,
  userData: null,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  markReady: () => set({ status: "ready" }),
  reset: () => set({ user: null, userData: null }),
}))
