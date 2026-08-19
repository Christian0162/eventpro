import { Button, Dialog, DialogPanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { MapPin, CircleCheckBig, Clock, Phone, Mail, X, MessageCircleMore, Heart, ChevronsLeftRightEllipsis, Check } from 'lucide-react'
import { db, auth } from '../firebase/firebase'
import { doc, addDoc, where, serverTimestamp, onSnapshot, collection, deleteDoc, query, getDocs, updateDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Star, Clock7, CircleCheck, Edit3 } from "lucide-react"
import { ServiceEdit } from './UpdateModal'
import ShopCards from './ShopCards'
import { formatDistanceToNow } from 'date-fns'
import { responseTimeOptions } from '../constants/categories'
import ServiceModal from './ServiceModal'
import Select from 'react-select'
import { AboutOurBusiessEdit } from './UpdateModal'
import Swal from 'sweetalert2'
import { useFetchEventsById } from '../hooks/useEvents'
import { useFetchContract } from '../hooks/useContract'
import LoadingOverlay from './LoadingOverlay'
import { useFetchUserProfiles } from '../hooks/useProfile'
import { useFetchUsers } from '../hooks/useUsers'
import ProfileHover from './ProfileHover'
import AvailabilityPicker from './AvailabilityPicker'
import EventBookingModal from './EventBookingModal'

export default function SupplierModal({ isOpen, onClose, supplierData, applications, userData, reviews, services, averageRating, className }) {

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
                    .map(doc => ({ id: doc.id, ...doc.data() }));

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

    const handleBookingSubmit = async () => {
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

    console.log('asd')

    return (
        <>
            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={onClose}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            className="w-full max-w-5xl mt-20 rounded-2xl bg-white shadow-2xl8"
                        >
                            {(isCreatingContact || isCreatingFavorites) && (
                                <LoadingOverlay isLoading={isCreatingContact || isCreatingFavorites} message='Processing..' />
                            )}

                            {/* Header with close button */}
                            <div className="relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                {/* Hero Image */}
                                <div className="relative h-60 overflow-hidden rounded-t-2xl">
                                    {supplierData.supplier_background_image.length > 0 ? (
                                        <img
                                            src={supplierData.supplier_background_image}
                                            alt={supplierData.supplier_name}
                                            className="w-full h-full object-cover"
                                        />

                                    ) : (
                                        <div className="absolute inset-0 w-full bg-gradient-to-r from-pink-600 via-blue-600 via-100% to-violet-600 rounded-t-lg"></div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className='flex items-center gap-2 mb-2'>
                                    <h2 className="text-2xl font-bold text-gray-900 ">{supplierData.supplier_name}</h2>
                                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                        {supplierData?.supplier_type?.label}
                                    </span>

                                    <span className="flex group items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                                        <span className={`text-green-700 font-medzium text-sm`}>Verified</span>
                                        <CircleCheckBig size={16} className="text-green-600" />
                                    </span>
                                </div>
                                {/* Location and Basic Info */}
                                <div className="flex items-center justify-between space-x-4 mb-4">
                                    <div className='flex gap-3'>
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="text-gray-400" size={16} />
                                            <span className="text-gray-600">{supplierData.supplier_location}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="text-gray-400" size={16} />
                                            <span className="text-gray-600">{supplierData.supplier_availability}</span>
                                        </div>
                                    </div>

                                    <div className='flex gap-5'>
                                        <div className="relative space-x-2">
                                            {userData.role === "Event Planner" && (
                                                <form onSubmit={handleFavorites}>
                                                    <button className='group transparent'>
                                                        <Heart className={`transition-all duration-200 ${isLiked ? 'fill-red-600 opacity-100 text-red-600' : 'opacity-50 text-gray-800 group-hover:text-red-600 group-hover:opacity-60 group-hover:scale-115'}`} size={21} />
                                                    </button>
                                                </form>
                                            )}
                                        </div>

                                        <div className="relative space-x-2">
                                            {supplierData.id !== userData.id && (
                                                <button onClick={handleChat} className='group'>
                                                    <MessageCircleMore className="trasition-all duration-200 text-gray-400 group-hover:text-blue-600" size={21} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Functional Navigation Tabs */}
                                <TabGroup>
                                    <TabList className="mb-3">
                                        <div className="flex gap-1">
                                            <Tab className="px-6 py-1 rounded-full font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                                                About
                                            </Tab>
                                            <Tab className="px-6 py-1 rounded-full font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                                                Services
                                            </Tab>
                                            <Tab className="px-6 py-1 rounded-full font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                                                Reviews
                                            </Tab>
                                        </div>
                                    </TabList>

                                    <TabPanels>
                                        {/* About Tab Panel */}
                                        <TabPanel className="focus:outline-none text-sm">
                                            <div className="grid md:grid-cols-2 gap-5">
                                                {/* Description Card */}
                                                <ShopCards className="md:col-span-2">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">About Our Business</h3>
                                                            <p className="text-gray-600 mt-2">{supplierData.supplier_description}</p>
                                                        </div>
                                                        {supplierData.id === auth.currentUser.uid && (
                                                            <AboutOurBusiessEdit supplierData={supplierData} />
                                                        )}
                                                    </div>


                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-3">Our Expertise</h4>
                                                        <div className="flex flex-wrap gap-3">
                                                            {supplierData?.supplier_expertise?.map((skill, index) => (
                                                                <span
                                                                    key={index}
                                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                                                         bg-gray-100 text-gray-700 hover:bg-gray-200`}
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {supplierData?.supplier_expertise?.length === 0 && (
                                                            <span className='text-gray-600'>No expertise provided.</span>
                                                        )}
                                                    </div>
                                                </ShopCards>

                                                {/* Contact Information */}
                                                <ShopCards>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Information</h3>
                                                            <p className="text-gray-600">How customers can reach you</p>
                                                        </div>

                                                        {supplierData.id === auth.currentUser.uid && !contactEditing && !contactLoading && (
                                                            <button onClick={() => setContactEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                                                                <Edit3 size={16} />
                                                                Edit
                                                            </button>
                                                        )}

                                                        {contactEditing && !contactLoading && (
                                                            <button onClick={() => setContactEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>

                                                    {contactLoading && (
                                                        <div className='flex justify-center'>
                                                            <div className='h-12 w-12 border-t-2 mt-10 border-blue-600 animate-spin rounded-full'></div>
                                                        </div>
                                                    )}
                                                    {!contactLoading && (
                                                        <div className="space-y-6">
                                                            <form onSubmit={handleContactSubmit} className='relative'>
                                                                <div className="flex items-center gap-4 mt-6">
                                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                                        <Mail size={24} className="text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 mb-1">Email Address</h4>
                                                                        {!contactEditing
                                                                            ? (
                                                                                <p className="text-gray-600">{supplierData.supplier_email || 'Information not provided'}</p>

                                                                            )

                                                                            : (
                                                                                <input type="email" value={email_address} onChange={(e) => setEmail_address(e.target.value)} placeholder='e.g test@gmail.com' className='border border-gray-300 focus:outline-none px-4 py-2 rounded-md text-sm' />
                                                                            )}

                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4 mt-6">
                                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                                        <Phone size={24} className="text-green-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 mb-1">Phone Number</h4>
                                                                        {!contactEditing
                                                                            ? (
                                                                                <p className="text-gray-600">{supplierData.supplier_number || 'Not provided'}</p>
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    inputMode="numeric"
                                                                                    className='px-3 py-2 border border-gray-300 focus:outline-none rounded-md text-sm'
                                                                                    maxLength={11}
                                                                                    value={contact_number}
                                                                                    onChange={(e) => {
                                                                                        const digits = e.target.value.replace(/[^0-9]/g, "");
                                                                                        setContact_number(digits);
                                                                                    }}
                                                                                    placeholder="e.g 0961234567"
                                                                                />
                                                                            )}
                                                                    </div>
                                                                </div>
                                                                {contactEditing && (
                                                                    <button className='flex ml-auto mt-5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md'>
                                                                        Save
                                                                    </button>
                                                                )}
                                                            </form>
                                                        </div>
                                                    )}
                                                </ShopCards>

                                                {/* Booking Information */}
                                                <ShopCards>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Details</h3>
                                                            <p className="text-gray-600">Pricing and availability information</p>
                                                        </div>
                                                        {supplierData.id === auth.currentUser.uid && !bookingEdting && (
                                                            <button onClick={() => setBookingEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                                                                <Edit3 size={16} />
                                                                Edit
                                                            </button>
                                                        )}

                                                        {bookingEdting && (
                                                            <button onClick={() => setBookingEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>

                                                    {bookingLoading && (
                                                        <div className='flex justify-center'>
                                                            <div className='h-12 w-12 border-t-2 mt-10 border-blue-600 animate-spin rounded-full'></div>
                                                        </div>
                                                    )}

                                                    {!bookingLoading && (
                                                        <form onSubmit={handleBookingSubmit}>
                                                            <div className="space-y-6">

                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                                        <Clock7 size={24} className="text-purple-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 mb-1">{bookingEdting ? '' : "Availability"}</h4>
                                                                        {!bookingEdting ? (
                                                                            <p className="text-gray-600">{supplierData.supplier_availability}</p>
                                                                        ) : (
                                                                            <AvailabilityPicker
                                                                                onChange={(val) => setAvailability(val)}
                                                                                existingValue={supplierData?.supplier_availability}
                                                                                setTimeError={setTimeError}
                                                                            />
                                                                        )}
                                                                        {timeError && (
                                                                            <span className="text-red-500 text-sm mt-1">{timeError}</span>
                                                                        )}

                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4 ">
                                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                                        <CircleCheck size={24} className="text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 mb-1">Typical Response Time</h4>
                                                                        <div className="flex items-center gap-2">
                                                                            {!bookingEdting ? (
                                                                                <span className="text-gray-600">{supplierData.supplier_response_time?.label}</span>

                                                                            ) : (
                                                                                <Select value={response_time} className='text-sm' onChange={setResponse_time} options={responseTimeOptions} placeholder="Typically response time" isClearable required />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {bookingEdting && (
                                                                    <button className='flex ml-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md'>
                                                                        Save
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </form>
                                                    )}
                                                </ShopCards>
                                            </div>
                                        </TabPanel>

                                        {/* Services Tab Panel */}
                                        <TabPanel className="focus:outline-none text-sm">
                                            <div className="grid md:grid-cols-1 gap-8">
                                                <ShopCards>
                                                    <div className='flex'>
                                                        <div className='flex flex-col ml-2 gap-1'>
                                                            <h2 className='text-2xl font-bold text-gray-800 '>Services</h2>
                                                            <p className='text-md text-gray-600'>Services Built Around Your Needs</p>
                                                        </div>
                                                        <ServiceModal userData={userData} supplierData={supplierData} />
                                                    </div>
                                                    {!services?.length > 0 && (
                                                        <span className='text-lg text-gray-400 my-10 mt-15 block text-center'>No Service</span>
                                                    )}
                                                    {services && (
                                                        <div className="grid md:grid-cols-2 gap-6 mt-5">
                                                            {services?.map((services, index) => (
                                                                <div key={index} className={`bg-gradient-to-br rounded-xl flex flex-col justify-between  h-full min-h-[420px] bg-blue-50`}>
                                                                    <h4 className={`font-bold text-white py-7 rounded-t-md text-center bg-blue-600`}>{services.service_plan.label}</h4>
                                                                    <div className='p-6 flex flex-col flex-1'>
                                                                        <div className="mb-4">
                                                                            <span className='font-bold text-gray-600'>Price</span>
                                                                            <span className="text-2xl font-bold text-blue-600 block">₱{services.service_price}</span>
                                                                        </div>

                                                                        <hr className='border-t border-gray-300 my-3' />

                                                                        <div className='flex flex-col gap-2 my-4'>
                                                                            <ul className='list-disc pl-5 flex text-gray-800 flex-col gap-2'>
                                                                                {services?.service_inclusions?.map((inclusion, index) => (
                                                                                    <div className="flex gap-3 space-y-3" key={index}>
                                                                                        <Check className="text-green-400" />
                                                                                        <span className="flex text-sm text-gray-600" >{inclusion}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </ul>
                                                                        </div>

                                                                    </div>

                                                                    <div className='flex flex-col px-5'>
                                                                        <hr className='border-t border-gray-300' />
                                                                        <p className='text-gray-500 mt-3'>Note: {services.service_payment_notice.label}</p>
                                                                        <div className="mt-auto pt-6">
                                                                            <ServiceEdit supplierData={supplierData} service_id={services.id} services={services} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ShopCards>
                                            </div>
                                        </TabPanel>

                                        {/* Reviews Tab Panel */}
                                        <TabPanel className="focus:outline-none text-sm">
                                            <div className="grid md:grid-cols-1 gap-8">
                                                <ShopCards>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
                                                            <p className="text-gray-600">What our clients are saying about us</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-2">
                                                                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                                                                    <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-500">{reviews?.length} reviews</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {reviews?.length > 0 ? (
                                                        <div className="space-y-6">
                                                            {reviews.map((review, index) => {
                                                                const reviewerProfile = userProfiles.find(
                                                                    profile => profile.id === review.user_id
                                                                )
                                                                const reviewerDetail = users.find(user => user.id === review.user_id)

                                                                return (
                                                                    <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0" >
                                                                        <div className="flex items-start gap-4">
                                                                            {reviewerProfile?.profile_pic ? (
                                                                                <img src={reviewerProfile?.profile_pic} alt="" className='h-10 w-10 rounded-full object-cover' />
                                                                            ) : (
                                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                                                    {review.reviewer_name?.charAt(0).toUpperCase() || 'A'}
                                                                                </div>)}
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-3 mb-2">
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
                                                                                            <ProfileHover hoveredReviewer={reviewerProfile} user={reviewerDetail} review={review} />
                                                                                        )}
                                                                                    </div>                                                                                    <div className="flex items-center gap-1">
                                                                                        {[...Array(5)].map((_, i) => (
                                                                                            <Star
                                                                                                key={i}
                                                                                                size={16}
                                                                                                className={`${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                    <span className="text-   text-gray-500">{review?.created_at ? formatDistanceToNow(new Date(review.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}</span>
                                                                                </div>
                                                                                <p className="text-gray-700">{review.comment || 'Great service!'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <Star size={48} className="text-gray-300 mx-auto mb-4" />
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
                                                            <p className="text-gray-600">Be the first to share your experience with this supplier!</p>
                                                        </div>
                                                    )}
                                                </ShopCards>
                                            </div>
                                        </TabPanel>
                                    </TabPanels>
                                </TabGroup>

                                {/* Action Buttons */}
                                {supplierData.id !== auth.currentUser.uid && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <Button
                                            onClick={onClose}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        >
                                            Close
                                        </Button>

                                        {applications?.some(app => app.user_id === supplierData.id) || userData?.role === "Event Planner" && (
                                            <EventBookingModal events={events} activeContracts={activeContracts} supplierData={supplierData} />
                                        )}
                                    </div>
                                )}

                                {supplierData.id === auth.currentUser.uid && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <Button
                                            onClick={onClose}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </div >
            </Dialog >
        </>
    )
}