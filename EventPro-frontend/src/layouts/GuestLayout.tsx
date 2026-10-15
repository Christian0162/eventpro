import type { ReactNode } from "react"
import type { User } from "firebase/auth"
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"
import type { UserData } from "@/stores/useSessionStore"

interface Props {
  children: ReactNode
  user: User | null
  userData: UserData | null
}

export default function GuestLayout({ children, user, userData }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar user={user} userData={userData} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
