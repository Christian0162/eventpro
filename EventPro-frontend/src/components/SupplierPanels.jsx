import { useEffect, useState } from 'react'
import ShopCards from '../components/ShopCards'
import { TabList, Tab, TabPanel, TabPanels, TabGroup } from '@headlessui/react'
import { Edit3, Mail, Phone, DollarSign, Clock7, CircleCheck, Star, Check, Trash2 } from 'lucide-react'
import { AboutOurBusiessEdit } from './UpdateModal'
import Select from 'react-select'
import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/firebase'
import { responseTimeOptions } from '../constants/categories'
import ServiceModal from './ServiceModal'
import { ServiceEdit } from './UpdateModal'
import { formatDistanceToNow } from 'date-fns'
import Swal from 'sweetalert2'
import LoadingOverlay from './LoadingOverlay'
import { useFetchUserProfiles } from '../hooks/useProfile'
import { useFetchUsers } from '../hooks/useUsers'
import ProfileHover from './ProfileHover'
import AvailabilityPicker from './AvailabilityPicker'

export default function SupplierPanels({ userData, shop, reviews, services, averageRating }) {

    const [contactEditing, setContactEditing] = useState(false)
    const [bookingEdting, setBookingEditing] = useState(false)
    const [response_time, setResponse_time] = useState(null)
    const [contactLoading, setContactLoading] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [contact_number, setContact_number] = useState('')
    const [email_address, setEmail_address] = useState('')
    const [availability, setAvailability] = useState('')
    const [timeError, setTimeError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [hoveredReviewerId, setHoveredReviewerId] = useState(null)
    const { userProfiles } = useFetchUserProfiles()
    const { users } = useFetchUsers()

    useEffect(() => {
        setAvailability(shop?.supplier_availability)
        setResponse_time(shop?.supplier_response_time)
        setContact_number(shop?.supplier_number)
        setEmail_address(shop?.supplier_email)
    }, [shop, userData])

    const handleContactSubmit = async (e) => {
        e.preventDefault()

        setContactLoading(true)

        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_number: contact_number,
                supplier_email: email_address
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

    const handleDelete = async (service) => {

        console.log(service)
        setIsDeleting(true)
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            })

            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "services", service?.id));
                    Swal.fire(
                        'Deleted!',
                        'Service has been deleted successfully.',
                        'success'
                    );
                } catch (e) {
                    console.error(e);
                    Swal.fire('Error', 'Failed to delete service.', 'error');
                }
            }

        }

        catch (e) {
            console.error(e)
        }

        finally {
            setIsDeleting(false)
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
            return; // ⛔ stop before doing anything
        }

        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_availability: availability,
                supplier_response_time: response_time
            })
            setBookingEditing(false)
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setBookingLoading(false)
        }
    }

    console.log(timeError)

    return (
        <>
            {/* Functional Navigation Tabs */}
            <TabGroup>
                <TabList className="border-b border-gray-200 mb-8">
                    <div className="flex gap-1">
                        <Tab className="px-6 py-3 rounded-t-lg font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                            About
                        </Tab>
                        <Tab className="px-6 py-3 rounded-t-lg font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                            Services
                        </Tab>
                        <Tab className="px-6 py-3 rounded-t-lg font-medium transition-colors focus:outline-none data-selected:bg-blue-500 data-selected:text-white data-selected:shadow-sm data-hover:text-gray-900 data-hover:bg-gray-50 text-gray-600">
                            Reviews
                        </Tab>
                    </div>
                </TabList>

                <TabPanels>
                    {/* About Tab Panel */}
                    <TabPanel className="focus:outline-none">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* About our Business */}
                            <ShopCards className="md:col-span-2">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">About Our Business</h3>
                                        <p className="text-gray-600">{shop?.supplier_description}</p>
                                    </div>
                                    <AboutOurBusiessEdit supplierData={shop} />
                                </div>
                                {/* 
                                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                                    Create stunning floral arrangements for weddings and events that leave lasting impressions.
                                </p> */}

                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">Our Expertise</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {shop?.supplier_expertise?.map((skill, index) => (
                                            <span
                                                key={index}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200`}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    {shop?.supplier_expertise?.length === 0 && (
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

                                    {!contactEditing && !contactLoading && (
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
                                            {/* email */}
                                            <div className="flex items-center gap-4 mt-6">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Mail size={24} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 mb-1">Email Address</h4>
                                                    {!contactEditing
                                                        ? (
                                                            <p className="text-gray-600">{shop?.supplier_email || 'Information not provided'}</p>
                                                        ) : (
                                                            <input
                                                                type="email"
                                                                className='px-3 py-2 border border-gray-300 focus:outline-none rounded-md text-sm'
                                                                value={email_address}
                                                                onChange={(e) => setEmail_address(e.target.value)}
                                                                placeholder='Enter information here'
                                                            />
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
                                                            <p className="text-gray-600">{shop?.supplier_number || 'Not provided'}</p>
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
                                    {!bookingEdting && (
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
                                    <div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Clock7 size={24} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 mb-1">{bookingEdting ? '' : "Availability"}</h4>
                                                    {!bookingEdting ? (
                                                        <p className="text-gray-600">{shop?.supplier_availability}</p>
                                                    ) : (
                                                        <AvailabilityPicker
                                                            onChange={(val) => setAvailability(val)}
                                                            existingValue={shop?.supplier_availability}
                                                            setTimeError={setTimeError}
                                                        />)}
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
                                                            <span className="text-gray-600">{shop?.supplier_response_time?.label}</span>

                                                        ) : (
                                                            <Select value={response_time} className='text-sm' onChange={setResponse_time} options={responseTimeOptions} placeholder="Typically response time" isClearable required />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {bookingEdting && (
                                                <button onClick={() => handleBookingSubmit()} className='flex ml-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md'>
                                                    Save
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ShopCards>
                        </div>
                    </TabPanel>

                    {/* Services Tab Panel */}
                    <TabPanel className="focus:outline-none">
                        <div className="grid md:grid-cols-1 gap-8">
                            <ShopCards>
                                <div className='flex'>
                                    <div className='flex flex-col ml-2 gap-1'>
                                        <h2 className='text-2xl font-bold text-gray-800 '>Services</h2>
                                        <p className='text-md text-gray-600'>Services Built Around Your Needs</p>
                                    </div>
                                    <ServiceModal userData={userData} supplierData={shop} />
                                </div>
                                {!services?.length > 0 && (
                                    <span className='text-lg text-gray-400 my-10 mt-15 block text-center'>No Service</span>
                                )}
                                {services && (
                                    <div className="grid md:grid-cols-2 gap-6 mt-5">
                                        {services?.map((services, index) => (
                                            <div
                                                key={index}
                                                className={`h-100 relative flex flex-col bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 shadow-lg`}
                                            >
                                                <LoadingOverlay isLoading={isDeleting} message='Processing..' />

                                                <button
                                                    onClick={() => handleDelete(services)}
                                                    className="block absolute right-[-10px] top-[-15px] px-4 py-2 bg-gray-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-200"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <div>
                                                    <div className="rounded-t-md bg-blue-600 text-white">
                                                        <h3 className="font-bold text-2xl text-center py-5">{services.service_plan.label}</h3>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <p className="text-gray-900 text-2xl font-bold leading-relaxed mt-3">
                                                            ₱{services.service_price}.0/service
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-between gap-3 h-full space-x-4">

                                                    <div className="text-left px-6 mt-3">
                                                        {services?.service_inclusions?.map((inclusion, index) => (
                                                            <div className="flex gap-3 space-y-3" key={index}>
                                                                <Check className="text-green-400" />
                                                                <span className="flex text-sm text-gray-600" >{inclusion}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div>
                                                        <div className="px-6 text-left">
                                                            <hr className="border-b-0 border-gray-400 mb-1" />
                                                            <span className="text-left text-sm text-gray-600">Note: {services.service_payment_notice.label}</span>
                                                        </div>

                                                    </div>
                                                </div>

                                                <div className="pt-6 pl-2 py-2 mr-2">
                                                    <ServiceEdit supplierData={shop} service_id={services.id} services={services} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ShopCards>
                        </div>
                    </TabPanel>

                    {/* Reviews Tab Panel */}
                    <TabPanel className="focus:outline-none">
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
                                            <p className="text-sm text-gray-500">{reviews.length} reviews</p>
                                        </div>
                                    </div>
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review, index) => {
                                            const reviewerProfile = userProfiles.find(
                                                profile => profile.id === review.user_id
                                            )
                                            const reviewerDetail = users.find(user => user.id === review.user_id)

                                            return (
                                                <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0">
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
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            size={16}
                                                                            className={`${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm text-gray-500">{review?.created_at ? formatDistanceToNow(new Date(review.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}</span>
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
                                    </div>
                                )}
                            </ShopCards>
                        </div>
                    </TabPanel>
                </TabPanels >
            </TabGroup >
        </>
    )
}