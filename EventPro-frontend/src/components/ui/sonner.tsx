import { Toaster as Sonner, type ToasterProps } from "sonner"
import { resolveTheme, useUIStore } from "@/stores/useUIStore"

const Toaster = (props: ToasterProps) => {
  const theme = useUIStore((s) => s.theme)

  return (
    <Sonner
      theme={resolveTheme(theme)}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
