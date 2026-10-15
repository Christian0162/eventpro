const STEPS = [
  { title: "Create your event", text: "Add the date, venue, type of event and what you still need." },
  { title: "Choose suppliers", text: "Browse shops, save favourites and message the ones you like." },
  { title: "Agree on a contract", text: "Send a booking request. The supplier approves it and you both sign off." },
  { title: "Pay and enjoy", text: "Pay through the app. Rate your supplier after the event." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-extrabold uppercase">How booking works</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="font-display text-6xl font-extrabold text-primary" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-sm font-bold uppercase">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
