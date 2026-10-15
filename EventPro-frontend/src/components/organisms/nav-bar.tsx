import { memo } from "react"
import { NavLink } from "react-router-dom"
import { ChartNoAxesCombined, Heart, Menu, MessageCircleMore } from "lucide-react"
import type { User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/atoms/logo"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/use-uistore"
import type { UserData } from "@/types/session"
import UserDropDown from "@/components/molecules/user-dropdown"
import UserNotification from "@/components/organisms/user-notification"
import { useFetchAllContact } from "@/hooks/use-contact"

interface Contact {
  user_id?: string
  unread?: boolean
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
  )

function UnreadChatLink({ userId }: { userId?: string }) {
  const { contacts } = useFetchAllContact() as { contacts: Contact[] }
  const unread = contacts.filter((c) => c.user_id === userId && c.unread).length

  return (
    <NavLink to="/chats" className={linkClass} aria-label={unread ? `Chats, ${unread} unread` : "Chats"}>
      <span className="relative inline-flex">
        <MessageCircleMore className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </span>
    </NavLink>
  )
}

interface NavBarProps {
  user: User | null
  userData: UserData | null
}

const NavBar = memo(function NavBar({ user, userData }: NavBarProps) {
  const mobileOpen = useUIStore((s) => s.mobileNavOpen)
  const setMobileOpen = useUIStore((s) => s.setMobileNavOpen)

  const mainLinks = ["dashboard", "suppliers", "events", ...(userData?.role === "Supplier" ? ["shop"] : []), "profile"]
  const guestLinks = [
    { to: "/login", label: "Log in" },
    { to: "/register", label: "Sign up" },
  ]
  const links = user ? mainLinks.map((p) => ({ to: `/${p}`, label: p[0].toUpperCase() + p.slice(1) })) : guestLinks

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo to={user ? "/dashboard" : "/"} />

        {user && (
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              {userData?.role !== "Admin" && (
                <NavLink to="/analytics" className={linkClass} aria-label="Analytics" title="Analytics">
                  <ChartNoAxesCombined className="size-5" />
                </NavLink>
              )}
              <NavLink to="/favorites" className={linkClass} aria-label="Favorites">
                <Heart className="size-5" />
              </NavLink>
              <UnreadChatLink userId={userData?.id} />
              <UserNotification userData={userData} />
              <div className="ml-2">
                <UserDropDown userData={userData} />
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <NavLink to="/login">Log in</NavLink>
              </Button>
              <Button asChild>
                <NavLink to="/register">Sign up</NavLink>
              </Button>
            </>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <>
                  {userData?.role !== "Admin" && (
                    <NavLink to="/analytics" className={linkClass} onClick={() => setMobileOpen(false)}>
                      Analytics
                    </NavLink>
                  )}
                  <NavLink to="/favorites" className={linkClass} onClick={() => setMobileOpen(false)}>
                    Favorites
                  </NavLink>
                  <NavLink to="/chats" className={linkClass} onClick={() => setMobileOpen(false)}>
                    Chats
                  </NavLink>
                  <NavLink to="/notification" className={linkClass} onClick={() => setMobileOpen(false)}>
                    Notifications
                  </NavLink>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
})

export default NavBar
