import { BadgeCheck, Calendar, Mail, Phone, Store } from "lucide-react";
import { useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./LoadingOverlay";
import { useFetchReviews } from "../hooks/useReviews";
import { useFetchUserProfiles } from "../hooks/useProfile";

export default function ProfileHover({ hoveredReviewer, user, review }) {
    const [isCreatingContact, setIsCreatingContact] = useState(false)
    const { userProfiles } = useFetchUserProfiles()
    const { reviews } = useFetchReviews()
    const navigate = useNavigate()

    const userReviews = reviews.filter(rev => rev.reviewed_id === user.id)
    const userProfile = userProfiles.find(prof => prof.id === userReviews[0]?.user_id)

    console.log(userProfile)

    const handleChat = async () => {
        setIsCreatingContact(true)
        try {
            const q = query(collection(db, "contacts"),
                where("user_id", "==", user.id),
                where("contact_id", "==", review.user_id)
            )

            const querySnapShot = await getDocs(q)

            if (querySnapShot.empty) {
                await addDoc(collection(db, "contacts"), {
                    user_id: user.id,
                    contact_id: review.user_id,
                    name: user.first_name,
                    avatar: user.first_name.slice(0, 1).toUpperCase(),
                    last_message: "",
                    isActive: false,
                    created_at: serverTimestamp()
                })
                navigate(`/chats/${review.user_id}`)
            } else {
                navigate(`/chats/${review.user_id}`)
            }
        }
        catch (e) {
            console.error(e)
            setIsCreatingContact(false)
        }
        finally {
            setIsCreatingContact(false)
        }
    }

    return (
        <>
            {isCreatingContact && (
                <LoadingOverlay isLoading={isCreatingContact} message="Processing.." />
            )}
            <div
                className="absolute left-0 top-2 mt-3 w-80 bg-[#18191a] text-white rounded-2xl shadow-2xl border border-gray-700 z-50 p-4 transition-all duration-200"
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {hoveredReviewer?.profile_pic ? (
                            <img
                                src={hoveredReviewer?.profile_pic}
                                alt=""
                                className="h-14 w-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-xl font-bold">
                                {user?.first_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="font-semibold text-lg capitalize">
                                    {user.first_name} {user.last_name}
                                </p>
                                {user?.verification_status === "verified" && (
                                    <BadgeCheck size={20} className="text-blue-600 mt-1" />
                                )}
                            </div>
                            <p className="text-sm text-gray-300 capitalize">
                                {user.role || "User"}
                            </p>

                            {/* 🏪 Shop Name */}
                            {user?.role === "Supplier" ? (
                                <p className="text-sm text-gray-400 italic mt-1 flex items-baseline gap-1">
                                    <Store size={15} className="text-white" /> {review.reviewer_name || review.supplier_name}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic mt-1 flex items-baseline gap-1">
                                    <Calendar size={15} className="text-white" /> {review.reviewer_name || review.supplier_name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-200 mt-3 leading-snug">
                    {hoveredReviewer?.description || "No description available for this user."}
                </p>

                {/* Contact */}
                <div className="mt-3 text-sm text-gray-400 flex flex-col gap-2">
                    <p className="flex items-center gap-1"><Mail size={15} className="text-white" /> {user?.email_address || "No email"}</p>
                    <p className="flex items-center gap-1"><Phone size={15} className="text-white" /> {hoveredReviewer?.contact_number || "No contact"}</p>
                </div>

                {/* First Review Only */}
                {userReviews[0] && (
                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Previous Review</h3>
                        <div className="flex items-start gap-3 bg-gray-900 p-3 rounded-xl">
                            {/* Reviewer Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold">
                                {userProfile && userProfile.profile_pic.length > 0 ? (
                                    <img
                                        src={userProfile?.profile_pic}
                                        alt=""
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : userReviews[0].reviewer_name?.[0]?.toUpperCase() || "A"}
                            </div>

                            {/* Reviewer Info */}
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-100">{userReviews[0].reviewer_name || "Anonymous"}</span>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <span
                                                key={i}
                                                className={`text-sm ${i < userReviews[0].rating ? "text-yellow-400" : "text-gray-600"}`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-snug">{userReviews[0].comment || "No comment provided."}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => handleChat()}
                        className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium mr-2 transition"
                    >
                        Message
                    </button>
                </div>
            </div>
        </>
    )
}
