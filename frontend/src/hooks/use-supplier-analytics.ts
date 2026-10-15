import { useMemo } from "react"
import type { Doc } from "@/types/firestore"
import { useFetchContract } from "./use-contract"
import { useFetchDeliveries } from "./use-deliveries"
import { useFetchReviews } from "./use-reviews"
import { useFetchAllApplication } from "./use-application"
import { useFetchTransactionById } from "./use-transaction"
import { useFetchSuppliers, useFetchSupplierServices } from "./use-supplier"

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const toDate = (value: unknown): Date | null => {
  if (!value) return null
  const v = value as { toDate?: () => Date }
  const d = v.toDate ? v.toDate() : new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

const countBy = <T,>(items: T[], key: (item: T) => string) =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      const k = key(item) || "Unknown"
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

/** Aggregates everything the supplier analytics page shows, for one supplier and one calendar year. */
export function useSupplierAnalytics(supplierId: string, year: number) {
  const { contracts, isLoading: l1 } = useFetchContract() as unknown as { contracts: Doc[]; isLoading: boolean }
  const { deliveries, isLoading: l2 } = useFetchDeliveries() as unknown as { deliveries: Doc[]; isLoading: boolean }
  const { reviews, isLoading: l3 } = useFetchReviews() as unknown as { reviews: Doc[]; isLoading: boolean }
  const { applications, isLoading: l4 } = useFetchAllApplication() as unknown as { applications: Doc[]; isLoading: boolean }
  const { transactions, isLoading: l5 } = useFetchTransactionById(supplierId) as unknown as { transactions: Doc[]; isLoading: boolean }
  const { suppliers } = useFetchSuppliers() as unknown as { suppliers: Doc[] }
  const { services } = useFetchSupplierServices() as unknown as { services: Doc[] }

  const isLoading = Boolean(l1 || l2 || l3 || l4 || l5)

  const data = useMemo(() => {
    const inYear = (d: Date | null) => d !== null && d.getFullYear() === year

    const myContracts = (contracts ?? []).filter((c: Doc) => c.supplier_id === supplierId)
    const myApplications = (applications ?? []).filter((a: Doc) => a.supplier_id === supplierId)
    const myReviews = (reviews ?? []).filter((r: Doc) => r.reviewed_id === supplierId)
    const myDeliveries = (deliveries ?? []).filter((d: Doc) => d.supplier_id === supplierId)
    const credits = (transactions ?? []).filter((t: Doc) => t.type === "CREDIT")

    const earningsByMonth = MONTHS.map((month) => ({ month, earnings: 0 }))
    credits.forEach((t: Doc) => {
      const d = toDate(t.created_at)
      if (inYear(d)) earningsByMonth[d!.getMonth()].earnings += Number(t.amount) || 0
    })

    const ratingSums = MONTHS.map(() => ({ sum: 0, count: 0 }))
    myReviews.forEach((r: Doc) => {
      const d = toDate(r.created_at)
      if (inYear(d)) {
        ratingSums[d!.getMonth()].sum += Number(r.rating) || 0
        ratingSums[d!.getMonth()].count += 1
      }
    })
    const ratingsByMonth = MONTHS.map((month, i) => ({
      month,
      rating: ratingSums[i].count ? Number((ratingSums[i].sum / ratingSums[i].count).toFixed(2)) : 0,
    }))

    const yearDeliveries = myDeliveries.filter((d: Doc) => inYear(toDate(d.planned_date)))
    const onTime = yearDeliveries.filter((d: Doc) => {
      const delivered = toDate(d.delivered_date)
      const planned = toDate(d.planned_date)
      return delivered && planned && delivered <= planned
    }).length

    const allRatings = myReviews.filter((r: Doc) => inYear(toDate(r.created_at)))
    const totalEarnings = earningsByMonth.reduce((sum, m) => sum + m.earnings, 0)

    const myServices = (services ?? []).filter((s: Doc) => s.supplier_id === supplierId)
    const myType = (suppliers ?? []).find((s: Doc) => s.id === supplierId)?.supplier_type?.value
    const rivalIds = new Set(
      (suppliers ?? []).filter((s: Doc) => s.id !== supplierId && s.supplier_type?.value === myType).map((s: Doc) => s.id),
    )
    const priceComparison = myServices.map((svc: Doc) => {
      const rivals = (services ?? [])
        .filter((s: Doc) => rivalIds.has(s.supplier_id) && s.service_plan?.value === svc.service_plan?.value)
        .map((s: Doc) => Number(s.service_price) || 0)
      const avg = rivals.length ? rivals.reduce((a: number, b: number) => a + b, 0) / rivals.length : 0
      return { plan: svc.service_plan?.label ?? "Plan", mine: Number(svc.service_price) || 0, market: Number(avg.toFixed(2)) }
    })

    return {
      earningsByMonth,
      ratingsByMonth,
      priceComparison,
      contractsByStatus: countBy(myContracts, (c: Doc) => c.status),
      applicationsByStatus: countBy(myApplications, (a: Doc) => a.status),
      totalEarnings,
      onTimeRate: yearDeliveries.length ? (onTime / yearDeliveries.length) * 100 : 0,
      totalDeliveries: yearDeliveries.length,
      averageRating: allRatings.length
        ? allRatings.reduce((s: number, r: Doc) => s + (Number(r.rating) || 0), 0) / allRatings.length
        : 0,
      reviewCount: allRatings.length,
      activeContracts: myContracts.filter((c: Doc) => c.status === "Approved").length,
    }
  }, [contracts, deliveries, reviews, applications, transactions, suppliers, services, supplierId, year])

  return { ...data, isLoading }
}
