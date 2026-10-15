import { lazy, Suspense, useEffect, useState } from "react"

const Lottie = lazy(() => import("lottie-react"))

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

/**
 * Decorative celebration loop. Lazy-loaded, skipped for reduced-motion users,
 * and renders nothing (rather than a broken box) if the animation fails to load.
 */
export function ConfettiAnimation({ className }: { className?: string }) {
  const [data, setData] = useState<object | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let cancelled = false
    import("@/assets/lottie/confetti.json")
      .then((m) => !cancelled && setData(m.default))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) return null

  return (
    <div aria-hidden="true" className={className}>
      <Suspense fallback={null}>
        <Lottie animationData={data} loop autoplay />
      </Suspense>
    </div>
  )
}
