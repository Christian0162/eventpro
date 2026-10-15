import { Area, AreaChart, Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Pie, PieChart as RechartsPieChart, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

interface LineChartProps {
    className?: string
    dataPoints?: number[]
    labels?: string[]
    label?: string
    lineColor?: string
}

export const LineChart = ({
    className,
    dataPoints = [],
    labels = [],
    label = "Data",
    lineColor = "var(--chart-1)",
}: LineChartProps) => {
    const rows = labels.map((name, i) => ({ name, value: dataPoints[i] ?? 0 }))
    const config = { value: { label, color: lineColor } } satisfies ChartConfig

    return (
        <ChartContainer config={config} className={cn("h-64 w-full", className)}>
            <AreaChart data={rows} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
        </ChartContainer>
    )
}

interface PieChartProps {
    className?: string
    labels?: string[]
    dataValues?: unknown[]
    backgroundColors?: string[]
    /** Legacy chart.js props, accepted so existing call sites keep working. */
    borderColors?: string[]
    title?: string
}

export const PieChart = ({ className, labels = [], dataValues = [], backgroundColors = [] }: PieChartProps) => {
    const rows = labels.map((name, i) => ({
        name,
        value: Number(dataValues[i]) || 0,
        fill: backgroundColors[i] ?? PALETTE[i % PALETTE.length],
    }))
    const config = Object.fromEntries(rows.map((r) => [r.name, { label: r.name, color: r.fill }])) satisfies ChartConfig

    return (
        <ChartContainer config={config} className={cn("mx-auto aspect-square w-full", className)}>
            <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie data={rows} dataKey="value" nameKey="name" innerRadius="45%" strokeWidth={2}>
                    {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
                </Pie>
            </RechartsPieChart>
        </ChartContainer>
    )
}

interface BarDataset {
    label?: string
    data: unknown[]
    backgroundColor?: string | string[]
    [legacy: string]: unknown
}

interface BarChartProps {
    className?: string
    labels?: string[]
    datasets?: Record<string, any>[]
    xLabel?: string
    yLabel?: string
    title?: string
}

export const BarChart = ({ className, labels = [], datasets = [], yLabel = "" }: BarChartProps) => {
    const rows = labels.map((name, i) => ({
        name,
        ...Object.fromEntries((datasets as BarDataset[]).map((d, k) => [`s${k}`, Number(d.data[i]) || 0])),
    }))
    const config = Object.fromEntries(
        (datasets as BarDataset[]).map((d, k) => {
            const color = Array.isArray(d.backgroundColor) ? PALETTE[k % PALETTE.length] : d.backgroundColor
            return [`s${k}`, { label: d.label ?? `Series ${k + 1}`, color: color ?? PALETTE[k % PALETTE.length] }]
        })
    ) satisfies ChartConfig

    return (
        <ChartContainer config={config} className={cn("h-72 w-full", className)}>
            <RechartsBarChart data={rows} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={40} unit={yLabel === "%" ? "%" : undefined} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {datasets.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                {(datasets as BarDataset[]).map((d, k) => (
                    <Bar key={k} dataKey={`s${k}`} fill={`var(--color-s${k})`} radius={6}>
                        {Array.isArray(d.backgroundColor) &&
                            rows.map((r, i) => <Cell key={r.name} fill={d.backgroundColor![i] ?? PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                ))}
            </RechartsBarChart>
        </ChartContainer>
    )
}
