import { Button, Dialog, DialogPanel } from '@headlessui/react';
import { MapPin, X, Eye, CalendarDays, CircleDollarSign, Mail, User, Bold, Phone, CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { useFetchUserProfiles } from '../hooks/useProfile';
import { useFetchReviews } from '../hooks/useReviews';
import { useFetchUsers } from '../hooks/useUsers';
import { formatDistanceToNow } from 'date-fns';
import ProfileHover from './ProfileHover';
import { eventStatusStyles, headerBackgrounds } from '../constants/categories';
import { useFetchContract } from '../hooks/useContract';
import { useFetchAllTransaction } from '../hooks/useTransaction';
import PageLoading from './PageLoading';

export default function EventModal({ isOpen, onClose, eventData, event_purpose, userData }) {
    const [hoveredReviewerId, setHoveredReviewerId] = useState(null)
    const { userProfiles, isLoading: isProfileLoading } = useFetchUserProfiles()
    const { reviews, isLoading: isReviewLoading } = useFetchReviews()
    const { users, isLoading: isUserLoading } = useFetchUsers()
    const { contracts } = useFetchContract()
    const { transactions } = useFetchAllTransaction()

    const isAllLoading = isProfileLoading || isReviewLoading || isUserLoading

    const userProfile = userProfiles.find(user => user.id === eventData?.user_id)

    const userReviews = reviews.filter(rev => rev.reviewed_id === eventData?.user_id)

    const now = new Date();
    const eventDate = new Date(eventData?.event_date?.date_value);
    const eventContracts = contracts.filter(cont => cont.event_id === eventData?.id && cont.status === "Approved")

    const isAllContractPaid = eventContracts.some(cont => {
        const contractTransaction = transactions?.filter(t => t.contract_id === cont.id)
        const eventTransactions = contractTransaction?.reduce((sum, trans) => sum + (trans.amount - trans.process_fee), 0)

        return cont.service_plan.service_price === eventTransactions
    })

    let status = {
        label: '',
        value: ''
    };

    if (eventData?.event_categories.length === 0) {
        status = { label: 'Planning', value: 'planning' };
    } else if (eventData?.event_categories.length > 0 && eventContracts.length === 0) {
        status = { label: 'Open', value: 'open' };
    } else if (eventContracts.length > 0 && now.getDate() <= eventDate.getDate()) {
        status = { label: 'In Progress', value: 'in_progress' };
    } else if (!isAllContractPaid) {
        status = { label: 'Payment Pending', value: 'payment_pending' };
    } else {
        status = { label: 'Completed', value: 'completed' };
    }


    const headerBackground = headerBackgrounds[Math.floor(Math.random() * headerBackgrounds.length)];

    return (
        <>
        
            <Dialog open={isOpen} as="div" className="relative z-100 focus:outline-none" onClose={onClose}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-4xl mt-18 rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            {isAllLoading && (
                                <PageLoading />
                            )}

                            {!isAllLoading && (
                                <>
                                    {/* HEADER */}
                                    <div className="relative h-56 rounded-t-2xl overflow-hidden">
                                        {/* Background Image */}
                                        <img
                                            src={eventData?.event_background || headerBackground} // fallback image
                                            alt={eventData?.event_name || "Event Image"}
                                            className="w-full h-full object-cover"
                                        />

                                        <span className={`absolute top-5 left-5 z-50 px-3 py-1 text-sm rounded-full ${eventStatusStyles[status.value]}`}>
                                            {status.label}
                                        </span>

                                        {/* Overlay for dim effect */}
                                        <div className="absolute inset-0 bg-black/30"></div>

                                        {/* Close Button */}
                                        <button
                                            onClick={onClose}
                                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
                                        >
                                            <X size={20} className="text-white" />
                                        </button>

                                        {/* Event Info (kept in the middle) */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white space-y-3">
                                            {/* Profile Picture / Initials */}
                                            <div className="w-20 h-20 rounded-full bg-white ring-4 ring-blue-500 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-2xl">

                                                {userProfile && userProfile?.profile_pic?.length > 0 ? (
                                                    <img
                                                        src={userProfile?.profile_pic || "/default-event.jpg"} // fallback image
                                                        alt={eventData?.event_name || "Event Image"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    eventData?.event_name?.[0]?.toUpperCase() || "E"
                                                )}
                                            </div>

                                            {/* Event Name */}
                                            <h2 className="text-2xl font-bold text-center">
                                                {eventData?.event_name?.toUpperCase()}
                                            </h2>

                                            {/* Host / Creator */}
                                            <p className="text-sm flex items-center gap-2">
                                                <User size={16} />
                                                {userProfile?.first_name + " " + userProfile?.last_name.charAt(0).toUpperCase() + userProfile?.last_name.slice(1) || "Event Organizer"}
                                            </p>
                                        </div>
                                    </div>



                                    {/* BODY */}
                                    <div className="p-6 space-y-6">

                                        {/* Location */}
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <MapPin size={16} className="text-blue-500" />
                                            <span>{eventData?.event_location || "Our Lady of Consolation Parish, San Roque, Philippines"}</span>
                                        </div>

                                        {/* Budget */}
                                        <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                                <CircleDollarSign size={16} className="text-green-600" />
                                                Event Budget
                                            </h3>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₱{eventData?.event_budget || "5900"}
                                            </p>
                                        </div>

                                        {/* Event Categories */}
                                        <div className='mb-3'>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Looking for Suppliers</h3>
                                            {eventData?.event_categories.length > 0 ? (
                                                <div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(eventData?.event_categories ?? [])
                                                            .filter((category) => category && category.label)
                                                            .map((category, index) => (
                                                                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                    {category.label}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-sm italic">
                                                    No categories selected for this event
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {eventData?.event_description || "Professional event planning and floral arrangement services for corporate events, weddings, and special occasions."}
                                            </p>
                                        </div>

                                        {/* Contact Info */}
                                        <div className='space-y-1'>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h3>
                                            <div className="flex items-center text-gray-600 text-sm gap-2">
                                                <Mail size={16} className="text-blue-500" />
                                                <span>{userProfile?.email_address || "No email address provided."}</span>
                                            </div>
                                            <div className="flex items-center text-gray-600 text-sm gap-2">
                                                <Phone size={16} className="text-blue-500" />
                                                <span>{userProfile?.contact_number || "No contact number provided."}</span>
                                            </div>
                                        </div>

                                        {/* Event Date and Time */}
                                        {eventData?.event_date && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Schedule</h3>
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={16} className="text-blue-500" />
                                                        <span>{eventData?.event_date.date_preview?.join(", ")}</span>
                                                    </div>
                                                    {eventData?.event_time && (
                                                        <div className="ml-6 text-gray-500">
                                                            {eventData?.event_time.previewStartAndEnd}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reviews */}
                                        {userReviews?.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Reviews of Event Planner</h3>
                                                <div className="max-h-64 overflow-y-auto space-y-4">
                                                    {userReviews.map((review, index) => {
                                                        // Generate stars
                                                        const stars = Array.from({ length: 5 }, (_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.168c.969 0 1.371 1.24.588 1.81l-3.374 2.455a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.374-2.455a1 1 0 00-1.175 0l-3.374 2.455c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.037 9.384c-.783-.57-.38-1.81.588-1.81h4.168a1 1 0 00.95-.69l1.286-3.957z" />
                                                            </svg>
                                                        ));

                                                        const userProfile = userProfiles.find(user => user.id === review.user_id)
                                                        const reviewerDetail = users.find(user => user.id === review.user_id)

                                                        return (
                                                            <div
                                                                key={index}
                                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl shadow-md border border-gray-200"
                                                            >
                                                                {/* Reviewer Profile */}
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm overflow-hidden">
                                                                    {userProfile && userProfile?.profile_pic?.length > 0 ? (
                                                                        <img
                                                                            src={userProfile?.profile_pic || "/default-event.jpg"} // fallback image
                                                                            alt={eventData?.event_name || "Event Image"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        review?.reviewer_name?.[0]?.toUpperCase() || "E"
                                                                    )}
                                                                </div>

                                                                {/* Reviewer Info */}
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <div
                                                                            className="relative inline-block"
                                                                            onMouseEnter={() => setHoveredReviewerId(review.id)}
                                                                            onMouseLeave={() => setHoveredReviewerId(null)}
                                                                        >
                                                                            <div className='flex flex-col'>
                                                                                <div className='flex items-baseline gap-3 mb-1'>
                                                                                    <h2 className="font-medium text-gray-900 cursor-pointer">
                                                                                        {reviewerDetail?.first_name} {reviewerDetail?.last_name}
                                                                                    </h2>
                                                                                    <p className="text-xs text-gray-500">{review?.created_at ? formatDistanceToNow(new Date(review.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}</p>
                                                                                </div>
                                                                                <h2 className="font-medium text-xs text-gray-600 cursor-pointer">
                                                                                    {reviewerDetail?.role === "Event Planner" ? 'Event' : 'Shop'}: {review.reviewer_name}
                                                                                </h2>
                                                                            </div>
                                                                            {hoveredReviewerId === review.id && (
                                                                                <ProfileHover hoveredReviewer={userProfile} user={reviewerDetail} review={review} />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex">{stars}</div>
                                                                    </div>
                                                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment || "No comment provided."}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}



                                        {/* Footer Button */}
                                        <div className="pt-1 flex gap-2">
                                            <button
                                                onClick={onClose}
                                                className="w-full bg-gray-300 hover:bg-gray-600 hover:opacity-90 text-white font-medium py-3 rounded-lg transition-all duration-200"
                                            >
                                                Close
                                            </button>
                                            {userData?.role === "Event Planner" && eventData?.user_id === userData?.id && (
                                                <a href={`/events/edit/${eventData?.id}`}
                                                    className="w-full bg-blue-600 text-center hover:bg-blue-800 hover:opacity-90 text-white font-medium py-3 rounded-lg transition-all duration-200"
                                                >
                                                    Manage Event
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
