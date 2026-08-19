import NavBar from "../components/NavBar"
import Loading from "../components/Loading"
import Footer from "../components/Footer"
import { auth } from "../firebase/firebase"
import { useEffect } from "react"
import Swal from "sweetalert2"
import { signOut } from "firebase/auth"

export default function AuthLayout({ children, user, userData }) {

    useEffect(() => {
        const handleBannedUser = async () => {
            if (userData && userData.status === "banned") {
                await Swal.fire({
                    icon: "warning",
                    title: "Account Disabled",
                    text: "This account has been banned by the admin.",
                    confirmButtonText: "OK",
                });

                await signOut(auth);
            }
        };

        handleBannedUser();
    }, [userData]);


    if (!userData || !user) {
        return <Loading />
    }

    console.log(children)

    return (
        <div className="min-h-screen bg-blue-50">
            <NavBar user={user} userData={userData} />
            <div className="p-10 px-[5rem]">

                {children}

            </div>
            <Footer />
        </div>
    )
}