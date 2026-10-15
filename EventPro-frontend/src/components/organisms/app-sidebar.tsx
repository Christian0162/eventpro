import { Link, NavLink } from "react-router-dom"
import {
  ArrowRight,
  Bell,
  ChartNoAxesCombined,
  Headphones,
  Heart,
  LayoutDashboard,
  CalendarDays,
  MessageCircleMore,
  Plus,
  Settings,
  Store,
  User as UserIcon,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/atoms/logo"
import logoUrl from "@/assets/eventpro-logo.png"
import { cn } from "@/lib/utils"
import { useFetchAllContact } from "@/hooks/use-contact"
import type { UserData } from "@/types/session"

interface Contact {
  user_id?: string
  unread?: boolean
}

interface Item {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
  )

export default function AppSidebar({
  userData,
  onNavigate,
  collapsed = false,
}: {
  userData: UserData
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const { contacts } = useFetchAllContact() as { contacts: Contact[] }
  const unread = contacts.filter((c) => c.user_id === userData.id && c.unread).length
  const isAdmin = userData.role === "Admin"

  const main: Item[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin
      ? []
      : [
          { to: "/events", label: "Events", icon: CalendarDays },
          { to: "/suppliers", label: "Suppliers", icon: Users },
        ]),
    ...(userData.role === "Supplier" ? [{ to: "/shop", label: "My Shop", icon: Store }] : []),
    ...(isAdmin ? [] : [{ to: "/chats", label: "Chats", icon: MessageCircleMore, badge: unread }]),
    ...(isAdmin ? [] : [{ to: "/favorites", label: "Favorites", icon: Heart }]),
    ...(isAdmin ? [] : [{ to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined }]),
    { to: "/notification", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: UserIcon },
    { to: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className={cn("flex h-full flex-col gap-6 p-3", collapsed && "items-center")}>
      {collapsed ? (
        <Link to="/dashboard" aria-label="EventPro home" className="flex h-9 items-center">
          <img src={logoUrl} alt="" className="size-8" />
        </Link>
      ) : (
        <Logo to="/dashboard" className="px-2" />
      )}
      <nav aria-label="Main" className={cn("flex flex-1 flex-col gap-1", collapsed && "items-center")}>
        {main.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={(a) => cn(itemClass(a), collapsed && "relative size-10 justify-center p-0")}
            onClick={onNavigate}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {!!badge &&
              (collapsed ? (
                <span className="absolute right-1 top-1 size-2.5 rounded-full bg-primary" />
              ) : (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {badge > 9 ? "9+" : badge}
                </span>
              ))}
          </NavLink>
        ))}
      </nav>
      {!collapsed && userData.role === "Event Planner" && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Planning an event?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your event and get matched with the best suppliers in your area.
          </p>
          <Link
            to="/events/create"
            onClick={onNavigate}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Create Event <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
      {collapsed && userData.role === "Event Planner" && (
        <Link
          to="/events/create"
          title="Create Event"
          aria-label="Create Event"
          className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-5" />
        </Link>
      )}
      <a
        href="mailto:support@eventpro.com"
        title={collapsed ? "Need help?" : undefined}
        aria-label="Need help? Contact support"
        className={cn(
          "flex items-center gap-3 rounded-xl px-2 py-1 text-muted-foreground hover:text-foreground",
          collapsed && "size-10 justify-center p-0",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Headphones className="size-4" />
        </span>
        {!collapsed && (
          <span className="text-xs leading-tight">
            <span className="block font-semibold text-foreground">Need help?</span>
            support@eventpro.com
          </span>
        )}
      </a>
    </div>
  )
}
