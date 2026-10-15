import { Link } from "react-router-dom"
import { BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const RIBBON = ["Planners & suppliers", "One place to book", "Contracts that both sides sign", "Pay with GCash, Maya or card"]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold uppercase leading-[0.98] sm:text-5xl lg:text-7xl">
            Find the perfect suppliers for every event
          </h1>
          <div className="max-w-xs">
            <p className="text-xs font-medium uppercase leading-relaxed tracking-wide text-muted-foreground">
              Discover verified caterers, venues and stylists. Tailored to your event.
            </p>
            <Button asChild className="mt-4 uppercase tracking-wider">
              <Link to="/register">Find a supplier</Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-10 select-none">
          <div
            aria-hidden="true"
            className="bg-clip-text text-center font-display text-[26vw] font-extrabold uppercase leading-[0.8] text-transparent lg:text-[20rem]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, oklch(0.62 0.22 262), oklch(0.32 0.12 265))",
            }}
          >
            Booked
          </div>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 hidden size-28 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full bg-card text-primary shadow-xl ring-1 ring-border sm:flex"
          >
            <span className="absolute inset-0 animate-[landing-spin_14s_linear_infinite] rounded-full border-2 border-dashed border-primary" />
            <BadgeCheck className="size-10" />
          </span>
        </div>
      </div>

      <div className="-rotate-1 border-y bg-foreground py-3 text-background" aria-hidden="true">
        <div className="flex w-max animate-[landing-marquee_30s_linear_infinite] gap-10 whitespace-nowrap font-display text-lg font-bold uppercase">
          {[...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON].map((t, i) => (
            <span key={i}>{t} <span className="mx-4 text-primary">♪</span></span>
          ))}
        </div>
      </div>
    </section>
  )
}
