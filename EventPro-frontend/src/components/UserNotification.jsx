import { useMemo, useState } from "react"
import { useFetchNotificationsById } from "../hooks/useNotifications"
import { BellDot, X, Check, Settings, MessageSquare } from "lucide-react";
import { db } from "../firebase/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Link } from "react-router-dom";
import { Dialog, DialogPanel } from "@headlessui/react";
import { formatDistanceToNow } from "date-fns";
import { useFetchEvents } from "../hooks/useEvents";
import { useFetchContract } from "../hooks/useContract";
import { useFetchSuppliers } from "../hooks/useSupplier";
import { useFetchAllReports } from "../hooks/useReports";
import { ReportReview } from "./ReviewModal";
import { lazy, Suspense } from "react";
import LoadingOverlay from "./LoadingOverlay";

export default function UserNotification({ userData }) {

    const EventModal = useMemo(() => lazy(() => import("./EventModal")), [])
    const [isOpen, setIsOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedNotif, setSelectedNotif] = useState(null)
    const { notifications } = useFetchNotificationsById(userData?.id)
    const [isLoading, setIsLoading] = useState(false)
    const [isReading, setIsReading] = useState(false)
    const { events } = useFetchEvents()
    const { contracts } = useFetchContract()
    const { suppliers } = useFetchSuppliers()
    const [selectedItem, setSelectedItem] = useState(null);
    const { reports } = useFetchAllReports()
    const ContractModal = useMemo(() => lazy(() => import("./ContractModal")), []);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const unreadCount = notifications.filter(notification => notification.unread).length

    // console.log(notifications)

    const markAsRead = async (id) => {
        await updateDoc(doc(db, "notifications", id), {
            unread: false
        })
    }

    // console.log(selectedItem)

    const markAllAsRead = async () => {
        const unread = notifications.filter(notification => notification.unread)

        setIsReading(true)
        try {
            for (const updateUnread of unread) {
                await updateDoc(doc(db, "notifications", updateUnread.id), {
                    unread: false
                })
            }
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsReading(false)

        }
    }

    const handleNotifClick = (notification) => {
        markAsRead(notification.id);
        setSelectedNotif(notification);

        // Determine the referenced item (event or contract)
        if (notification.referenced_type === "event") {
            const matchedEvent = events.find(e => e.id === notification.referenced_id);
            if (matchedEvent) {
                setSelectedItem({ type: 'event', data: matchedEvent });
            }
        } else if (notification.referenced_type === "contract") {
            const matchedContract = contracts.find(c => c.id === notification.referenced_id);
            if (matchedContract) {
                const eventData = events.find(event => event.id === matchedContract?.event_id)
                const supplierData = suppliers.find(sup => sup.id === matchedContract?.supplier_id)
                setSelectedItem({ type: "contract", contract: matchedContract, supplier: supplierData, event: eventData });
            }
        } else if (notification.referenced_type === "report") {
            const userReport = reports.find(r => r.id === notification.referenced_id)
            setSelectedItem({ type: "report", report: userReport, userData: userData })
        } else if (notification.referenced_type === "verification") {
            setSelectedItem({ type: "verification", verification: notification.referenced_id, userData: userData })
        } else {
            setSelectedItem(null);
        }
        setModalOpen(true);
    }


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

    const close = () => {
        setModalOpen(false)
        setSelectedItem(null)
    }

    console.log('asdasdasd', selectedItem)

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

            {/* Notification button */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault()
                            setIsOpen(false)
                        }
                    }}
                    className="relative transition-all duration-200 focus:outline-none focus:bg-blue-50 focus:text-blue-700 focus:shadow-sm focus:ring-2 focus:ring-blue-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-full text-sm flex items-center justify-center group"
                >
                    {unreadCount > 0 && !isReading && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                    <BellDot size={20} />
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Panel */}
                        <div className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    {!isLoading && unreadCount > 0 && (
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors duration-150"
                                            title="Mark all as read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors duration-150"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <BellDot size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-500 font-medium">No notifications</p>
                                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {!isLoading ? (
                                            notifications.map((notification, index) => (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => (handleNotifClick(notification), setIsOpen(false))}
                                                    className={`relative cursor-pointer hover:bg-gray-50 px-4 py-3 transition-colors duration-150 border-l-4 ${notification.unread
                                                        ? 'border-transparent bg-white'
                                                        : 'border-blue-500 bg-blue-50/30'
                                                        } ${index !== notifications.length - 1 ? 'border-b border-gray-100' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            {notification.unread && (
                                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`text-sm font-medium ${notification.unread ? 'text-gray-700' : 'text-gray-900'} truncate`}>
                                                                {notification.title}
                                                            </h4>
                                                            <p className={`text-sm mt-1 ${notification.unread ? 'text-gray-500' : 'text-gray-700'} line-clamp-2`}>
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-xs text-gray-400">
                                                                    {notification?.created_at?.toDate()?.toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                                {!notification.unread && (
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex justify-center items-center h-[300px]">
                                                <div className="h-10 w-10 rounded-full border border-t-blue-600 animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="border-t border-gray-100 p-3">
                                    <Link to={'/notification'} className="w-full text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2">
                                        <Settings size={14} />
                                        View All Notifications
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Notification Modal */}
            <Dialog as="div" open={modalOpen} onClose={() => close()} className="relative z-[50]">
                <div className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel
                        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 mt-15 relative transition-all"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => close()}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                        >
                            <X size={18} className="text-gray-600" />
                        </button>

                        {selectedNotif && (
                            <div className="text-center">
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                    <MessageSquare size={28} className="text-blue-600" />
                                </div>

                                {/* Title + Time */}
                                <h2 className="text-lg font-semibold text-gray-900">{selectedNotif.title}</h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(selectedNotif.created_at.seconds * 1000), { addSuffix: true })}
                                </p>

                                {/* Message Section */}
                                <div className="mt-6 text-left">
                                    <h3 className="text-sm font-medium text-gray-800 mb-2">Message</h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 shadow-sm">
                                        {selectedNotif.message || "No message available."}
                                    </div>
                                </div>

                                {/* Feedback Section */}
                                <div className="mt-6 text-left">
                                    <h3 className="text-sm font-medium text-gray-800 mb-2">Feedback</h3>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700 shadow-sm">
                                        {selectedNotif.feedback || "No feedback provided."}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center gap-3">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition"
                                    >
                                        Close
                                    </button>

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
                                            ) : selectedItem.type === "verification" ? (
                                                <a href={`/review/${selectedItem.verification}`} className="cursor-pointer transition-all duration-100 hover:bg-blue-700 self-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white ">View Request</a>
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
                                                </button>

                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    )
}

