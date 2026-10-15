import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  )
}
