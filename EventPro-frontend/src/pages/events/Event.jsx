import { Link } from "react-router-dom";
import { Title } from "react-head";
import { CalendarDays, MapPin, CircleDollarSign, Trash, Users, MessageCircleMore, Heart, CircleCheck, AlertTriangle, CircleAlert } from "lucide-react";
import { db } from "../../firebase/firebase";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, serverTimestamp, addDoc, query, where, doc, getDocs, deleteDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Swal from "sweetalert2";
import { useFetchEvents } from "../../hooks/useEvents";
import { useDeleteEvent } from "../../hooks/useEvents";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../../components/LoadingOverlay";
import { useFetchAllApplication } from "../../hooks/useApplication";
import PageLoading from "../../components/PageLoading";
import { eventStatusStyles } from "../../constants/categories";
import { useFetchContract } from "../../hooks/useContract";
import { useFetchAllTransaction } from "../../hooks/useTransaction";
import { useFetchSuppliers, useFetchSupplierServices } from "../../hooks/useSupplier";


export default function Event({ userData }) {
    const EventModal = useMemo(() => lazy(() => import("../../components/EventModal")), [])
    const [isCreatingFavorites, setIsCreatingFavorites] = useState(false)
    const [isCreatingContact, setIsCreatingContact] = useState(false)
    const [likedEvents, setLikedEvents] = useState({});
    const [allEvents, setAllEvents] = useState([])
    const [isApplying, setIsApplying] = useState(false)
    const [applyingEventId, setApplyingEventId] = useState(null)
    const [filteredEvents, setFilteredEvents] = useState([])
    const { deleteEvent } = useDeleteEvent()
    const [searchTerm, setSearchTerm] = useState("") // 🔹 search state
    const { events, isLoading: isEventLoading } = useFetchEvents()
    const { applications: supplierApplications, isLoading: isApplicationLoading } = useFetchAllApplication()
    const { contracts } = useFetchContract()
    const { transactions } = useFetchAllTransaction()
    const { services } = useFetchSupplierServices()
    const { suppliers, isLoading: isSupplierLoading } = useFetchSuppliers()
    const [showCautionMessage, setShowCautionMessage] = useState(false)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const navigate = useNavigate()

    const applications = supplierApplications.filter(app => app.supplier_id === userData.id)

    const isAllLoading = isEventLoading || isApplicationLoading

    const supplierData = suppliers.find(s => s.id === userData.id)

    const supplierService = services.filter(s => s.supplier_id === supplierData?.id)

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

    useEffect(() => {
        if (userData?.role === "Event Planner") {
            const createdEvents = events.filter(events => events.user_id === userData.id)
            setAllEvents(createdEvents)
        } else {
            const activeEvents = events.filter(events => {
                const now = new Date();
                const eventDate = new Date(events?.event_date?.date_value);

                const eventEndTime = events?.event_time?.valueStartAndEnd[1] || "00:00"
                const [eventHour, eventMinute] = eventEndTime.split(":").map(Number)

                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
                const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                eventDay.setHours(eventHour, eventMinute, 0, 0)

                const isActive = events.status === "active"

                return today < eventDay && isActive
            }
            );
            setAllEvents(activeEvents)
        }
    }, [events, userData])


    useEffect(() => {
        let filtered = allEvents;

        if (searchTerm) {
            filtered = filtered.filter(events =>
                events.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                events.event_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                events.event_categories?.map(c => c.label.toLowerCase()).join(" ").includes(searchTerm.toLowerCase()) || ""
            );
            setFilteredEvents(filtered)
        }

        setFilteredEvents(filtered);
    }, [searchTerm, allEvents]);

    const handleDelete = async (id) => {
        deleteEvent(id)
    }

    const handleFavorites = async (e, events) => {
        e.preventDefault();
        setIsCreatingFavorites(true);

        try {
            const eventLiked = likedEvents[events.id] || false;

            if (eventLiked) {
                const q = query(collection(db, "favorites"),
                    where("user_id", "==", userData.id),
                    where("event_id", "==", events.id)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async docSnapshot => {
                    await deleteDoc(doc(db, "favorites", docSnapshot.id));
                });

                setLikedEvents(prev => ({ ...prev, [events.id]: false }));
            } else {
                await addDoc(collection(db, "favorites"), {
                    user_id: userData.id,
                    event_id: events.id,
                    isActive: true,
                    created_at: serverTimestamp(),
                });

                setLikedEvents(prev => ({ ...prev, [events.id]: true }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingFavorites(false);
        }
    };


    const handleApply = async (event_id, user_id) => {
        setIsApplying(true)
        setApplyingEventId(event_id) // Set the events ID that's being applied to

        Swal.fire({
            title: 'Confirm Application',
            text: "Are you sure you want to apply for this events?",
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
                        message: `The supplier "${supplierData.supplier_name}" applied to your events.`,
                        sender_id: supplierData.id,
                        referenced_type: 'event',
                        referenced_id: event_id,
                        created_at: serverTimestamp(),
                        title: 'You have a new application for your events.',
                        unread: true,
                        receiver_id: user_id
                    })

                    Swal.fire('Applied!', 'Your application has been submitted.', 'success');
                } catch (e) {
                    Swal.fire('Error!', 'Failed to apply. Please try again.', 'error');
                    console.error("Apply error:", e);
                } finally {
                    setIsApplying(false)
                    setApplyingEventId(null) // Reset applying state
                }
            } else {
                setIsApplying(false)
                setApplyingEventId(null) // Reset applying state if cancelled
            }
        });
    }

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
                navigate(`/chats/${supplierData?.id}`)
            } else {
                navigate(`/chats/${supplierData?.id}`)
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
            <Title>Events</Title>

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
                    <div className="flex justify-between md:items-start gap-3 md:gap-3 lg:items-baseline flex-col lg:flex-row md:flex-col">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-5">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Events</h1>
                                {userData.role === "Event Planner" && userData.verification_status === "verified" && (
                                    <Link to={'/events/create'}>
                                        <button className="bg-blue-600 text-white rounded-md px-5 lg:px-8 md:px-8 sm:px-7 py-2 lg:py-2 font-semibold mt-3">Create New Event</button>
                                    </Link>
                                )}
                            </div>
                            <span className="mt-2 text-gray-600">
                                {userData.verification_status === "verified" ?
                                    'Create and manage your events in one place' :
                                    'Verify account to create and manage your events in one place'}
                            </span>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Search events by name, location, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                className="w-full border sm:w-70 md:w-80 border-gray-300  bg-white rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>


                    </div>

                    {events?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
                            {filteredEvents.map((events, index) => {

                                const now = new Date();
                                const eventDate = new Date(events?.event_date?.date_value);
                                const eventContracts = contracts.filter(cont => cont.event_id === events.id && (cont.status !== "Cancelled" || cont.status !== "Rejected"))
                                const eventCompleteContracts = contracts.filter(cont => cont.event_id === events.id && cont.status === "Completed").length

                                const eventEndTime = events?.event_time?.valueStartAndEnd[1] || "00:00"
                                const [eventHour, eventMinute] = eventEndTime.split(":").map(Number)

                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
                                const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                                eventDay.setHours(eventHour, eventMinute, 0, 0)

                                const isAllContractPaid = eventContracts.some((cont, index) => {
                                    const contractTransaction = transactions?.filter(t => t.contract_id === cont.id && t.status === "HOLD")
                                    const eventTransactions = contractTransaction?.reduce((sum, trans) => sum + (trans.amount - trans.process_fee), 0)

                                    // console.log(index, ": ", cont.service_plan.service_price, eventTransactions)

                                    return Number(cont.service_plan.service_price) === eventTransactions
                                })

                                console.log(eventContracts.length === eventCompleteContracts)

                                let status = {
                                    label: '',
                                    value: ''
                                };

                                if (events.event_categories.length === 0) {
                                    status = { label: 'Planning', value: 'planning' };
                                } else if (events.event_categories.length > 0 && eventContracts.length === 0 && today < eventDay) {
                                    status = { label: 'Open', value: 'open' };
                                } else if (eventContracts.length > 0 && today <= eventDay) {
                                    status = { label: 'In Progress', value: 'in_progress' };
                                } else if (!isAllContractPaid && eventContracts.length > 0) {
                                    status = { label: 'Payment Pending', value: 'payment_pending' };
                                } else if (eventContracts.length === eventCompleteContracts && isAllContractPaid) {
                                    status = { label: 'Completed', value: 'completed' };
                                } else {
                                    status = { label: 'Waiting for Completing Contract', value: 'waiting_for_completing_contract' };

                                }

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
                                                            <button onClick={(e) => handleFavorites(e, events)} className=' rounded-full hover:bg-slate-100 transition-colors'>
                                                                <Heart
                                                                    className={`transition-all duration-200 ${likedEvents[events.id] ? 'fill-red-500 text-red-500' : 'text-slate-500 group-hover:text-red-500'}`}
                                                                    size={20}
                                                                />
                                                            </button>
                                                        </>
                                                    )}

                                                    {(status.value === 'completed' || status.value === 'payment_pending') && eventDate < now && (
                                                        <div className="relative inline-block">
                                                            <AlertTriangle className="text-yellow-500 cursor-pointer" size={20}
                                                                onMouseEnter={() => setShowCautionMessage(true)}
                                                                onMouseLeave={() => setShowCautionMessage(false)}
                                                            />
                                                            {showCautionMessage && (
                                                                <span className="absolute z-50 top-7 right-0 hidden w-50  text-sm text-white bg-gray-800 p-3 rounded shadow-md group-hover:block">
                                                                    This event is currently not visible anymore due to specific reasons — either the event time and date have already passed, or it is marked as payment pending or completed.
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            const isTagExistOnSupplier = eventSuppliers.some(
                                                                s => s.supplier_type?.label === category.label
                                                            ); return (
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
                                                    supplierData?.supplier_name && supplierService.length !== 0 ? (
                                                        <button
                                                            onClick={() => handleApply(events.id, events.user_id)}
                                                            disabled={
                                                                applications.find(app => app.event_id === events.id)?.status === "Pending" ||
                                                                applications.find(app => app.event_id === events.id)?.status === "Approved" ||
                                                                (isApplying && applyingEventId === events.id) ||
                                                                !supplierData?.is_verified || !events.event_categories.some(cat => cat.label === supplierData?.supplier_type.label)
                                                            }
                                                            className={`flex items-center justify-center gap-2 text-center py-2 w-full ${applications.find(app => app.event_id === events.id)?.status === "Pending" ||
                                                                applications.find(app => app.event_id === events.id)?.status === "Approved"
                                                                ? 'bg-blue-300 cursor-not-allowed'
                                                                : (isApplying && applyingEventId === events.id)
                                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                                    : !supplierData?.is_verified
                                                                        ? 'bg-blue-400 cursor-not-allowed'
                                                                        : !events.event_categories.some(cat => cat.label === supplierData?.supplier_type.label) ? 'bg-blue-400 cursor-not-allowed' :
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
                                                                        !supplierData?.is_verified ? 'Account not verified' : !events.event_categories.some(cat => cat.label === supplierData?.supplier_type.label) ? 'Your shop isn’t eligible for this event.' : 'Apply'}
                                                        </button>
                                                    ) : (
                                                        <Link to="/shop" className="w-full block py-2 mt-2 text-center bg-gray-200 hover:bg-blue-600 hover:text-white rounded-lg transition">{supplierData?.supplier_name.length === 0 ? 'Need shop to apply' : 'Services required to apply'} </Link>
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

                    {!isAllLoading && filteredEvents?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-[12rem] text-gray-500">
                            <span className="text-2xl mb-4">No events found.</span>
                            {(userData.verification_status === 'unverified' || userData.verification_status === 'rejected') && userData.role !== "Supplier" && (
                                <a href="/verify"
                                    className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors duration-200"
                                >
                                    Verify Account
                                </a>
                            )}
                        </div>
                    )}

                </>
            )
            }
        </>
    );
};
