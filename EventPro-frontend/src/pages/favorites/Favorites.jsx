import { Title } from "react-head";
import Cards from "../../components/Cards";
import { MapPin, Clock, Star, DollarSign, MessageCircleMore, Heart, Trash, CalendarDays, CircleDollarSign, Users, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetchFavorites } from "../../hooks/useFavorites";
import { useFetchSuppliers } from "../../hooks/useSupplier";
import { useFetchSupplierServices } from "../../hooks/useSupplier";
import { useFetchReviews } from "../../hooks/useReviews";
import { useFetchContract } from "../../hooks/useContract";
import { useFetchAllTransaction } from "../../hooks/useTransaction";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import LoadingOverlay from "../../components/LoadingOverlay";
import { useFetchEvents } from "../../hooks/useEvents";
import Swal from "sweetalert2";
import { useFetchSupplierById } from "../../hooks/useSupplier";
import ClipLoader from "react-spinners/ClipLoader";
import PageLoading from "../../components/PageLoading";
import { lazy, Suspense } from "react";
import { eventStatusStyles } from "../../constants/categories";
import { useMemo } from "react";

export default function Favorites({ userData }) {

    const EventModal = useMemo(() => lazy(() => import("../../components/EventModal")), [])
    const SupplierModal = lazy(() => import("../../components/SupplierModal"));
    const { favorites, isLoading: isFavoritesLoading } = useFetchFavorites()
    const { suppliers } = useFetchSuppliers()
    const { services } = useFetchSupplierServices()
    const { contracts } = useFetchContract()
    const [applications, setApplications] = useState([])
    const [isApplying, setIsApplying] = useState(false)
    const [applyingEventId, setApplyingEventId] = useState(null)
    const { reviews, isLoading: isReviewLoading } = useFetchReviews()
    const { transactions } = useFetchAllTransaction()
    const { events } = useFetchEvents()
    const { supplier, isLoading: isSupplierLoading } = useFetchSupplierById(userData.id)
    const [isCreatingFavorites, setIsCreatingFavorites] = useState(false)
    const [isCreatingContact, setIsCreatingContact] = useState(false)
    const [likedEvents, setLikedEvents] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedShop, setSelectedShop] = useState(null)
    const navigate = useNavigate()

    const isAllLoading = isReviewLoading || isSupplierLoading || isFavoritesLoading

    const favoritesEvents = events.filter(event =>
        favorites.some(fav => event.id === fav.event_id)
    )

    const userShop = suppliers.find(s => s.id === userData.id)

    const userFavorites = favorites.filter(favorite => favorite.user_id === userData.id)
    const activeSuppliers = suppliers.filter(supplier => supplier.is_verified && supplier.status === "active" && services.some(serv => serv.supplier_id === supplier.id))

    const shop = activeSuppliers.filter(shop => {
        return userFavorites.some(favorite => shop.id === favorite.supplier_id)
    })

    // Fix: Check if applications exist for debugging
    console.log("Applications:", applications)
    console.log("Supplier verification status:", supplier?.is_verified)

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "favorites"), (snapshot) => {
            const userFavorites = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.user_id === userData.id) {
                    userFavorites[data.event_id] = data.isActive;
                }
            });
            setLikedEvents(userFavorites);
        });

        return () => unsubscribe();
    }, [userData.id]);

    const handleApply = async (event_id, user_id) => {
        setIsApplying(true)
        setApplyingEventId(event_id)

        Swal.fire({
            title: 'Confirm Application',
            text: "Are you sure you want to apply for this event?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Apply',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await addDoc(collection(db, "applications"), {
                        supplier_id: userData.id,
                        event_id: event_id,
                        applied_at: serverTimestamp(),
                        status: 'Pending'
                    })

                    await addDoc(collection(db, "notifications"), {
                        avatar: userData.id.charAt(0).toUpperCase(),
                        message: `The supplier "${supplier.supplier_name}" applied to your event.`,
                        created_at: serverTimestamp(),
                        sender_id: supplier.id,
                        referenced_type: 'event',
                        referenced_id: event_id,
                        title: 'You have a new application for your event.',
                        unread: true,
                        receiver_id: user_id
                    })

                    Swal.fire('Applied!', 'Your application has been submitted.', 'success');
                } catch (e) {
                    Swal.fire('Error!', 'Failed to apply. Please try again.', 'error');
                    console.error("Apply error:", e);
                } finally {
                    setIsApplying(false)
                    setApplyingEventId(null)
                }
            } else {
                setIsApplying(false)
                setApplyingEventId(null)
            }
        });
    }

    const handleFavorites = async (e, event) => {
        e.preventDefault();
        setIsCreatingFavorites(true);

        try {
            const eventLiked = likedEvents[event.id] || false;

            if (eventLiked) {
                const q = query(collection(db, "favorites"),
                    where("user_id", "==", userData.id),
                    where("event_id", "==", event.id)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async docSnapshot => {
                    await deleteDoc(doc(db, "favorites", docSnapshot.id));
                });

                setLikedEvents(prev => ({ ...prev, [event.id]: false }));
            } else {
                await addDoc(collection(db, "favorites"), {
                    user_id: userData.id,
                    event_id: event.id,
                    isActive: true,
                    created_at: serverTimestamp(),
                });

                setLikedEvents(prev => ({ ...prev, [event.id]: true }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingFavorites(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "applications"), (onsnapshot) => {
            const applications = onsnapshot.docs.map(app => ({ id: app.id, ...app.data() }))
            setApplications(applications)
        })

        return () => unsubscribe()
    }, [userData])

    const handleChat = async (e, event_id, event_name) => {
        e.preventDefault()
        setIsCreatingContact(true)
        try {
            const q = query(collection(db, "contacts"),
                where("user_id", "==", userData.id),
                where("contact_id", "==", event_id)
            )

            const querySnapShot = await getDocs(q)

            if (querySnapShot.empty) {
                await addDoc(collection(db, "contacts"), {
                    user_id: userData.id,
                    contact_id: event_id,
                    name: event_name,
                    avatar: event_name.slice(0, 1).toUpperCase(),
                    last_message: "",
                    isActive: false,
                    unread: false,
                    created_at: serverTimestamp()
                })
                navigate(`/chats/${supplier.id}`)
            } else {
                navigate(`/chats/${supplier.id}`)
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

    const handleDelete = async (favoriteId) => {
        try {
            await deleteDoc(doc(db, "favorites", favoriteId));
            Swal.fire('Deleted!', 'Favorite has been removed.', 'success');
        } catch (error) {
            console.error("Error deleting favorite:", error);
            Swal.fire('Error!', 'Failed to delete favorite.', 'error');
        }
    }

    const calculateAverageRating = (shopId) => {
        const shopReviews = reviews.filter(r => r.reviewed_id === shopId) || [];
        const validRatings = shopReviews
            .map(review => Number(review.rating))
            .filter(rating => !isNaN(rating) && rating > 0);

        if (validRatings.length === 0) return "N/A";

        const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
        return average.toFixed(1);
    };

    const getReviewCount = (shopId) => {
        const shopReviews = reviews.filter(r => r.reviewed_id === shopId) || [];
        return shopReviews.length;
    };


    const openModal = (supplier) => {
        setSelectedShop(supplier)
        setIsModalOpen(true)
    };

    const closeModal = () => {
        setIsModalOpen(false)
    };

    const openEventModal = (event) => {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
        setIsEventModalOpen(false);
    };

    return (
        <>
            <Title>Favorites</Title>
            {isAllLoading && (
                <PageLoading />
            )}

            {(isCreatingContact || isCreatingFavorites) && (
                <LoadingOverlay isLoading={isCreatingContact || isCreatingFavorites} message="Processing..." />
            )}

            {isEventModalOpen && selectedEvent && (
                <Suspense fallback={<LoadingOverlay isLoading={true} message="Pleasee waitt.." />}>
                    <EventModal
                        isOpen={isEventModalOpen}
                        onClose={closeEventModal}
                        userData={userData}
                        eventData={selectedEvent}
                        event_purpose={'dashboard'}
                    />

                </Suspense>
            )}

            {!isAllLoading && (
                <>
                    <div className={`flex flex-col mb-5`}>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Favorites</h1>
                        <span className="mt-2 text-gray-600">Look at your favorite {userData.role === "Supplier" ? 'events' : 'suppliers'}</span>
                    </div>

                    {userData.role === "Event Planner" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {shop.map((shopItem, index) => {
                                const averageRating = calculateAverageRating(shopItem.id);
                                const reviewCount = getReviewCount(shopItem.id);
                                const userServices = services.filter(serv => serv.supplier_id === shopItem.id)

                                return (
                                    <Cards key={shopItem.id || index} className="group cursor-pointer">
                                        {/* Image */}

                                        <div className="relative">
                                            {applications.some(app =>
                                                app.supplier_id === shopItem.id &&
                                                events.some(event => event.id === app.event_id)
                                            ) && (
                                                    <div className="absolute top-3 left-3 z-10 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-green-700">
                                                        Applied
                                                    </div>
                                                )}

                                            <div className="relative overflow-hidden">
                                                {shopItem.supplier_background_image.length > 0 && (
                                                    <img
                                                        src={shopItem?.supplier_background_image}
                                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                                        alt={`${shopItem.supplier_name} background`}
                                                    />
                                                )}
                                                {shopItem.supplier_background_image.length === 0 && (
                                                    <div className="w-full h-48 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1">
                                                    <Star className="text-yellow-400 fill-current" size={14} />
                                                    <span className="text-sm font-semibold">{averageRating}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                                                    {shopItem.supplier_name}
                                                </h3>

                                                {/* Location */}
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <MapPin className="text-gray-400" size={16} />
                                                    <span className="text-gray-600 text-sm">{shopItem.supplier_location}</span>
                                                </div>

                                                <div className="flex items-center space-x-1 mb-4">
                                                    <Clock className="text-gray-400" size={16} />
                                                    <span className="text-sm text-gray-600">{shopItem.supplier_availability}</span>
                                                </div>

                                                {/* Categories */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {shopItem?.supplier_expertise?.map((expertise, expertiseIndex) => (
                                                        <span
                                                            key={expertiseIndex}
                                                            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                                                        >
                                                            {expertise}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Price and Hours */}
                                                <div className="flex justify-between items-center mb-5">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-lg font-bold text-gray-900">₱{userServices[0]?.service_price}</span>
                                                        <span className="text-sm text-gray-500">/day</span>
                                                    </div>
                                                </div>

                                                {/* Reviews */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center space-x-1">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={
                                                                        i < Math.floor(averageRating !== "N/A" ? parseFloat(averageRating) : 0)
                                                                            ? "text-yellow-400 fill-current"
                                                                            : "text-gray-300"
                                                                    }
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    onClick={() => openModal({
                                                        supplierData: shopItem,
                                                        services: userServices,
                                                        reviews: reviews.filter(
                                                            (r) => r.reviewed_id === shopItem.id
                                                        ),
                                                        averageRating,
                                                    })}
                                                    className="py-2 rounded-lg font-semibold w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </Cards>
                                );
                            })}

                            {isModalOpen && selectedShop && (
                                <Suspense fallback={<LoadingOverlay isLoading={true} message="Pleasee waitt.." />}>
                                    <SupplierModal
                                        isOpen={isModalOpen}
                                        onClose={closeModal}
                                        supplierData={selectedShop?.supplierData}
                                        services={selectedShop?.services}
                                        reviews={selectedShop?.reviews}
                                        userData={userData}
                                        averageRating={selectedShop?.averageRating}
                                    />
                                </Suspense>
                            )}
                        </div>
                    ) : (
                        <>
                            {events?.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
                                    {favoritesEvents.map((events, index) => {

                                        const now = new Date();
                                        const eventDate = new Date(events?.event_date?.date_value);
                                        const eventContracts = contracts.filter(cont => cont.event_id === events.id && cont.status === "Approved")

                                        const eventEndTime = events?.event_time?.valueStartAndEnd[1] || "00:00"
                                        const [eventHour, eventMinute] = eventEndTime.split(":").map(Number)

                                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
                                        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                                        eventDay.setHours(eventHour, eventMinute, 0, 0)

                                        const isAllContractPaid = eventContracts.some(cont => {
                                            const contractTransaction = transactions?.filter(t => t.contract_id === cont.id)
                                            const eventTransactions = contractTransaction?.reduce((sum, trans) => sum + (trans.amount - trans.process_fee), 0)

                                            return cont.service_plan.service_price === eventTransactions
                                        })

                                        let status = {
                                            label: '',
                                            value: ''
                                        };

                                        if (events.event_categories.length === 0) {
                                            status = { label: 'Planning', value: 'planning' };
                                        } else if (events.event_categories.length > 0 && eventContracts.length === 0 && now !== eventDate) {
                                            status = { label: 'Open', value: 'open' };
                                        } else if (eventContracts.length > 0 && now <= eventDate) {
                                            status = { label: 'In Progress', value: 'in_progress' };
                                        } else if (!isAllContractPaid) {
                                            status = { label: 'Payment Pending', value: 'payment_pending' };
                                        } else {
                                            status = { label: 'Completed', value: 'completed' };
                                        }

                                        console.log(status.value)

                                        return (
                                            <div key={index} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
                                                <div className="p-6 flex-grow">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className={`inline-block px-3 py-1 text-sm rounded-full ${eventStatusStyles[status.value]}`}>
                                                            {status.label}
                                                        </span>
                                                        <div className="flex items-center gap-2 -mr-2">
                                                            {userData.role === "Supplier" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openEventModal(events)}
                                                                    >
                                                                        <CircleAlert size={24} className='transition-all duration-200 text-gray-400 hover:text-blue-600' />
                                                                    </button>
                                                                    <button onClick={(e) => handleChat(e, events.user_id, events.event_name)} className='p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors'>
                                                                        <MessageCircleMore size={20} />
                                                                    </button>
                                                                    <button onClick={(e) => handleFavorites(e, events)} className='p-2 rounded-full hover:bg-slate-100 transition-colors'>
                                                                        <Heart
                                                                            className={`transition-all duration-200 ${likedEvents[events.id] ? 'fill-red-500 text-red-500' : 'text-slate-500 group-hover:text-red-500'}`}
                                                                            size={20}
                                                                        />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {userData.role === "Event Planner" && eventContracts.length === 0 && (
                                                                <button onClick={() => handleDelete(events.id)} className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100">
                                                                    <Trash size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-2xl font-bold text-slate-800 truncate mb-4" title={events.event_name}>{events.event_name}</h3>

                                                    <div className="space-y-4 mb-5 text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex-shrink-0 bg-blue-100 text-blue-600 h-8 w-8 rounded-lg flex items-center justify-center"><CalendarDays size={18} /></span>
                                                            <span className="text-slate-700 font-medium">{events?.event_date?.date_preview?.join(", ")} at {events?.event_time?.previewStartAndEnd}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex-shrink-0 bg-green-100 text-green-600 h-8 w-8 rounded-lg flex items-center justify-center"><MapPin size={18} /></span>
                                                            <span className="text-slate-600">{events.event_location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex-shrink-0 bg-yellow-100 text-yellow-600 h-8 w-8 rounded-lg flex items-center justify-center"><CircleDollarSign size={18} /></span>
                                                            <span className="text-slate-800 font-bold">₱ {Number(events.event_budget).toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-slate-600 text-sm break-words line-clamp-3 mb-5">{events.event_description || "No description provided."}</p>

                                                    <div>
                                                        <div className="flex gap-2 items-center mb-3">
                                                            <Users className="text-slate-500 h-4 w-4" />
                                                            <span className="text-sm font-semibold text-slate-700">Looking for suppliers:</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {events.event_categories?.filter(c => c?.label).length > 0 ? (
                                                                events.event_categories.map((category, index) => {
                                                                    const eventSuppliers = suppliers.filter(s => eventContracts.some(c => c.supplier_id === s.id))
                                                                    const isTagExistOnSupplier = eventSuppliers[index]?.supplier_type?.label === category.label
                                                                    return (
                                                                        <span key={index} className={`px-2.5 py-1 flex gap-1 items-center ${isTagExistOnSupplier ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'} text-xs font-medium rounded-full`}>
                                                                            {category.label}
                                                                            {isTagExistOnSupplier && (<CircleCheck size={15} />)}
                                                                        </span>
                                                                    )
                                                                })
                                                            ) : (
                                                                <span className="text-slate-500 text-xs italic">No specific supplier categories listed.</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto">
                                                    {userData.role === "Event Planner" && (
                                                        <a href={`/events/edit/${events.id}`} className="block text-center w-full bg-blue-600 text-white font-semibold rounded-lg py-2.5 hover:bg-blue-700 transition-colors">
                                                            Manage Event
                                                        </a>
                                                    )}
                                                    {userData.role === "Supplier" && (
                                                        !isSupplierLoading ? (
                                                            userShop?.supplier_name && userShop.length !== 0 ? (
                                                                <button
                                                                    onClick={() => handleApply(events.id, events.user_id)}
                                                                    disabled={
                                                                        applications.find(app => app.event_id === events.id)?.status === "Pending" ||
                                                                        applications.find(app => app.event_id === events.id)?.status === "Approved" ||
                                                                        (isApplying && applyingEventId === events.id) ||
                                                                        !userShop?.is_verified || !events.event_categories.some(cat => cat.label === userShop?.supplier_type.label)
                                                                    }
                                                                    className={`flex items-center justify-center gap-2 text-center py-2 w-full ${applications.find(app => app.event_id === events.id)?.status === "Pending" ||
                                                                        applications.find(app => app.event_id === events.id)?.status === "Approved"
                                                                        ? 'bg-blue-300 cursor-not-allowed'
                                                                        : (isApplying && applyingEventId === events.id)
                                                                            ? 'bg-blue-400 cursor-not-allowed'
                                                                            : !userShop?.is_verified
                                                                                ? 'bg-blue-400 cursor-not-allowed'
                                                                                : !events.event_categories.some(cat => cat.label === userShop?.supplier_type.label) ? 'bg-blue-400 cursor-not-allowed' :
                                                                                    'bg-blue-600 hover:bg-blue-700'
                                                                        } text-white font-bold rounded-lg`}
                                                                >
                                                                    {isApplying && applyingEventId === events.id ?
                                                                        <>
                                                                            <ClipLoader size={16} color="#ffffff" />
                                                                            Applying...
                                                                        </> :
                                                                        applications.find(app => app.event_id === events.id)?.status === "Pending" ? 'Pending' :
                                                                            applications.find(app => app.event_id === events.id)?.status === "Approved" ? 'Approved' :
                                                                                !userShop?.is_verified ? 'Account not verified' : !events.event_categories.some(cat => cat.label === userShop?.supplier_type.label) ? 'Your shop isn’t eligible for this event.' : 'Apply'}
                                                                </button>
                                                            ) : (
                                                                <Link to="/shop" className="w-full block py-2 mt-2 text-center bg-gray-200 hover:bg-blue-600 hover:text-white rounded-lg transition">{userShop?.supplier_name.length === 0 ? 'Need shop to apply' : 'Services required to apply'} </Link>
                                                            )
                                                        ) : (
                                                            <div className="flex items-center justify-center w-full py-2 mt-2 bg-blue-400 rounded-lg">
                                                                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="ml-2 text-white font-medium">Processing...</span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )

                                    })
                                    }
                                </div>

                            )}
                        </>
                    )}
                </>
            )}

            {!isFavoritesLoading && (
                <>
                    {userData.role === "Event Planner" ? (
                        shop.length === 0 && (
                            <div className="flex justify-center text-xl items-center py-[10rem] text-gray-500">
                                No favorite suppliers found.
                            </div>
                        )
                    ) : (
                        favoritesEvents.length === 0 && (
                            <div className="flex justify-center text-xl items-center py-[10rem] text-gray-500">
                                No favorite events found.
                            </div>
                        )
                    )}
                </>
            )}
        </>
    )
}