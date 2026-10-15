import { useMemo } from "react"
import { useFetchContract } from "./use-contract"
import { useFetchEventsById } from "./use-events"
import { useFetchSuppliers } from "./use-supplier"
import { MONTHS } from "./use-supplier-analytics"

const countBy = <T,>(items: T[], key: (item: T) => string) =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      const k = key(item) || "Unknown"
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

/** Aggregates everything the planner analytics page shows, for one planner and one calendar year of event dates. */
export function usePlannerAnalytics(plannerId: string, year: number) {
  const { events, isLoading: l1 } = useFetchEventsById(plannerId) as any
  const { contracts, isLoading: l2 } = useFetchContract() as any
  const { suppliers, isLoading: l3 } = useFetchSuppliers() as any

  const isLoading = Boolean(l1 || l2 || l3)

  const data = useMemo(() => {
    const eventYear = (e: any) => {
      const d = new Date(e.event_date?.date_value)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const yearEvents = (events ?? []).filter((e: any) => eventYear(e)?.getFullYear() === year)
    const eventIds = new Set(yearEvents.map((e: any) => e.id))
    const myContracts = (contracts ?? []).filter((c: any) => c.planner_id === plannerId && eventIds.has(c.event_id))
    const approved = myContracts.filter((c: any) => c.status === "Approved" || c.status === "Completed")
    const price = (c: any) => Number(c.service_plan?.service_price) || 0

    const eventsByMonth = MONTHS.map((month) => ({ month, events: 0 }))
    yearEvents.forEach((e: any) => {
      eventsByMonth[eventYear(e)!.getMonth()].events += 1
    })

    const budgetByType = Object.entries(
      (yearEvents as any[]).reduce<Record<string, number>>((acc, e: any) => {
        const t = e.event_type?.label || "Unknown"
        acc[t] = (acc[t] ?? 0) + (Number(e.event_budget) || 0)
        return acc
      }, {}),
    ).map(([name, value]) => ({ name, value }))

    const budgetVsSpend = yearEvents.map((e: any) => ({
      event: e.event_name as string,
      budget: Number(e.event_budget) || 0,
      committed: approved.filter((c: any) => c.event_id === e.id).reduce((s: number, c: any) => s + price(c), 0),
    }))

    const spendByCategory = Object.entries(
      (approved as any[]).reduce<Record<string, number>>((acc, c: any) => {
        const sup = (suppliers ?? []).find((s: any) => s.id === c.supplier_id)
        const cat = sup?.supplier_type?.label || "Other"
        acc[cat] = (acc[cat] ?? 0) + price(c)
        return acc
      }, {}),
    ).map(([name, value]) => ({ name, value }))

    const totalBudget = budgetVsSpend.reduce((s: number, e: any) => s + e.budget, 0)
    const committed = budgetVsSpend.reduce((s: number, e: any) => s + e.committed, 0)

    return {
      eventsByMonth,
      budgetByType,
      budgetVsSpend,
      spendByCategory,
      contractsByStatus: countBy(myContracts, (c: any) => c.status),
      totalEvents: yearEvents.length,
      totalBudget,
      committed,
      approvedContracts: approved.length,
    }
  }, [events, contracts, suppliers, plannerId, year])

  return { ...data, isLoading }
}
