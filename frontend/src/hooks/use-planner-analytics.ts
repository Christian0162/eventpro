import { useMemo } from "react"
import type { Doc } from "@/types/firestore"
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
  const { events, isLoading: l1 } = useFetchEventsById(plannerId) as unknown as { events: Doc[]; isLoading: boolean }
  const { contracts, isLoading: l2 } = useFetchContract() as unknown as { contracts: Doc[]; isLoading: boolean }
  const { suppliers, isLoading: l3 } = useFetchSuppliers() as unknown as { suppliers: Doc[]; isLoading: boolean }

  const isLoading = Boolean(l1 || l2 || l3)

  const data = useMemo(() => {
    const eventYear = (e: Doc) => {
      const d = new Date(e.event_date?.date_value)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const yearEvents = (events ?? []).filter((e: Doc) => eventYear(e)?.getFullYear() === year)
    const eventIds = new Set(yearEvents.map((e: Doc) => e.id))
    const myContracts = (contracts ?? []).filter((c: Doc) => c.planner_id === plannerId && eventIds.has(c.event_id))
    const approved = myContracts.filter((c: Doc) => c.status === "Approved" || c.status === "Completed")
    const price = (c: Doc) => Number(c.service_plan?.service_price) || 0

    const eventsByMonth = MONTHS.map((month) => ({ month, events: 0 }))
    yearEvents.forEach((e: Doc) => {
      eventsByMonth[eventYear(e)!.getMonth()].events += 1
    })

    const budgetByType = Object.entries(
      (yearEvents as Doc[]).reduce<Record<string, number>>((acc, e: Doc) => {
        const t = e.event_type?.label || "Unknown"
        acc[t] = (acc[t] ?? 0) + (Number(e.event_budget) || 0)
        return acc
      }, {}),
    ).map(([name, value]) => ({ name, value }))

    const budgetVsSpend = yearEvents.map((e: Doc) => ({
      event: e.event_name as string,
      budget: Number(e.event_budget) || 0,
      committed: approved.filter((c: Doc) => c.event_id === e.id).reduce((s: number, c: Doc) => s + price(c), 0),
    }))

    const spendByCategory = Object.entries(
      (approved as Doc[]).reduce<Record<string, number>>((acc, c: Doc) => {
        const sup = (suppliers ?? []).find((s: Doc) => s.id === c.supplier_id)
        const cat = sup?.supplier_type?.label || "Other"
        acc[cat] = (acc[cat] ?? 0) + price(c)
        return acc
      }, {}),
    ).map(([name, value]) => ({ name, value }))

    const totalBudget = budgetVsSpend.reduce((s: number, e: { budget: number; committed: number }) => s + e.budget, 0)
    const committed = budgetVsSpend.reduce((s: number, e: { budget: number; committed: number }) => s + e.committed, 0)

    return {
      eventsByMonth,
      budgetByType,
      budgetVsSpend,
      spendByCategory,
      contractsByStatus: countBy(myContracts, (c: Doc) => c.status),
      totalEvents: yearEvents.length,
      totalBudget,
      committed,
      approvedContracts: approved.length,
    }
  }, [events, contracts, suppliers, plannerId, year])

  return { ...data, isLoading }
}
