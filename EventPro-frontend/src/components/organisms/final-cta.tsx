import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="rounded-2xl bg-primary px-8 py-14 text-primary-foreground sm:px-12">
        <h2 className="max-w-2xl text-balance text-4xl font-extrabold uppercase leading-tight">
          Start planning your next event today.
        </h2>
        <p className="mt-4 max-w-xl opacity-90">Set up takes a couple of minutes. You can invite your first supplier right after.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="secondary" size="lg" className="uppercase tracking-wider">
            <Link to="/register">Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="uppercase tracking-wider text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
