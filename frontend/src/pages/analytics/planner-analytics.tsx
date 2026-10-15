import { useState } from "react"
import { Title } from "react-head"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { CalendarDays, ChevronLeft, ChevronRight, FileCheck2, PhilippinePeso, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlannerAnalytics } from "@/hooks/use-planner-analytics"
import type { UserData } from "@/types/session"

const peso = (n: number) => `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

const eventsConfig = { events: { label: "Events", color: "var(--chart-1)" } } satisfies ChartConfig
const budgetConfig = {
  budget: { label: "Budget", color: "var(--chart-1)" },
  committed: { label: "Committed to suppliers", color: "var(--chart-2)" },
} satisfies ChartConfig

function EmptyState() {
  return <p className="py-16 text-center text-sm text-muted-foreground">No data for this period yet.</p>
}

function Donut({
  title,
  description,
  rows,
  money,
}: {
  title: string
  description: string
  rows: { name: string; value: number }[]
  money?: boolean
}) {
  const data = rows.map((r, i) => ({ ...r, fill: PALETTE[i % PALETTE.length] }))
  const config = Object.fromEntries(data.map((d) => [d.name, { label: d.name, color: d.fill }])) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer config={config} className="mx-auto h-64 w-full">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" hideLabel formatter={money ? (v) => peso(Number(v)) : undefined} />}
              />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="50%" strokeWidth={2}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Wallet }) {
  return (
    <Card className="gap-2 py-5">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export default function PlannerAnalytics({ userData }: { userData: UserData | null }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const a = usePlannerAnalytics(userData?.id ?? "", year)
  const utilization = a.totalBudget ? (a.committed / a.totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      <Title>Analytics | EventPro</Title>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your events and budgets for {year}.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft />
          </Button>
          <span className="w-16 text-center text-sm font-medium tabular-nums">{year}</span>
          <Button variant="outline" size="icon" aria-label="Next year" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {a.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Events" value={String(a.totalEvents)} hint={`Scheduled in ${year}`} icon={CalendarDays} />
          <Stat label="Total budget" value={peso(a.totalBudget)} hint="Across all events" icon={Wallet} />
          <Stat
            label="Committed"
            value={peso(a.committed)}
            hint={`${utilization.toFixed(0)}% of budget`}
            icon={PhilippinePeso}
          />
          <Stat label="Approved contracts" value={String(a.approvedContracts)} hint="Approved or completed" icon={FileCheck2} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget vs committed spend</CardTitle>
          <CardDescription>Planned budget for each event against approved supplier contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {a.budgetVsSpend.length === 0 ? (
            <EmptyState />
          ) : (
            <ChartContainer config={budgetConfig} className="h-72 w-full">
              <BarChart data={a.budgetVsSpend} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="event" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => peso(v)} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => peso(Number(v))} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="budget" fill="var(--color-budget)" radius={6} />
                <Bar dataKey="committed" fill="var(--color-committed)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events per month</CardTitle>
            <CardDescription>Based on event date</CardDescription>
          </CardHeader>
          <CardContent>
            {a.totalEvents === 0 ? (
              <EmptyState />
            ) : (
              <ChartContainer config={eventsConfig} className="h-64 w-full">
                <BarChart data={a.eventsByMonth} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="events" fill="var(--color-events)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Donut title="Budget by event type" description="Where your budget is allocated" rows={a.budgetByType} money />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Donut title="Spend by supplier category" description="Approved contract value" rows={a.spendByCategory} money />
        <Donut title="Contracts" description="Contracts for your events by status" rows={a.contractsByStatus} />
      </div>
    </div>
  )
}
