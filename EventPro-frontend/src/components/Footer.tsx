import { Link } from "react-router-dom"
import { Logo } from "@/components/shared/Logo"

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/events", label: "Events" },
  { to: "/login", label: "Log in" },
]

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            Book trusted suppliers, agree on contracts and pay in one place.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="mailto:support@eventpro.com" className="text-muted-foreground transition-colors hover:text-foreground">
                support@eventpro.com
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EventPro. All rights reserved.
      </div>
    </footer>
  )
}
