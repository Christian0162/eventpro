import { FileSignature, ShieldCheck, Sparkles } from "lucide-react"

const ITEMS = [
  { icon: ShieldCheck, title: "Verified suppliers", text: "Every supplier submits identification and business documents that our team reviews." },
  { icon: Sparkles, title: "Personalized picks", text: "AI recommendations match suppliers to your event type, budget and date." },
  { icon: FileSignature, title: "Contract and pay in app", text: "Both sides approve the terms, then you pay with GCash, Maya or card." },
]

export function Quality() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex items-center gap-6">
        <h2 className="text-2xl font-extrabold uppercase">Our quality</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl border bg-secondary p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-background">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-sm font-bold uppercase">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
