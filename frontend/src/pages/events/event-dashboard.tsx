import type { LegacyProps } from "@/types/firestore";
import { CalendarDays, Star, PhilippinePeso, ShieldCheck, ShieldAlert, Clock, Calendar, ReceiptText } from "lucide-react"
import { Title } from "react-head"
import { useFetchContract } from "../../hooks/use-contract"
import { useEffect, useMemo, useState } from "react"
import { useFetchEventsById } from "../../hooks/use-events"
import { useFetchSuppliers } from "../../hooks/use-supplier"
import { useFetchTransactionById } from "../../hooks/use-transaction"
import PageLoading from "@/components/atoms/page-loading"
import { useFetchReviews } from "../../hooks/use-reviews"
import EventCalendar from "@/components/molecules/event-calendar"
import GenerateReport from "@/components/organisms/generate-report"
import { lazy, Suspense } from "react";
import LoadingOverlay from "@/components/atoms/loading-overlay"
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { statusStyles } from "../../constants/categories"
import { Review } from "@/components/organisms/review-modal"
import { Panel, PanelEmpty, StatTile, ProgressCard, DonutStat, AlertList, type AlertItem, TONE_CYCLE, daysUntil, daysLeftLabel } from "@/components/molecules/dashboard-panels"

export default function EventDashboard({ userData }: LegacyProps) {

    const EventModal = useMemo(() => lazy(() => import("@/components/organisms/event-modal")), [])
    const ContractModal = useMemo(() => lazy(() => import("@/components/organisms/contract-modal")), []);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null)
    const { contracts, isLoading: isContractsLoading } = useFetchContract()
    const { events, isLoading: isEventLoading } = useFetchEventsById(userData?.id)
    const { suppliers, isLoading: isSuppliersLoading } = useFetchSuppliers()
    const { transactions, isLoading: isTransactionsLoading } = useFetchTransactionById(userData?.id)
    const { reviews, isLoading: isReviewsLoading } = useFetchReviews()
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const isAllLoading = isEventLoading || isSuppliersLoading || isTransactionsLoading || isReviewsLoading

    const totalEvents = events.length;
    const approvedContracts = contracts.filter(c => c.status === "Approved" && c.planner_id === userData.id);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : "N/A";

    const fields = [
        { label: "Total Events Organized".toUpperCase(), value: totalEvents.toFixed(2) },
        { label: "Approved Contracts".toUpperCase(), value: approvedContracts.length.toFixed(2) },
        { label: "Total Budget Spent".toUpperCase(), value: `${totalSpent.toFixed(2)}` },
        { label: "Average Supplier Rating".toUpperCase(), value: Number(avgRating).toFixed(2) },
    ];

    let status = {
        label: '',
        value: ''
    };

    const createdEvents = useMemo(() => events.filter(e => e.user_id === userData.id), [events, userData])
    const contractHistory = useMemo(() => contracts.filter(contract => (contract?.status === "Completed" || contract?.status === "Cancelled") && contract.planner_id === userData.id), [contracts, userData.id])

    useEffect(() => {
        const sendEventNotif = async () => {

            for (let i = 0; i < createdEvents.length; i++) {
                const event = createdEvents[i];

                if (!event?.id || !userData?.id) return;

                const now = new Date();
                const eventDate = new Date(event?.event_date?.date_value);

                const eventEndTime = event?.event_time?.valueStartAndEnd[1] || "00:00"
                const [eventHour, eventMinute] = eventEndTime.split(":").map(Number)

                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
                const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
                eventDay.setHours(eventHour, eventMinute, 0, 0)


                const isEventVisible = eventDay < today
                console.log(isEventVisible)

                if (isEventVisible) {
                    const notifQuery = query(
                        collection(db, "notifications"),
                        where("referenced_id", "==", event.id),
                        where("receiver_id", "==", userData?.id),
                        where("referenced_type", "==", "event"),
                        where("reminder_type", "==", "not_visible")
                    );

                    const notifSnap = await getDocs(notifQuery);

                    if (notifSnap.empty) {
                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            message: `The event "${event.event_name}" is no longer visible to the supplier because the scheduled day and time have already passed.`,
                            created_at: serverTimestamp(),
                            title: "Event Visibility Notice",
                            referenced_type: 'event',
                            referenced_id: event.id,
                            unread: true,
                            receiver_id: userData?.id,
                            reminder_type: 'not_visible'
                        });
                    }
                }
            }
        };

        sendEventNotif();
    }, [userData, createdEvents]);

    const reviewedSuppliers = reviews.filter(rev => rev.user_id === userData.id)

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalUpcomingsEvents = events.filter(event => {
        const eventDate = new Date(event.event_date?.date_value);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        const eventContracts = contracts.filter(cont => cont.event_id === event.id && (cont.status !== "Cancelled" || cont.status !== "Rejected    "))

        const isAllContractPaid = eventContracts.some(cont => {
            const contractTransaction = transactions?.filter(t => t.contract_id === cont.id)
            const eventTransactions = contractTransaction?.reduce((sum, trans) => sum + (trans.amount - trans.process_fee), 0)

            return cont.service_plan.service_price === eventTransactions
        })

        if (event.event_categories.length === 0) {
            status = { label: 'Planning', value: 'planning' };
        } else if (event.event_categories.length > 0 && eventContracts.length === 0 && now !== eventDate) {
            status = { label: 'Open', value: 'open' };
        } else if (eventContracts.length > 0 && now <= eventDate) {
            status = { label: 'In Progress', value: 'in_progress' };
        } else if (!isAllContractPaid) {
            status = { label: 'Payment Pending', value: 'payment_pending' };
        } else {
            status = { label: 'Completed', value: 'completed' };
        }
        return eventDay >= today;
    }).length;

    const sections = useMemo(() => [
        {
            title: "Event Summary",
            head: ["Event Name", "Type", "Budget", "Status"],
            body: events.map(e => [
                e.event_name.toUpperCase(),
                e.event_type?.value.toUpperCase() || "N/A",
                `PHP ${(Number(e.event_budget) || 0).toLocaleString()}`,
                status?.label.toUpperCase() || "N/A",
            ]),
        },
    ], [events]);

    const bookingContracts = useMemo(() =>
        contracts.filter(contract => events.some(event => event.id === contract.event_id && (contract.status !== "Completed" && contract.status !== "Cancelled"))),
        [contracts, events]);

    const eventContracts = events.filter(event =>
        bookingContracts.some(cont => cont.event_id === event.id)
    );

    const activeContracts = useMemo(() =>
        contracts.filter(contract => events.some(event => contract?.status === "Approved" && event.id === contract.event_id)),
        [contracts, events]);


    const contractSuppliers = useMemo(() =>
        suppliers.reduce((acc, supplier) => {
            const contract = bookingContracts.find(c => c.supplier_id === supplier.id);
            if (contract) {
                acc[supplier.id] = { ...supplier, contract };
            }
            return acc;
        }, {}),
        [bookingContracts, suppliers]
    );

    const openEventModal = (event) => {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
        setIsEventModalOpen(false);
    };

    const openContractModal = (contract) => {
        setSelectedContract(contract)
        setIsContractModalOpen(true)
    };

    const closeContractModal = () => {
        setIsContractModalOpen(false)
        setSelectedContract(null)
    };

    const upcomingList = events
        .map(event => ({ event, days: daysUntil(event.event_date?.date_value) }))
        .filter(item => item.days !== null && item.days >= 0)
        .sort((a, b) => a.days - b.days)

    const plannerContracts = contracts.filter(c => c.planner_id === userData.id)
    const countByStatus = (...statuses: string[]) => plannerContracts.filter(c => statuses.includes(c.status)).length
    const contractStatusData = [
        { name: "Approved", value: countByStatus("Approved"), tone: "green" as const },
        { name: "Pending", value: countByStatus("Pending"), tone: "amber" as const },
        { name: "Completed", value: countByStatus("Completed"), tone: "blue" as const },
        { name: "Cancelled", value: countByStatus("Cancelled", "Rejected", "Reject"), tone: "pink" as const },
    ]

    const alerts: AlertItem[] = [
        ...plannerContracts
            .filter(c => c.status === "Pending")
            .map(c => ({
                id: `pending-${c.id}`,
                text: `Waiting on ${suppliers.find(s => s.id === c.supplier_id)?.supplier_name ?? "a supplier"} to respond`,
                detail: events.find(e => e.id === c.event_id)?.event_name,
                level: "warning" as const,
            })),
        ...upcomingList
            .filter(({ event }) => !plannerContracts.some(c => c.event_id === event.id && c.status !== "Cancelled" && c.status !== "Rejected"))
            .map(({ event, days }) => ({
                id: `nosup-${event.id}`,
                text: `No supplier booked yet (${daysLeftLabel(days).toLowerCase()})`,
                detail: event.event_name,
                level: "info" as const,
            })),
        ...contractHistory
            .filter(c => c.status === "Completed" && !reviews.some(r => r.reviewed_id === c.supplier_id && r.user_id === c.planner_id && r.event_id === c.event_id))
            .map(c => ({
                id: `review-${c.id}`,
                text: `Review ${suppliers.find(s => s.id === c.supplier_id)?.supplier_name ?? "your supplier"}`,
                detail: events.find(e => e.id === c.event_id)?.event_name,
                level: "success" as const,
            })),
    ]

    const eventProgress = (event) => {
        const needed = event.event_categories?.length || 0
        if (!needed) return 0
        const booked = activeContracts.filter(c => c.event_id === event.id).length
        return (booked / needed) * 100
    }

    return (
        <>
            {isAllLoading && (
                <PageLoading />
            )}

            <Title>Dashboard</Title>

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

            {!isAllLoading && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {userData?.first_name}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your events.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {userData.role !== 'Supplier' && (userData.verification_status === 'unverified' || userData.verification_status === 'rejected') && (
                                <a href='/verify' title="Verify account" aria-label="Verify account" className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200">
                                    <ShieldAlert className="size-5" />
                                </a>
                            )}

                            {userData?.verification_status === 'pending' && (
                                <span title="Verification pending" aria-label="Verification pending" className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Clock className="size-5" /></span>
                            )}

                            {userData?.status === 'verified' && (
                                <span title="Verified" aria-label="Verified" className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <ShieldCheck className="size-5" />
                                </span>
                            )}

                            <GenerateReport
                                title="Planner Event Summary Report"
                                filename={`${userData.first_name}_Event_Report`}
                                userData={userData}
                                fields={fields}
                                sections={sections}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatTile title="Active Contracts" value={activeContracts.length} icon={ReceiptText} tone="blue" />
                        <StatTile title="Upcoming Events" value={totalUpcomingsEvents} icon={CalendarDays} tone="green" />
                        <StatTile title="Rated Suppliers" value={reviewedSuppliers.length} icon={Star} tone="amber" />
                        <StatTile title="Budget Spent" value={`₱${transactions.reduce((sum, trans) => sum + trans.amount, 0).toLocaleString()}`} icon={PhilippinePeso} tone="violet" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <Panel title="Calendar">
                        <EventCalendar events={events} userId={userData?.id} onSelectEvent={openEventModal} />
                    </Panel>
                    <Panel title="Supplier Bookings" count={bookingContracts.length}>
                            {bookingContracts.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {bookingContracts.map((offers) => {
                                        const supplier = contractSuppliers[offers.supplier_id]
                                        return (
                                            <li key={offers.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                        <Calendar className="size-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">{supplier?.supplier_name ?? "Supplier"}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Applied {offers.created_at?.toDate().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[offers.status?.toLowerCase()] ?? ''}`}>
                                                        {offers.status}
                                                    </span>
                                                    <button
                                                        onClick={() => openContractModal({
                                                            supplierData: supplier,
                                                            eventData: eventContracts.find(e => e.id === offers.event_id),
                                                            supplier_id: offers.supplier_id,
                                                            user_id: userData.id,
                                                            userData: userData,
                                                            event_id: offers.event_id,
                                                        })}
                                                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <PanelEmpty>No applied bookings.</PanelEmpty>
                            )}
                        </Panel>
                            <Panel title="Contracts">
                                <DonutStat data={contractStatusData} centerValue={plannerContracts.length} centerLabel="contracts" />
                            </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <Panel title="Upcoming Events" count={upcomingList.length} className="xl:col-span-2">
                            {upcomingList.length ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcomingList.slice(0, 6).map(({ event, days }, i) => (
                                        <ProgressCard
                                            key={event.id}
                                            title={event.event_name}
                                            daysLeft={daysLeftLabel(days)}
                                            progress={eventProgress(event)}
                                            progressLabel="Suppliers booked"
                                            tone={TONE_CYCLE[i % TONE_CYCLE.length]}
                                            onClick={() => openEventModal(event)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <PanelEmpty>No upcoming events.</PanelEmpty>
                            )}
                        </Panel>
                            <Panel title="Alerts" count={alerts.length}>
                                <AlertList items={alerts} />
                            </Panel>
                    </div>

                        <Panel title="Recent Contract History">
                            {contractHistory.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {contractHistory.slice(0, 5).map((contract) => {
                                        const supplier = suppliers.find(s => s.id === contract.supplier_id)
                                        const event = events.find(e => e.id === contract.event_id)
                                        const supplierName = supplier?.supplier_name || "Untitled supplier"

                                        return (
                                            <li key={contract.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{supplierName.charAt(0).toUpperCase() + supplierName.slice(1)}</p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {contract.created_at?.toDate().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[contract.status.toLowerCase()]}`}>
                                                        {contract.status}
                                                    </span>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        onClick={() => openContractModal({
                                                            supplierData: supplier,
                                                            eventData: event,
                                                            supplier_id: contract.supplier_id,
                                                            user_id: userData.id,
                                                            userData: userData,
                                                            event_id: contract.event_id,
                                                        })}
                                                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
                                                    >
                                                        View
                                                    </button>
                                                    {contract.status === "Completed" && (
                                                        reviews.find(rev => rev.reviewed_id === contract.supplier_id && rev.user_id === contract.planner_id && contract.event_id === rev.event_id) ? (
                                                            <span className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">Reviewed</span>
                                                        ) : (
                                                            <Review reviewed_id={contract?.supplier_id} reviewer_name={supplier?.supplier_name} contractData={contract} />
                                                        )
                                                    )}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <PanelEmpty>No recent ended contracts</PanelEmpty>
                            )}
                        </Panel>
                </div>
            )}
        </>
    )
}
