import { Calendar, Package, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RegisterValues } from "@/lib/validations/auth"

const OPTIONS: { name: RegisterValues["role"]; description: string; icon: LucideIcon }[] = [
  { name: "Event Planner", description: "Create events, find suppliers and coordinate the details.", icon: Calendar },
  { name: "Supplier", description: "Offer your services and receive booking requests from planners.", icon: Package },
]

interface Props {
  value?: RegisterValues["role"]
  error?: string
  onChange: (role: RegisterValues["role"]) => void
}

export function RoleStep({ value, error, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Account type" className="space-y-3">
      {OPTIONS.map(({ name, description, icon: Icon }) => {
        const selected = value === name
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(name)}
            className={cn(
              "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-secondary" : "hover:border-primary/60",
              error && !selected && "border-destructive/50",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">{name}</span>
              <span className="block text-sm text-muted-foreground">{description}</span>
            </span>
          </button>
        )
      })}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
