import { lazy } from "react"
import type { UserData } from "@/types/session"

const SupplierAnalytics = lazy(() => import("./supplier-analytics"))
const PlannerAnalytics = lazy(() => import("./planner-analytics"))

export default function Analytics({ userData }: { userData: UserData | null }) {
  if (userData?.role === "Supplier") return <SupplierAnalytics userData={userData} />
  return <PlannerAnalytics userData={userData} />
}
