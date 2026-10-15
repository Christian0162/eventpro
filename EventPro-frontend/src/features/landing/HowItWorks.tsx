const STEPS = [
  { title: "Create your event", text: "Add the date, venue, type of event and what you still need." },
  { title: "Choose suppliers", text: "Browse shops, save favourites and message the ones you like." },
  { title: "Agree on a contract", text: "Send a booking request. The supplier approves it and you both sign off." },
  { title: "Pay and enjoy", text: "Pay through the app. Rate your supplier after the event." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold">How booking works</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="font-display text-4xl font-bold text-primary/40" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
