import { Dialog, DialogPanel } from '@headlessui/react'
import { useEffect, useState, useMemo } from 'react'
import { deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { X, MessageSquare, Clock } from 'lucide-react'
import { db } from '../firebase/firebase'
import { formatDistanceToNow } from 'date-fns'
import { useFetchUsers } from '../hooks/useUsers'
import { useFetchUserProfiles } from '../hooks/useProfile'
import { useFetchSuppliers } from '../hooks/useSupplier'
import { useFetchEvents } from "../hooks/useEvents";
import { useFetchContract } from "../hooks/useContract";
import { useFetchAllReports } from "../hooks/useReports";
import { ReportReview } from "./ReviewModal";
import { lazy, Suspense } from "react";
import LoadingOverlay from "./LoadingOverlay";

export default function NotificationModal({ notification, userData }) {

    const EventModal = useMemo(() => lazy(() => import("./EventModal")), [])
    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const { users } = useFetchUsers()
    const { userProfiles } = useFetchUserProfiles()
    const { suppliers } = useFetchSuppliers()
    const [senderData, setSenderData] = useState([])
    const { events } = useFetchEvents()
    const { contracts } = useFetchContract()
    const [selectedItem, setSelectedItem] = useState(null);
    const { reports } = useFetchAllReports()
    const ContractModal = useMemo(() => lazy(() => import("./ContractModal")), []);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const selectedUser = users?.find(u => u.id === notification.sender_id)

    useEffect(() => {
        if (selectedUser?.role === "Event Planner") {
            const userProfile = userProfiles?.find(u => u.id === selectedUser?.id)
            setSenderData(userProfile)
        }
        else {
            const supplierProfile = suppliers?.find(s => s.id === selectedUser?.id)
            setSenderData(supplierProfile)
        }
    }, [suppliers, selectedUser, userProfiles])


    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    const updateNotif = async () => {
        await updateDoc(doc(db, "notifications", notification.id), {
            unread: false
        })
    }

    const deleteNotif = async (id) => {
        await deleteDoc(doc(db, "notifications", id))
    }

    const handleNotifClick = () => {
        updateNotif()

        // Determine the referenced item (event or contract)
        if (notification.referenced_type === "event") {
            const matchedEvent = events.find(e => e.id === notification.referenced_id);
            setSelectedItem({ type: 'event', data: matchedEvent });
        } else if (notification.referenced_type === "contract") {
            const matchedContract = contracts.find(c => c.id === notification.referenced_id);
            const eventData = events.find(event => event.id === matchedContract.event_id)
            const supplierData = suppliers.find(sup => sup.id === matchedContract.supplier_id)
            setSelectedItem({ type: "contract", contract: matchedContract, supplier: supplierData, event: eventData });
        } else if (notification.referenced_type === "report") {
            const userReport = reports.find(r => r.id === notification.referenced_id)
            setSelectedItem({ type: "report", report: userReport, userData: userData })
        } else {
            setSelectedItem(null);
        }
    };

    const openContractModal = (contract) => {
        setSelectedContract(contract)
        setIsContractModalOpen(true)
    };

    const closeContractModal = () => {
        setIsContractModalOpen(false)
        setSelectedContract(null)
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
            {isContractModalOpen && selectedContract && (
                <Suspense fallback={<LoadingOverlay isLoading={true} message="Pleasee waitt.." />}>
                    <ContractModal
                        isOpen={isContractModalOpen}
                        onClose={closeContractModal}
                        userData={userData}
                        event_id={selectedContract.event_id}
                        user_id={userData.id}
                        supplier_id={selectedContract.supplier_id}
                        eventData={selectedContract.eventData}
                        supplierData={selectedContract.supplierData}
                    />
                </Suspense>
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

            <button
                onMouseEnter={() => setIsHovered(notification.id)}
                onMouseLeave={() => setIsHovered(null)}
                onClick={() => { updateNotif(); open(); handleNotifClick() }}
                className={`group relative w-full bg-white rounded-xl p-5 text-left shadow-sm border transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${notification.unread
                    ? 'border-l-4 border-l-blue-500 border-slate-200'
                    : 'border-slate-200'
                    }`}
            >
                {/*Unread indicator */}
                {notification.unread && isHovered !== notification.id && (
                    <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                )}

                <div className="flex items-start gap-4">
                    {/* Avatar with icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold bg-gradient-to-tr from-blue-500 to-blue-700 shadow-md">
                        {senderData?.profile_pic || senderData?.supplier_background_image ? (
                            <img src={senderData?.profile_pic || senderData?.supplier_background_image} alt="" className='h-full w-full rounded-full object-cover' />
                        ) : (
                            notification.avatar
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3
                            className={`font-semibold text-base leading-snug ${notification.unread ? 'text-gray-900' : 'text-gray-700'
                                }`}
                        >
                            {notification.title}
                        </h3>
                        <p
                            className={`mt-1 text-sm line-clamp-2 ${notification.unread ? 'text-gray-700' : 'text-gray-500'
                                }`}
                        >
                            {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.created_at.toDate().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                            onClick={() => deleteNotif(notification.id)}
                            className="p-2 block text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </button>

            {/* Modal */}
            <Dialog
                open={isOpen}
                as="div"
                className={'relative z-[49] focus:outline-none'}
                onClose={close}
            >
                {/* Overlay */}
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <DialogPanel
                        className="w-full max-w-2xl relative rounded-2xl bg-white shadow-2xl transform transition-all"
                    >
                        {/* Close button */}
                        <button
                            onClick={close}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} className="text-gray-600" />
                        </button>

                        <div className="p-8">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full shadow-sm mb-4">
                                    <MessageSquare size={28} className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    {notification.title}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {notification.created_at
                                        ? formatDistanceToNow(
                                            new Date(notification.created_at.seconds * 1000),
                                            { addSuffix: true }
                                        )
                                        : 'recent'}
                                </p>
                            </div>

                            {/* Message Section */}
                            <div className="mt-6 text-left">
                                <h3 className="text-sm font-medium text-gray-800 mb-2">Message</h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 shadow-sm">
                                    {notification.message || "No message available."}
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="mt-6 text-left">
                                <h3 className="text-sm font-medium text-gray-800 mb-2">Feedback</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700 shadow-sm">
                                    {notification.feedback || "No feedback provided."}
                                </div>
                            </div>

                            <div className='mt-5 flex justify-center items-center'>
                                {selectedItem && (
                                    <>
                                        {selectedItem.type === "event" ? (
                                            <button
                                                onClick={() => openEventModal(selectedItem.data, userData)}
                                                className={`"h-9 text-white hover:bg-blue-700 transition-all duration-100 rounded-md px-4 py-2 bg-blue-600 text-sm`}
                                            >
                                                View Event
                                            </button>
                                        ) : selectedItem.type === "report" ? (
                                            <ReportReview report={selectedItem?.report} userData={selectedItem.userData} />
                                        ) : (
                                            <button
                                                onClick={() => openContractModal({
                                                    supplierData: selectedItem.supplier,
                                                    eventData: selectedItem.event,
                                                    supplier_id: selectedItem.supplier.id,
                                                    user_id: userData.id,
                                                    userData: userData,
                                                    event_id: selectedItem.event.id,
                                                })}
                                                className={'transition-all duration-100 hover:bg-blue-700 self-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white '}
                                            >
                                                View Contract
                                            </button>)}
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    )
}
