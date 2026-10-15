import { lazy, Suspense, type ComponentType } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { HeadProvider } from "react-head"
import Loading from "@/components/atoms/loading"
import { Toaster } from "@/components/ui/toaster"
import { Private, Public, RoleOnly } from "@/app/route-guards"
import { useSessionListener } from "@/app/use-session-listener"
import { useSessionStore } from "@/stores/use-session-store"

const HomePage = lazy(() => import("@/pages/home-page"))
const Login = lazy(() => import("@/pages/auth/login"))
const Register = lazy(() => import("@/pages/auth/register"))
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"))
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"))
const Dashboard = lazy(() => import("@/pages/dashboard"))
const AdminDashboard = lazy(() => import("@/pages/admin/admin-dashboard"))
const Review = lazy(() => import("@/pages/admin/review"))
const Verification = lazy(() => import("@/pages/verify/verification"))
const Event = lazy(() => import("@/pages/events/event"))
const CreateEvent = lazy(() => import("@/pages/events/create-event"))
// EditEvent (legacy JS) can render `undefined`, which React allows but ComponentType does not model.
const EditEvent = lazy(
  () => import("@/pages/events/edit-event") as Promise<{ default: ComponentType<{ userData: unknown }> }>,
)
const EventContract = lazy(() => import("@/pages/events/event-contract"))
const Profile = lazy(() => import("@/profile/profile"))
const Settings = lazy(() => import("@/settings/settings"))
const Supplier = lazy(() => import("@/pages/suppliers/supplier"))
const SupplierShop = lazy(() => import("@/pages/suppliers/supplier-shop"))
const Analytics = lazy(() => import("@/pages/analytics/analytics"))
const Favorites = lazy(() => import("@/pages/favorites/favorites"))
const ChatWindow = lazy(() => import("@/pages/chat/chat-window"))
const Notification = lazy(() => import("@/pages/notifications/notification"))
const PaymentSuccess = lazy(() => import("@/components/organisms/success-payment"))
const Error404 = lazy(() => import("@/components/organisms/error-404"))

export default function App() {
  useSessionListener()

  const status = useSessionStore((s) => s.status)
  const user = useSessionStore((s) => s.user)
  const userData = useSessionStore((s) => s.userData)

  if (status === "initializing") return <Loading />

  const session = { user, userData }
  // Pages still receive `user`/`userData` props; they are fed from the session store.
  const pageProps = { user, userData }

  return (
    <HeadProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/register" element={<Register user={user} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<Public {...session}><ResetPassword /></Public>} />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Login user={user} />}
            />

            <Route path="/dashboard" element={<Private {...session}><Dashboard {...pageProps} /></Private>} />
            <Route
              path="/admin/dashboard"
              element={<RoleOnly role="Admin" {...session}><AdminDashboard {...pageProps} /></RoleOnly>}
            />
            <Route path="/review/:id" element={<Private {...session}><Review {...pageProps} /></Private>} />
            <Route path="/verify" element={<Private {...session}><Verification {...pageProps} /></Private>} />
            <Route path="/events" element={<Private {...session}><Event {...pageProps} /></Private>} />
            <Route path="/events/create" element={<Private {...session}><CreateEvent {...pageProps} /></Private>} />
            <Route path="/events/edit/:id" element={<Private {...session}><EditEvent {...pageProps} /></Private>} />
            <Route
              path="/events/:eventId/contract/:supplierId"
              element={<Private {...session}><EventContract {...pageProps} /></Private>}
            />
            <Route path="/profile" element={<Private {...session}><Profile {...pageProps} /></Private>} />
            <Route path="/settings" element={<Private {...session}><Settings {...pageProps} /></Private>} />
            <Route path="/suppliers" element={<Private {...session}><Supplier {...pageProps} /></Private>} />
            <Route path="/shop" element={<Private {...session}><SupplierShop {...pageProps} /></Private>} />
            <Route
              path="/analytics"
              element={<Private {...session}><Analytics userData={userData} /></Private>}
            />
            <Route path="/favorites" element={<Private {...session}><Favorites {...pageProps} /></Private>} />
            <Route path="/chats" element={<Private {...session}><ChatWindow {...pageProps} /></Private>} />
            <Route path="/chats/:id" element={<Private {...session}><ChatWindow {...pageProps} /></Private>} />
            <Route path="/notification" element={<Private {...session}><Notification {...pageProps} /></Private>} />
            <Route path="/payment/success" element={<Private {...session}><PaymentSuccess {...pageProps} /></Private>} />
            <Route path="*" element={<Error404 {...pageProps} />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </HeadProvider>
  )
}
