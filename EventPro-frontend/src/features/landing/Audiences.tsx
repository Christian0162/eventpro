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
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
      {AUDIENCES.map((a) => (
        <div key={a.title} className="rounded-xl border bg-card p-8">
          <h2 className="text-2xl font-bold">{a.title}</h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            {a.points.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6">
            <Link to="/register">{a.cta}</Link>
          </Button>
        </div>
      ))}
    </section>
  )
}
