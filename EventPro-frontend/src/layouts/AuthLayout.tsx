import { useEffect, type ReactNode } from "react"
import { signOut, type User } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import NavBar from "@/components/organisms/nav-bar"
import Footer from "@/components/organisms/footer"
import Loading from "@/components/atoms/loading"
import { notify } from "@/lib/notify"
import type { UserData } from "@/stores/useSessionStore"

interface Props {
  children: ReactNode
  user: User | null
  userData: UserData | null
}

export default function AuthLayout({ children, user, userData }: Props) {
  const isBanned = userData?.status === "banned"

  useEffect(() => {
    if (!isBanned) return
    notify.warning("Account disabled", "This account has been banned by an admin.")
    void signOut(auth)
  }, [isBanned])

  if (!userData || !user) return <Loading />

  return (
    <div className="flex min-h-screen flex-col bg-secondary/40">
      <NavBar user={user} userData={userData} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  )
}
