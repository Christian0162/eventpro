import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

/** Soft white card with a title row, used for every block on the dashboards. */
export function Panel({
    title,
    count,
    action,
    className,
    children,
}: {
    title: string
    count?: number
    action?: ReactNode
    className?: string
    children: ReactNode
}) {
    return (
        <section className={cn("flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
            <header className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {title}
                    {count !== undefined && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
                    )}
                </h2>
                {action}
            </header>
            {children}
        </section>
    )
}

export function PanelEmpty({ children }: { children: ReactNode }) {
    return <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">{children}</p>
}

export function StatTile({ title, value, icon: Icon, tone }: { title: string; value: ReactNode; icon: LucideIcon; tone: keyof typeof TONES }) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONES[tone].icon)}>
                <Icon className="size-5" />
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">{title}</p>
                <p className="truncate font-display text-2xl font-semibold">{value}</p>
            </div>
        </div>
    )
}

/** Pastel gradient + matching progress colour, cycled across cards like the reference design. */
export const TONES = {
    blue: { card: "from-blue-50 to-blue-100", bar: "bg-blue-500", icon: "bg-blue-100 text-blue-600", fill: "var(--chart-1)" },
    cyan: { card: "from-cyan-50 to-cyan-100", bar: "bg-cyan-500", icon: "bg-cyan-100 text-cyan-600", fill: "oklch(0.72 0.12 210)" },
    pink: { card: "from-pink-50 to-pink-100", bar: "bg-pink-400", icon: "bg-pink-100 text-pink-600", fill: "oklch(0.75 0.14 350)" },
    amber: { card: "from-amber-50 to-amber-100", bar: "bg-amber-400", icon: "bg-amber-100 text-amber-600", fill: "var(--chart-3)" },
    green: { card: "from-emerald-50 to-emerald-100", bar: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-600", fill: "var(--chart-2)" },
    violet: { card: "from-violet-50 to-violet-100", bar: "bg-violet-500", icon: "bg-violet-100 text-violet-600", fill: "var(--chart-4)" },
} as const

export type Tone = keyof typeof TONES
export const TONE_CYCLE: Tone[] = ["blue", "cyan", "pink", "violet", "amber", "green"]

export function ProgressCard({
    title,
    daysLeft,
    progress,
    progressLabel = "Progress",
    tone,
    onClick,
}: {
    title: string
    daysLeft: string
    progress?: number
    progressLabel?: string
    tone: Tone
    onClick?: () => void
}) {
    const pct = progress === undefined ? null : Math.max(0, Math.min(100, Math.round(progress)))
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-col gap-5 rounded-xl bg-gradient-to-br p-4 text-left transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                TONES[tone].card
            )}
        >
            <span className="self-end rounded-lg bg-white/80 px-2.5 py-1 text-xs font-medium">{daysLeft}</span>
            <span className="line-clamp-2 font-display text-base font-semibold">{title}</span>
            {pct !== null && (
                <span className="block">
                    <span className="mb-1.5 flex justify-between text-sm text-muted-foreground">
                        <span>{progressLabel}</span>
                        <span>{pct}%</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-white/70">
                        <span className={cn("block h-full rounded-full", TONES[tone].bar)} style={{ width: `${pct}%` }} />
                    </span>
                </span>
            )}
        </button>
    )
}

export function DonutStat({
    data,
    centerValue,
    centerLabel,
}: {
    data: { name: string; value: number; tone: Tone }[]
    centerValue: ReactNode
    centerLabel: string
}) {
    const rows = data.filter(d => d.value > 0)
    const config = Object.fromEntries(data.map(d => [d.name, { label: d.name, color: TONES[d.tone].fill }])) satisfies ChartConfig

    return (
        <div className="flex flex-1 flex-wrap items-center justify-center gap-5">
            <div className="relative size-36 shrink-0">
                <ChartContainer config={config} className="size-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie
                            data={rows.length ? rows : [{ name: "None", value: 1, tone: "blue" as Tone }]}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="68%"
                            strokeWidth={0}
                            paddingAngle={rows.length > 1 ? 2 : 0}
                        >
                            {(rows.length ? rows : [{ name: "None", tone: "blue" as Tone }]).map(r => (
                                <Cell key={r.name} fill={rows.length ? TONES[r.tone].fill : "var(--muted)"} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-semibold">{centerValue}</span>
                    <span className="text-xs text-muted-foreground">{centerLabel}</span>
                </div>
            </div>
            <ul className="space-y-1.5 text-sm">
                {data.map(d => (
                    <li key={d.name} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: TONES[d.tone].fill }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-medium">{d.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function daysUntil(date: unknown): number | null {
    if (!date) return null
    const d = new Date(date as string)
    if (Number.isNaN(d.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function daysLeftLabel(days: number | null) {
    if (days === null) return "Date TBA"
    if (days === 0) return "Today"
    if (days < 0) return `${Math.abs(days)} days ago`
    return `${days} ${days === 1 ? "day" : "days"} left`
}

export type AlertItem = { id: string; text: string; detail?: string; level: "warning" | "info" | "success" }

const ALERT_DOT = { warning: "bg-amber-500", info: "bg-blue-500", success: "bg-emerald-500" } as const

export function AlertList({ items, empty = "You're all caught up." }: { items: AlertItem[]; empty?: string }) {
    if (!items.length) return <PanelEmpty>{empty}</PanelEmpty>
    return (
        <ul className="space-y-3">
            {items.slice(0, 5).map(a => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", ALERT_DOT[a.level])} />
                    <span>
                        {a.text}
                        {a.detail && <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">{a.detail}</span>}
                    </span>
                </li>
            ))}
        </ul>
    )
}
