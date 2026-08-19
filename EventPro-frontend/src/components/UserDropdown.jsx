import { useState } from "react"
import { useAuthLogout } from "../hooks/useAuth"
import { auth } from "../firebase/firebase"
import { useNavigate } from "react-router-dom"
import { useFetchUserProfileById } from "../hooks/useProfile"

export default function UserDropDown({ userData }) {
    const [isOpen, setIsOpen] = useState(false)
    const { userProfile } = useFetchUserProfileById(userData?.id)
    const navigate = useNavigate()

    const { logout } = useAuthLogout()

    const handleLogout = async () => {
        await logout(auth)
        setIsOpen(false)
    }

    return (
        <>
            <div className="relative">

                <button
                    className={`bg-gradient-to-r ${isOpen && "ring-2 ring-blue-600"} from-blue-600 to-violet-600 w-10 h-10  rounded-full text-white flex items-center justify-center overflow-hidden`}
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault()
                            setIsOpen(false)
                        }
                    }}
                >
                    {userProfile?.profile_pic ? (
                        <img
                            src={userProfile?.profile_pic}
                            alt="Profile"
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="font-medium">
                            {userData?.first_name?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>


                {isOpen && (
                    <>
                        <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-40"></div>

                        <div className="absolute z-50 mt-2 right-0 w-48 rounded-lg p-1 text-sm bg-white border border-gray-100 shadow-lg">
                            <div className="py-1 flex flex-col text-left">
                                <button onClick={() => { navigate('/profile', { replace: true }); setIsOpen(false) }} className="transition-all duration-50 w-full p-2 text-left rounded text-gray-600 hover:text-black hover:bg-gray-100">Profile</button>
                                <a href="/settings" className="transition-all duration-50 w-full p-2 text-left rounded text-gray-600 hover:text-black hover:bg-gray-100">Settings</a>
                                <button onClick={() => handleLogout()} className="transition-all duration-50 w-full p-2 text-left rounded text-gray-600 hover:text-black hover:bg-gray-100">Logout</button>
                            </div>
                        </div>
                    </>


                )}
            </div>

        </>
    )
}