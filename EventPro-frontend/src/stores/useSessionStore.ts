import { create } from "zustand"
import type { User } from "firebase/auth"

/** Firestore `users/{uid}` document. Fields are optional because legacy docs vary. */
export interface UserData {
  id: string
  first_name?: string
  last_name?: string
  email_address?: string
  role?: "Event Planner" | "Supplier" | "Admin" | string
  status?: string
  verification_status?: string
  [key: string]: unknown
}

export type SessionStatus = "initializing" | "ready"

interface SessionState {
  status: SessionStatus
  user: User | null
  userData: UserData | null
  setUser: (user: User | null) => void
  setUserData: (userData: UserData | null) => void
  markReady: () => void
  reset: () => void
}

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
