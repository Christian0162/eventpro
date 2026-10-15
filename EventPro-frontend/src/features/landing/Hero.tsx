import { Link } from "react-router-dom"
import { ArrowRight, CalendarCheck, FileSignature, MessagesSquare, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfettiAnimation } from "./ConfettiAnimation"

const STAGES = [
  { icon: Search, title: "Find a supplier", text: "Browse caterers, venues, stylists and more." },
  { icon: MessagesSquare, title: "Talk it through", text: "Ask questions and agree on details in chat." },
  { icon: FileSignature, title: "Sign the contract", text: "Both sides approve the terms in the app." },
  { icon: Wallet, title: "Pay securely", text: "Pay with GCash, Maya or card." },
  { icon: CalendarCheck, title: "Run your event", text: "Review your supplier once it's done." },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Every supplier your event needs, booked in one place.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            EventPro connects event planners with verified suppliers. Compare options, agree on a contract and pay
            without juggling chats, spreadsheets and receipts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Create a free account <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <div className="relative">
          <ConfettiAnimation className="pointer-events-none absolute -right-6 -top-10 z-10 size-48 sm:size-64" />
          <ol className="relative rounded-xl border bg-card p-2 shadow-sm">
            {STAGES.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-secondary/60">
                <span
                  className={
                    "flex size-10 shrink-0 items-center justify-center rounded-full " +
                    (i === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
