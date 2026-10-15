import { useState } from "react"
import { Title } from "react-head"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { CalendarCheck, ChevronLeft, ChevronRight, PhilippinePeso, Star, Truck } from "lucide-react"
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
import { useSupplierAnalytics } from "@/hooks/use-supplier-analytics"
import type { UserData } from "@/types/session"

const peso = (n: number) => `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`

const earningsConfig = { earnings: { label: "Earnings", color: "var(--chart-1)" } } satisfies ChartConfig
const ratingConfig = { rating: { label: "Average rating", color: "var(--chart-3)" } } satisfies ChartConfig
const priceConfig = {
  mine: { label: "Your price", color: "var(--chart-1)" },
  market: { label: "Market average", color: "var(--chart-2)" },
} satisfies ChartConfig

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function StatusPie({ title, description, rows }: { title: string; description: string; rows: { name: string; value: number }[] }) {
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
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
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

function EmptyState() {
  return <p className="py-16 text-center text-sm text-muted-foreground">No data for this period yet.</p>
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Star }) {
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

export default function SupplierAnalytics({ userData }: { userData: UserData | null }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const a = useSupplierAnalytics(userData?.id ?? "", year)

  const hasEarnings = a.earningsByMonth.some((m) => m.earnings > 0)
  const hasRatings = a.ratingsByMonth.some((m) => m.rating > 0)

  return (
    <div className="space-y-6">
      <Title>Analytics | EventPro</Title>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">How your business performed in {year}.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft />
          </Button>
          <span className="w-16 text-center text-sm font-medium tabular-nums">{year}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next year"
            disabled={year >= new Date().getFullYear()}
            onClick={() => setYear((y) => y + 1)}
          >
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
          <Stat label="Total earnings" value={peso(a.totalEarnings)} hint={`Credited in ${year}`} icon={PhilippinePeso} />
          <Stat
            label="On-time delivery"
            value={`${a.onTimeRate.toFixed(0)}%`}
            hint={`${a.totalDeliveries} deliveries planned`}
            icon={Truck}
          />
          <Stat
            label="Average rating"
            value={a.reviewCount ? a.averageRating.toFixed(1) : "–"}
            hint={`${a.reviewCount} review${a.reviewCount === 1 ? "" : "s"}`}
            icon={Star}
          />
          <Stat label="Active contracts" value={String(a.activeContracts)} hint="Approved and in progress" icon={CalendarCheck} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
            <CardDescription>Monthly credits to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasEarnings ? (
              <EmptyState />
            ) : (
              <ChartContainer config={earningsConfig} className="h-64 w-full">
                <BarChart data={a.earningsByMonth} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => peso(v)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => peso(Number(v))} />} />
                  <Bar dataKey="earnings" fill="var(--color-earnings)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating trend</CardTitle>
            <CardDescription>Average review score per month</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasRatings ? (
              <EmptyState />
            ) : (
              <ChartContainer config={ratingConfig} className="h-64 w-full">
                <LineChart data={a.ratingsByMonth} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="rating" type="monotone" stroke="var(--color-rating)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price competitiveness</CardTitle>
          <CardDescription>Your plan prices against the average of suppliers in your category</CardDescription>
        </CardHeader>
        <CardContent>
          {a.priceComparison.length === 0 ? (
            <EmptyState />
          ) : (
            <ChartContainer config={priceConfig} className="h-72 w-full">
              <BarChart data={a.priceComparison} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="plan" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => peso(v)} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => peso(Number(v))} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="mine" fill="var(--color-mine)" radius={6} />
                <Bar dataKey="market" fill="var(--color-market)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusPie title="Contracts" description="All contracts by status" rows={a.contractsByStatus} />
        <StatusPie title="Applications" description="Event applications by status" rows={a.applicationsByStatus} />
      </div>
    </div>
  )
}
