import { Link } from "react-router-dom"
import { Instagram, Linkedin, Twitter } from "lucide-react"
import { Logo } from "@/components/atoms/logo"

const SOCIALS = [
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
]

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { to: "/suppliers", label: "Find Suppliers" },
      { to: "/events", label: "Plan Events" },
      { to: "/chats", label: "Messages" },
      { to: "/favorites", label: "Favorites" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/#how-it-works", label: "How It Works" },
      { to: "/#suppliers", label: "Supplier Categories" },
      { to: "/#faq", label: "FAQ" },
      { href: "mailto:support@eventpro.com", label: "Help Center" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/login", label: "Log In" },
      { to: "/register", label: "Sign Up" },
      { href: "mailto:support@eventpro.com", label: "Contact" },
    ],
  },
]

const LEGAL = ["Privacy Policy", "Terms of Service", "Cookie Settings"]

const linkClass = "text-sm text-foreground transition-colors hover:text-primary"

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <ul className="mt-4 flex gap-3">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="text-primary transition-opacity hover:opacity-70"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Book trusted suppliers, agree on contracts and pay in one place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"to" in l ? (
                      <Link to={l.to!} className={linkClass}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EventPro. All Rights Reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((label) => (
              <li key={label}>
                <span className="cursor-default transition-colors hover:text-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
