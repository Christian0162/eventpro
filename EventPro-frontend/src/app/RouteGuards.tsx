import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import type { User } from "firebase/auth"
import AuthLayout from "@/layouts/AuthLayout"
import GuestLayout from "@/layouts/GuestLayout"
import type { UserData } from "@/stores/useSessionStore"

interface SessionProps {
  user: User | null
  userData: UserData | null
}

/** Private page inside the authenticated shell. Redirects guests to /login. */
export function Private({ user, userData, children }: SessionProps & { children: ReactNode }) {
  if (!user) return <Navigate to="/login" replace />
  return (
    <AuthLayout user={user} userData={userData}>
      {children}
    </AuthLayout>
  )
}

/** Private page restricted to one role. Other signed-in users go to their dashboard. */
export function RoleOnly({
  role,
  user,
  userData,
  children,
}: SessionProps & { role: string; children: ReactNode }) {
  if (!user) return <Navigate to="/login" replace />
  if (userData && userData.role !== role) return <Navigate to="/dashboard" replace />
  return (
    <AuthLayout user={user} userData={userData}>
      {children}
    </AuthLayout>
  )
}

/** Public page inside the marketing/guest shell. */
export function Public({ user, userData, children }: SessionProps & { children: ReactNode }) {
  return (
    <GuestLayout user={user} userData={userData}>
      {children}
    </GuestLayout>
  )
}
