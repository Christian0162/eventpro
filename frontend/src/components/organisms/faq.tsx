import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const FAQS = [
  { q: "Is EventPro free to join?", a: "Creating an account is free for both planners and suppliers." },
  { q: "How do payments work?", a: "You pay through the app using GCash, Maya or a credit card once a contract is approved." },
  { q: "Are suppliers verified?", a: "Suppliers submit identification and business documents that are reviewed by the EventPro team." },
  { q: "What if a booking has to be cancelled?", a: "Cancellations and refunds are handled in the app, following the contract both sides agreed to." },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="flex items-center gap-6">
        <h2 className="text-2xl font-extrabold uppercase">Questions people ask</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Accordion type="single" collapsible className="mt-6">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
