import type { Doc, LegacyProps } from "@/types/firestore";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { PlainButton as Button } from "@/components/atoms/plain-button"
import { useEffect, useState } from 'react'
import { MapPin, CircleCheckBig, Phone, Mail, X, MessageCircleMore, Heart, Check } from 'lucide-react'
import { db, auth } from '@/firebase/firebase'
import { doc, addDoc, where, serverTimestamp, onSnapshot, collection, deleteDoc, query, getDocs, updateDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Star, Clock7, CircleCheck, Edit3 } from "lucide-react"
import { ServiceEdit } from '@/components/organisms/update-modal'
import { formatDistanceToNow } from 'date-fns'
import { responseTimeOptions } from '@/constants/categories'
import ServiceModal from '@/components/organisms/service-modal'
import Select from 'react-select'
import { AboutOurBusiessEdit } from '@/components/organisms/update-modal'
import Swal from 'sweetalert2'
import { useFetchEventsById } from '@/hooks/use-events'
import { useFetchContract } from '@/hooks/use-contract'
import LoadingOverlay from '@/components/atoms/loading-overlay'
import { useFetchUserProfiles } from '@/hooks/use-profile'
import { useFetchUsers } from '@/hooks/use-users'
import ProfileHover from '@/components/molecules/profile-hover'
import AvailabilityPicker from '@/components/molecules/availability-picker'
import EventBookingModal from '@/components/organisms/event-booking-modal'

