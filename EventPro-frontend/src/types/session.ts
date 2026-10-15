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

export interface SessionState {
  status: SessionStatus
  user: User | null
  userData: UserData | null
  setUser: (user: User | null) => void
  setUserData: (userData: UserData | null) => void
  markReady: () => void
  reset: () => void
}
