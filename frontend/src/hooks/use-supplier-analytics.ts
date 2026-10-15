import { useMemo } from "react"
import { useFetchContract } from "./use-contract"
import { useFetchDeliveries } from "./use-deliveries"
import { useFetchReviews } from "./use-reviews"
import { useFetchAllApplication } from "./use-application"
import { useFetchTransactionById } from "./use-transaction"
import { useFetchSuppliers, useFetchSupplierServices } from "./use-supplier"

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const toDate = (value: any): Date | null => {
  if (!value) return null
  const d = value.toDate ? value.toDate() : new Date(value)
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
  const { contracts, isLoading: l1 } = useFetchContract() as any
  const { deliveries, isLoading: l2 } = useFetchDeliveries() as any
  const { reviews, isLoading: l3 } = useFetchReviews() as any
  const { applications, isLoading: l4 } = useFetchAllApplication() as any
  const { transactions, isLoading: l5 } = useFetchTransactionById(supplierId) as any
  const { suppliers } = useFetchSuppliers() as any
  const { services } = useFetchSupplierServices() as any

  const isLoading = Boolean(l1 || l2 || l3 || l4 || l5)

  const data = useMemo(() => {
    const inYear = (d: Date | null) => d !== null && d.getFullYear() === year

    const myContracts = (contracts ?? []).filter((c: any) => c.supplier_id === supplierId)
    const myApplications = (applications ?? []).filter((a: any) => a.supplier_id === supplierId)
    const myReviews = (reviews ?? []).filter((r: any) => r.reviewed_id === supplierId)
    const myDeliveries = (deliveries ?? []).filter((d: any) => d.supplier_id === supplierId)
    const credits = (transactions ?? []).filter((t: any) => t.type === "CREDIT")

    const earningsByMonth = MONTHS.map((month) => ({ month, earnings: 0 }))
    credits.forEach((t: any) => {
      const d = toDate(t.created_at)
      if (inYear(d)) earningsByMonth[d!.getMonth()].earnings += Number(t.amount) || 0
    })

    const ratingSums = MONTHS.map(() => ({ sum: 0, count: 0 }))
    myReviews.forEach((r: any) => {
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

    const yearDeliveries = myDeliveries.filter((d: any) => inYear(toDate(d.planned_date)))
    const onTime = yearDeliveries.filter((d: any) => {
      const delivered = toDate(d.delivered_date)
      const planned = toDate(d.planned_date)
      return delivered && planned && delivered <= planned
    }).length

    const allRatings = myReviews.filter((r: any) => inYear(toDate(r.created_at)))
    const totalEarnings = earningsByMonth.reduce((sum, m) => sum + m.earnings, 0)

    const myServices = (services ?? []).filter((s: any) => s.supplier_id === supplierId)
    const myType = (suppliers ?? []).find((s: any) => s.id === supplierId)?.supplier_type?.value
    const rivalIds = new Set(
      (suppliers ?? []).filter((s: any) => s.id !== supplierId && s.supplier_type?.value === myType).map((s: any) => s.id),
    )
    const priceComparison = myServices.map((svc: any) => {
      const rivals = (services ?? [])
        .filter((s: any) => rivalIds.has(s.supplier_id) && s.service_plan?.value === svc.service_plan?.value)
        .map((s: any) => Number(s.service_price) || 0)
      const avg = rivals.length ? rivals.reduce((a: number, b: number) => a + b, 0) / rivals.length : 0
      return { plan: svc.service_plan?.label ?? "Plan", mine: Number(svc.service_price) || 0, market: Number(avg.toFixed(2)) }
    })

    return {
      earningsByMonth,
      ratingsByMonth,
      priceComparison,
      contractsByStatus: countBy(myContracts, (c: any) => c.status),
      applicationsByStatus: countBy(myApplications, (a: any) => a.status),
      totalEarnings,
      onTimeRate: yearDeliveries.length ? (onTime / yearDeliveries.length) * 100 : 0,
      totalDeliveries: yearDeliveries.length,
      averageRating: allRatings.length
        ? allRatings.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / allRatings.length
        : 0,
      reviewCount: allRatings.length,
      activeContracts: myContracts.filter((c: any) => c.status === "Approved").length,
    }
  }, [contracts, deliveries, reviews, applications, transactions, suppliers, services, supplierId, year])

  return { ...data, isLoading }
}
