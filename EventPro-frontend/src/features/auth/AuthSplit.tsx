import type { ReactNode } from "react"
import { CalendarCheck, CheckCircle2, FileSignature, Heart, MessagesSquare, Star, Wallet } from "lucide-react"
import { Logo } from "@/components/atoms/logo"

interface Props {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

const STEPS = [
  { icon: MessagesSquare, label: "Chat" },
  { icon: FileSignature, label: "Contract" },
  { icon: Wallet, label: "Pay" },
]

/** Split-screen auth shell: form on the left, brand showcase on the right (hidden on small screens). */
export function AuthSplit({ title, description, children, footer }: Props) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </main>

      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:items-center lg:justify-center"
      >
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/10" />
        <div className="absolute top-1/4 left-12 size-3 rounded-full bg-white/40" />
        <div className="absolute right-20 bottom-1/3 size-4 rounded-full bg-white/30" />

        <div className="relative flex h-80 w-full max-w-md items-center justify-center">
          <div className="absolute top-2 left-4 flex size-14 items-center justify-center rounded-full bg-white shadow-lg">
            <Heart className="size-6 fill-rose-500 text-rose-500" />
          </div>
          <div className="absolute top-10 right-2 flex size-24 flex-col items-center justify-center gap-1 rounded-full bg-white text-primary shadow-lg">
            <CalendarCheck className="size-7" />
            <span className="text-xs font-semibold">Booked</span>
          </div>
          <div className="absolute bottom-0 left-0 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-lg">
            <Star className="size-4 fill-amber-400 text-amber-400" /> 4.9
          </div>

          <div className="w-64 rounded-2xl bg-white p-5 text-foreground shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                CS
              </span>
              <div>
                <p className="text-sm font-semibold">Bright Catering Co.</p>
                <p className="text-xs text-muted-foreground">Caterer · Verified</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              {STEPS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
              <CheckCircle2 className="size-4 text-success" /> Contract approved by both sides
            </p>
          </div>
        </div>

        <div className="relative mt-10 max-w-sm px-6 text-center">
          <h2 className="font-display text-3xl font-bold">Plan events without the juggling.</h2>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Find verified suppliers, agree on a contract and pay in one place.
          </p>
        </div>
      </aside>
    </div>
  )
}
