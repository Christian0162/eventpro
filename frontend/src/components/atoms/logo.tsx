import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import logoUrl from "@/assets/eventpro-logo.png"

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight", className)}
      aria-label="EventPro home"
    >
      <img src={logoUrl} alt="" className="size-8" />
      <span>
        Event<span className="text-primary">Pro</span>
      </span>
    </Link>
  )
}
