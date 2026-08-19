import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, lazy, Suspense } from "react";
import { auth, db } from "./firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Loading from "./components/Loading";
import { HeadProvider } from "react-head";
import Verification from "./pages/verify/Verification";
import Profile from "./profile/Profile";
import PaymentSuccess from "./components/SuccessPayment.jsx";
import { setupUserPresence } from "./firebase/presence.js";

const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.jsx"))
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.jsx"))
const GuestLayout = lazy(() => import("./layouts/GuestLayout"))
const EventContract = lazy(() => import("./pages/events/EventContract"))
const AuthLayout = lazy(() => import("./layouts/AuthLayout"))
const HomePage = lazy(() => import("./pages/HomePage"))
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Review = lazy(() => import("./pages/admin/Review"));
const CreateEvent = lazy(() => import("./pages/events/CreateEvent"));
const EditEvent = lazy(() => import("./pages/events/EditEvent"));
const Settings = lazy(() => import("./settings/Settings.jsx"))
const Event = lazy(() => import("./pages/events/Event.jsx"))
const Supplier = lazy(() => import("./pages/suppliers/Supplier"));
const SupplierShop = lazy(() => import("./pages/suppliers/SupplierShop"));
const Favorites = lazy(() => import("./pages/favorites/Favorites"));
const ChatWindow = lazy(() => import("./pages/chat/ChatWindow"));
const Notification = lazy(() => import("./pages/notifications/Notification"));
const Error404 = lazy(() => import("./components/Error404"));

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    setUser(user);
                    setupUserPresence(user.uid)
                    const unsubscribeUsers = onSnapshot(doc(db, "users", user.uid), async (onsnapshot) => {

                        if (onsnapshot.exists()) {
                            setUserData({ id: onsnapshot.id, ...onsnapshot.data() });
                        }

                        else {
                            console.warn("No user data found");
                            setUserData(null);
                        }
                        setIsLoading(false);

                        return () => unsubscribeUsers()
                    })
                } else {
                    setUser(null);
                    setUserData(null);
                }
            } catch (error) {

                console.error("Error in auth state change:", error);
                setUser(null);
                setUserData(null);

            } finally {
                setAuthChecked(true);
            }
        });
        return () => unsubscribe();
    }, [])

    if (!authChecked || isLoading) {
        return <Loading />
    }

    return (
        <>
            <HeadProvider>
                <BrowserRouter>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            <Route path="/" element={
                                <GuestLayout user={user} userData={userData}>
                                    <HomePage user={user} />
                                </GuestLayout>}></Route>

                            <Route path="/register" element={
                                <GuestLayout user={user} userData={userData}>
                                    <Register user={user} />
                                </GuestLayout>
                            }></Route>

                            <Route path="/forgot-password" element={
                                <GuestLayout user={user} userData={userData}>
                                    <ForgotPassword user={user} />
                                </GuestLayout>
                            }></Route>

                            <Route path="/reset-password" element={
                                <GuestLayout user={user} userData={userData}>
                                    <ResetPassword user={user} />
                                </GuestLayout>
                            }></Route>

                            <Route path="/login" element={
                                !user ? (
                                    <GuestLayout user={user} userData={userData}>
                                        <Login user={user} />
                                    </GuestLayout>
                                ) : (
                                    <Navigate to="/dashboard" />
                                )
                            }>
                            </Route>

                            <Route path="/dashboard" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Dashboard user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/admin/dashboard" element={userData?.role === "Admin" ?
                                <AuthLayout user={user} userData={userData}>
                                    <AdminDashboard user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/dashboard'} />}></Route>

                            <Route path="/review/:id" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Review user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/verify" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Verification user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/events" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Event user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/events/create" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <CreateEvent user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/events/edit/:id" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <EditEvent user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/events/:eventId/contract/:supplierId" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <EventContract user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/profile" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Profile user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/settings" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Settings user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/suppliers" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Supplier user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/shop" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <SupplierShop user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/favorites" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Favorites user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/chats" element={user ? (
                                <AuthLayout user={user} userData={userData}>
                                    <ChatWindow user={user} userData={userData} />
                                </AuthLayout>
                            ) : <Navigate to="/login" />} />

                            <Route path="/chats/:id" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <ChatWindow user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/notification" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <Notification user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="/payment/success" element={user ?
                                <AuthLayout user={user} userData={userData}>
                                    <PaymentSuccess user={user} userData={userData} />
                                </AuthLayout> : <Navigate to={'/login'} />}></Route>

                            <Route path="*" element={<Error404 user={user} userData={userData} />}></Route>

                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </HeadProvider >

        </>
    )
}

export default App;
