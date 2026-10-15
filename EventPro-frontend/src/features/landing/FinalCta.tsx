import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12">
        <h2 className="max-w-xl text-3xl font-bold">Start planning your next event today.</h2>
        <p className="mt-3 max-w-xl opacity-90">Set up takes a couple of minutes. You can invite your first supplier right after.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary" size="lg">
            <Link to="/register">Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
