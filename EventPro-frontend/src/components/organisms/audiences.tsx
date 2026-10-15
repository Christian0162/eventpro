import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const AUDIENCES = [
  {
    title: "For event planners",
    points: ["Keep every supplier, chat and contract in one place", "Compare shops before you commit", "Get recommendations powered by AI"],
    cta: "Plan an event",
  },
  {
    title: "For suppliers",
    points: ["Show your services in your own shop page", "Receive booking requests from planners", "Get paid through the platform"],
    cta: "Open your shop",
  },
]

export function Audiences() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-20 sm:px-6 md:grid-cols-2">
      {AUDIENCES.map((a) => (
        <div key={a.title} className="rounded-2xl border bg-secondary p-8">
          <h2 className="text-xl font-extrabold uppercase">{a.title}</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {a.points.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 uppercase tracking-wider">
            <Link to="/register">{a.cta}</Link>
          </Button>
        </div>
      ))}
    </section>
  )
}
