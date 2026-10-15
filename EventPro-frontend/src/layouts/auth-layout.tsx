import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { signOut, type User } from "firebase/auth"
import { ChevronLeft, Menu, Plus, Search } from "lucide-react"
import { auth } from "@/firebase/firebase"
import AppSidebar from "@/components/organisms/app-sidebar"
import Loading from "@/components/atoms/loading"
import UserDropDown from "@/components/molecules/user-dropdown"
import UserNotification from "@/components/organisms/user-notification"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useUIStore } from "@/stores/use-uistore"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/notify"
import type { UserData } from "@/types/session"

interface Props {
  children: ReactNode
  user: User | null
  userData: UserData | null
}

export default function AuthLayout({ children, user, userData }: Props) {
  const navigate = useNavigate()
  const mobileOpen = useUIStore((s) => s.mobileNavOpen)
  const setMobileOpen = useUIStore((s) => s.setMobileNavOpen)
  const [term, setTerm] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "1"
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sidebar-collapsed", c ? "0" : "1")
      } catch {
        /* storage unavailable */
      }
      return !c
    })
  }
  const isBanned = userData?.status === "banned"

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!isBanned) return
    notify.warning("Account disabled", "This account has been banned by an admin.")
    void signOut(auth)
  }, [isBanned])

  if (!userData || !user) return <Loading />

  const isPlanner = userData.role === "Event Planner"
  const isAdmin = userData.role === "Admin"

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = term.trim()
    navigate(q ? `/suppliers?q=${encodeURIComponent(q)}` : "/suppliers")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent/40">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border/60 bg-gradient-to-b from-secondary to-accent/60 transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-56",
        )}
      >
        <AppSidebar userData={userData} collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-56")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-secondary p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <AppSidebar userData={userData} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {!isAdmin && (
            <form onSubmit={onSearch} role="search" className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search suppliers, services, or locations..."
                aria-label="Search suppliers"
                className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-14 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground sm:block">
                ⌘K
              </kbd>
            </form>
          )}

          <div className="ml-auto flex items-center gap-3">
            {!isAdmin && <UserNotification userData={userData} />}
            <UserDropDown userData={userData} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
