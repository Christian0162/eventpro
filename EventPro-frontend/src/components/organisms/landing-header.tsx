import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/atoms/logo"

const LINKS = [
  { href: "#suppliers", label: "Suppliers" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
]

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="uppercase tracking-wider">
            <Link to="/register">Sign up</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