export default function SupplierModal({ isOpen, onClose, supplierData, applications, userData, reviews, services, averageRating }: LegacyProps) {

    const navigate = useNavigate()

    const [isLiked, setIsLiked] = useState(false)
    const [contactEditing, setContactEditing] = useState(false)
    const [bookingEdting, setBookingEditing] = useState(false)
    const [response_time, setResponse_time] = useState(null)
    const [contactLoading, setContactLoading] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [isCreatingContact, setIsCreatingContact] = useState(false)
    const [isCreatingFavorites, setIsCreatingFavorites] = useState(false)
    const [contact_number, setContact_number] = useState('')
    const [email_address, setEmail_address] = useState('')
    const [availability, setAvailability] = useState('')
    const [supplier_price, setSupplier_price] = useState('')
    const [timeError, setTimeError] = useState('')
    const [hoveredReviewerId, setHoveredReviewerId] = useState(null)
    const { contracts } = useFetchContract()
    const { userProfiles } = useFetchUserProfiles()
    const { users } = useFetchUsers()

    const { events } = useFetchEventsById(userData?.id)

    const activeContracts = contracts.filter(cont => events.some(event => cont.event_id === event.id))

    useEffect(() => {

        const unsubscribe = onSnapshot(collection(db, "favorites"),
            (snapshot) => {
                const userFavorites = snapshot.docs
                    .filter(doc => doc.data().user_id === auth.currentUser.uid && doc.data().supplier_id === supplierData.id)
                    .map(doc => ({ id: doc.id, ...doc.data() } as Doc));

                setIsLiked(userFavorites[0]?.isActive || false);
            });

        return () => unsubscribe();

    }, [supplierData]);

    useEffect(() => {
        setSupplier_price(supplierData?.supplier_price)
        setAvailability(supplierData?.supplier_availability)
        setResponse_time(supplierData?.supplier_response_time)
        setEmail_address(supplierData?.supplier_email)
        setContact_number(supplierData?.supplier_number)

    }, [supplierData])

    if (!supplierData) {
        return null;
    }

    const handleFavorites = async (e) => {
        e.preventDefault()
        setIsCreatingFavorites(true)
        try {
            if (isLiked) {
                const q = query(collection(db, "favorites"),
                    where("user_id", "==", auth.currentUser.uid),
                    where("supplier_id", "==", supplierData.id)
                )
                const querySnapshot = await getDocs(q)
                querySnapshot.forEach(async (docSnapshot) => {
                    await deleteDoc(doc(db, "favorites", docSnapshot.id))
                })
                setIsLiked(false)
            }
            else {
                await addDoc(collection(db, "favorites"), {
                    user_id: auth.currentUser.uid,
                    supplier_id: supplierData.id,
                    isActive: true,
                    created_at: serverTimestamp(),
                })
                setIsLiked(true)
            }
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsCreatingFavorites(false)
        }
    }

    const handleChat = async (e) => {
        e.preventDefault()
        setIsCreatingContact(true)
        try {
            const q = query(collection(db, "contacts"),
                where("user_id", "==", auth.currentUser.uid),
                where("contact_id", "==", supplierData.id)
            )

            const querySnapShot = await getDocs(q)

            if (querySnapShot.empty) {
                await addDoc(collection(db, "contacts"), {
                    user_id: auth.currentUser.uid,
                    contact_id: supplierData.id,
                    name: supplierData.supplier_name,
                    avatar: supplierData.supplier_name.slice(0, 1).toUpperCase(),
                    last_message: "",
                    unread: false,
                    isActive: false,
                    created_at: serverTimestamp()

                })
                navigate(`/chats/`)
            }
            else {
                navigate(`/chats/`)
            }
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsCreatingContact(false)
        }
    }

    const handleContactSubmit = async (e) => {
        e.preventDefault()

        setContactLoading(true)

        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_email: email_address,
                supplier_number: contact_number,
            })
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setContactLoading(false)
            setContactEditing(false)
        }
    }

    const handleBookingSubmit = async (e) => {
        e.preventDefault()
        setBookingLoading(true)

        if (timeError.length > 0) {
            setBookingLoading(false)
            Swal.fire({
                icon: 'error',
                title: 'Invalid Availability',
                text: timeError,
            })
            return;
        }

        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_availability: availability,
                supplier_response_time: response_time
            })
        }

        catch (e) {
            console.error(e)
        }
        finally {
            setBookingEditing(false)
            setBookingLoading(false)
        }
    }

    const isOwner = supplierData.id === auth.currentUser.uid
    const initial = supplierData.supplier_name?.charAt(0).toUpperCase() || 'S'

    const servicePrices = (services || []).map(s => Number(s.service_price)).filter(p => !isNaN(p) && p > 0)
    const startingPrice = servicePrices.length > 0 ? Math.min(...servicePrices) : Number(supplier_price) || null

    const tabClass = "px-1 pb-3 -mb-px text-sm font-medium border-b-2 border-transparent text-gray-500 transition-colors focus:outline-none data-hover:text-gray-900 data-selected:border-indigo-600 data-selected:text-indigo-600"
    const editBtnClass = "flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
    const cardClass = "rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    const primaryBtnClass = "flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
                <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex flex-col gap-0 border-0 bg-white p-0 rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden w-full sm:max-w-5xl font-sans [&_:is(h1,h2,h3,h4,h5)]:font-sans [&_:is(h1,h2,h3,h4,h5)]:tracking-normal">
                    <DialogTitle className="sr-only">{supplierData.supplier_name}</DialogTitle>
                    {(isCreatingContact || isCreatingFavorites) && (
                        <LoadingOverlay isLoading={isCreatingContact || isCreatingFavorites} message='Processing..' />
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {/* Banner */}
                        <div className="relative h-40 sm:h-48">
                            {supplierData.supplier_background_image?.length > 0 ? (
                                <img src={supplierData.supplier_background_image} alt={supplierData.supplier_name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                            )}
                            <span className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                                <CircleCheckBig size={14} /> Verified Supplier
                            </span>
                            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white">
                                <X size={18} className="text-gray-700" />
                            </button>
                        </div>

                        {/* Identity row */}
                        <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-start">
                            <div className="relative z-10 -mt-12 flex h-24 w-24 shrink-0 self-start items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-4xl font-bold text-indigo-600 shadow-md">
                                {initial}
                            </div>

                            <div className="flex flex-1 flex-col gap-3 pt-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h2 className="truncate text-2xl font-bold text-gray-900">{supplierData.supplier_name}</h2>
                                    {supplierData?.supplier_type?.label && (
                                        <span className="mt-1 inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                                            {supplierData.supplier_type.label}
                                        </span>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                        {supplierData.supplier_location && (
                                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" />{supplierData.supplier_location}</span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                            <span className="font-semibold text-gray-900">{averageRating || 0}</span>
                                            <span className="text-gray-500">({reviews?.length || 0} reviews)</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {userData.role === "Event Planner" && (
                                        <form onSubmit={handleFavorites}>
                                            <button aria-label="Favorite" className="rounded-full p-2 transition-colors hover:bg-gray-100">
                                                <Heart size={20} className={`transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
                                            </button>
                                        </form>
                                    )}
                                    {!isOwner && (
                                        <button onClick={handleChat} aria-label="Message" title="Message" className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600">
                                            <MessageCircleMore size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <TabGroup className="mt-6">
                            <TabList className="flex gap-8 border-b border-gray-200 px-6">
                                <Tab className={tabClass}>About</Tab>
                                <Tab className={tabClass}>Services</Tab>
                            </TabList>

                            <TabPanels className="p-6">
                                {/* About */}
                                <TabPanel className="focus:outline-none text-sm">
                                    <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
                                        <div className="space-y-6">
                                            <section>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="text-lg font-bold text-gray-900">About the Business</h3>
                                                    {isOwner && <AboutOurBusiessEdit supplierData={supplierData} />}
                                                </div>
                                                <p className="mt-2 leading-relaxed text-gray-600">
                                                    {supplierData.supplier_description || 'No description provided.'}
                                                </p>
                                            </section>

                                            <section>
                                                <h3 className="mb-3 text-lg font-bold text-gray-900">Our Expertise</h3>
                                                {supplierData?.supplier_expertise?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {supplierData.supplier_expertise.map((skill, index) => (
                                                            <span key={index} className="rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">No expertise provided.</span>
                                                )}
                                            </section>

                                            <section className="border-t border-gray-100 pt-6">
                                                <div className="text-sm">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Customer Reviews</h3>
                                            <p className="text-gray-500">What clients are saying</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                                                <span className="text-xl font-bold text-gray-900">{averageRating || 0}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{reviews?.length || 0} reviews</p>
                                        </div>
                                    </div>

                                    {reviews?.length > 0 ? (
                                        <div className="space-y-5">
                                            {reviews.map((review, index) => {
                                                const reviewerProfile = userProfiles.find(profile => profile.id === review.user_id)
                                                const reviewerDetail = users.find(user => user.id === review.user_id)

                                                return (
                                                    <div key={index} className="border-b border-gray-100 pb-5 last:border-b-0">
                                                        <div className="flex items-center gap-3">
                                                            {reviewerProfile?.profile_pic ? (
                                                                <img src={reviewerProfile.profile_pic} alt="" className='h-10 w-10 rounded-full object-cover' />
                                                            ) : (
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600">
                                                                    {review.reviewer_name?.charAt(0).toUpperCase() || 'A'}
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div
                                                                    className="relative inline-block"
                                                                    onMouseEnter={() => setHoveredReviewerId(review.id)}
                                                                    onMouseLeave={() => setHoveredReviewerId(null)}
                                                                >
                                                                    <h4 className="cursor-pointer font-medium text-gray-900">
                                                                        {reviewerDetail?.first_name} {reviewerDetail?.last_name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500">
                                                                        {reviewerDetail?.role === "Event Planner" ? 'Event' : 'Shop'}: {review.reviewer_name}
                                                                    </p>
                                                                    {hoveredReviewerId === review.id && (
                                                                        <ProfileHover hoveredReviewer={reviewerProfile} user={reviewerDetail} review={review} />
                                                                    )}
                                                                </div>
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    <div className="flex gap-0.5">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">
                                                                        {review?.created_at ? formatDistanceToNow(new Date(review.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-2 text-gray-700">{review.comment || 'Great service!'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <Star size={40} className="mx-auto mb-3 text-gray-300" />
                                            <h4 className="font-semibold text-gray-900">No Reviews Yet</h4>
                                            <p className="text-gray-500">Be the first to share your experience with this supplier!</p>
                                        </div>
                                    )}
                                </div>
                                            </section>
                                        </div>

                                        <aside className="space-y-4">
                                            {/* Contact */}
                                            <div className={cardClass}>
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="font-bold text-gray-900">Contact Information</h4>
                                                    {isOwner && !contactLoading && (
                                                        <button onClick={() => setContactEditing(!contactEditing)} className={editBtnClass}>
                                                            {!contactEditing && <Edit3 size={14} />}
                                                            {contactEditing ? 'Cancel' : 'Edit'}
                                                        </button>
                                                    )}
                                                </div>

                                                {contactLoading ? (
                                                    <div className='flex justify-center py-6'>
                                                        <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-indigo-600' />
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleContactSubmit} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-full bg-indigo-50 p-2"><Mail size={16} className="text-indigo-600" /></div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-gray-900">Email Address</p>
                                                                {!contactEditing ? (
                                                                    <p className="truncate text-sm text-gray-600">{supplierData.supplier_email || 'Not provided'}</p>
                                                                ) : (
                                                                    <input type="email" value={email_address} onChange={(e) => setEmail_address(e.target.value)} placeholder='e.g test@gmail.com' className='mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none' />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-full bg-indigo-50 p-2"><Phone size={16} className="text-indigo-600" /></div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-gray-900">Phone Number</p>
                                                                {!contactEditing ? (
                                                                    <p className="text-sm text-gray-600">{supplierData.supplier_number || 'Not provided'}</p>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        maxLength={11}
                                                                        value={contact_number}
                                                                        onChange={(e) => setContact_number(e.target.value.replace(/[^0-9]/g, ""))}
                                                                        placeholder="e.g 0961234567"
                                                                        className='mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none'
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {contactEditing && (
                                                            <button className={`${primaryBtnClass} ml-auto py-1.5`}>Save</button>
                                                        )}
                                                    </form>
                                                )}
                                            </div>

                                            {/* Booking details */}
                                            <div className={cardClass}>
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="font-bold text-gray-900">Business Hours</h4>
                                                    {isOwner && !bookingLoading && (
                                                        <button onClick={() => setBookingEditing(!bookingEdting)} className={editBtnClass}>
                                                            {!bookingEdting && <Edit3 size={14} />}
                                                            {bookingEdting ? 'Cancel' : 'Edit'}
                                                        </button>
                                                    )}
                                                </div>

                                                {bookingLoading ? (
                                                    <div className='flex justify-center py-6'>
                                                        <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-indigo-600' />
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-full bg-indigo-50 p-2"><Clock7 size={16} className="text-indigo-600" /></div>
                                                            <div className="min-w-0 flex-1">
                                                                {!bookingEdting ? (
                                                                    <p className="text-sm text-gray-600">{supplierData.supplier_availability || 'Not provided'}</p>
                                                                ) : (
                                                                    <AvailabilityPicker
                                                                        onChange={(val) => setAvailability(val)}
                                                                        existingValue={supplierData?.supplier_availability}
                                                                        setTimeError={setTimeError}
                                                                    />
                                                                )}
                                                                {timeError && <span className="mt-1 block text-sm text-red-500">{timeError}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-full bg-indigo-50 p-2"><CircleCheck size={16} className="text-indigo-600" /></div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-gray-900">Typical Response Time</p>
                                                                {!bookingEdting ? (
                                                                    <p className="text-sm text-gray-600">{supplierData.supplier_response_time?.label || 'Not provided'}</p>
                                                                ) : (
                                                                    <Select value={response_time} className='mt-1 text-sm' onChange={setResponse_time} options={responseTimeOptions} placeholder="Typical response time" isClearable required />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {bookingEdting && (
                                                            <button className={`${primaryBtnClass} ml-auto py-1.5`}>Save</button>
                                                        )}
                                                    </form>
                                                )}
                                            </div>

                                            {/* Starting price */}
                                            {startingPrice && (
                                                <div className={cardClass}>
                                                    <p className="text-xs font-semibold text-gray-900">Starting Price</p>
                                                    <p className="mt-1 text-2xl font-bold text-indigo-600">₱{startingPrice.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500">Per service</p>
                                                </div>
                                            )}

                                            {!isOwner && (
                                                <div className="rounded-xl bg-indigo-50 p-4">
                                                    <p className="text-sm font-semibold text-gray-900">Ready to book?</p>
                                                    <p className="mt-1 text-xs text-gray-600">Get in touch with the supplier for availability and custom packages.</p>
                                                </div>
                                            )}
                                        </aside>
                                    </div>
                                </TabPanel>

                                {/* Services */}
                                <TabPanel className="focus:outline-none text-sm">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Services</h3>
                                            <p className="text-gray-500">Services built around your needs</p>
                                        </div>
                                        <ServiceModal userData={userData} supplierData={supplierData} />
                                    </div>

                                    {!(services?.length > 0) ? (
                                        <p className="py-12 text-center text-gray-400">No services yet</p>
                                    ) : (
                                        <div className="grid gap-5 md:grid-cols-2">
                                            {services.map((service, index) => (
                                                <div key={index} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                                    <div className="bg-indigo-600 px-5 py-4 text-center font-semibold text-white">{service.service_plan.label}</div>
                                                    <div className="flex flex-1 flex-col p-5">
                                                        <p className="text-xs font-semibold text-gray-500">Price</p>
                                                        <p className="text-2xl font-bold text-indigo-600">₱{Number(service.service_price).toLocaleString()}</p>
                                                        <hr className="my-4 border-gray-100" />
                                                        <ul className="flex-1 space-y-2.5">
                                                            {service?.service_inclusions?.map((inclusion, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-gray-600">
                                                                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                                                                    <span>{inclusion}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">Note: {service.service_payment_notice.label}</p>
                                                        <div className="mt-3">
                                                            <ServiceEdit supplierData={supplierData} service_id={service.id} services={service} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabPanel>

                            </TabPanels>
                        </TabGroup>
                    </div>

                    {/* Sticky footer */}
                    <div className="flex items-center justify-end gap-4 border-t border-gray-100 bg-white px-6 py-2">
                        <div className="flex items-center gap-3">
                            <Button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">
                                Close
                            </Button>
                            {!isOwner && (applications?.some(app => app.user_id === supplierData.id) || userData?.role === "Event Planner") && (
                                <EventBookingModal events={events} activeContracts={activeContracts} supplierData={supplierData} />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
