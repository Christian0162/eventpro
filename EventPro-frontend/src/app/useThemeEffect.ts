import { useEffect } from "react"
import { resolveTheme, useUIStore } from "@/stores/useUIStore"

/** Applies the stored theme preference to <html> and follows OS changes in "system" mode. */
export function useThemeEffect() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark")
    apply()
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])
}
