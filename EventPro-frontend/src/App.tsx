import { lazy, Suspense, type ComponentType } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { HeadProvider } from "react-head"
import Loading from "@/components/atoms/loading"
import { Toaster } from "@/components/ui/toaster"
import { Private, Public, RoleOnly } from "@/app/RouteGuards"
import { useSessionListener } from "@/app/useSessionListener"
import { useSessionStore } from "@/stores/useSessionStore"

const HomePage = lazy(() => import("@/pages/HomePage"))
const Login = lazy(() => import("@/pages/auth/Login"))
const Register = lazy(() => import("@/pages/auth/Register"))
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"))
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"))
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"))
const Review = lazy(() => import("@/pages/admin/Review"))
const Verification = lazy(() => import("@/pages/verify/Verification"))
const Event = lazy(() => import("@/pages/events/Event"))
const CreateEvent = lazy(() => import("@/pages/events/CreateEvent"))
// EditEvent (legacy JS) can render `undefined`, which React allows but ComponentType does not model.
const EditEvent = lazy(
  () => import("@/pages/events/EditEvent") as Promise<{ default: ComponentType<{ userData: unknown }> }>,
)
const EventContract = lazy(() => import("@/pages/events/EventContract"))
const Profile = lazy(() => import("@/profile/Profile"))
const Settings = lazy(() => import("@/settings/Settings"))
const Supplier = lazy(() => import("@/pages/suppliers/Supplier"))
const SupplierShop = lazy(() => import("@/pages/suppliers/SupplierShop"))
const Favorites = lazy(() => import("@/pages/favorites/Favorites"))
const ChatWindow = lazy(() => import("@/pages/chat/ChatWindow"))
const Notification = lazy(() => import("@/pages/notifications/Notification"))
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
            <Route path="/" element={<Public {...session}><HomePage user={user} /></Public>} />
            <Route path="/register" element={<Public {...session}><Register user={user} /></Public>} />
            <Route path="/forgot-password" element={<Public {...session}><ForgotPassword /></Public>} />
            <Route path="/reset-password" element={<Public {...session}><ResetPassword /></Public>} />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Public {...session}><Login user={user} /></Public>}
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
