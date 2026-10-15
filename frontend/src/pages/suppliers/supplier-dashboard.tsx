import type { LegacyProps } from "@/types/firestore";
import { PhilippinePeso, CalendarPlus, Calendar, Star, ChartNoAxesCombined, Package } from "lucide-react"
import { Title } from "react-head"
import { where, query, collection, serverTimestamp, addDoc, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import { useFetchReviews } from "../../hooks/use-reviews"
import EventCalendar from "@/components/molecules/event-calendar"
import { useFetchContract } from "../../hooks/use-contract"
import { useFetchEvents } from "../../hooks/use-events"
import { useFetchSupplierById, useFetchSuppliers, useFetchSupplierServices } from "../../hooks/use-supplier"
import { useMemo } from "react";
import Swal from "sweetalert2"
import { Review } from "@/components/organisms/review-modal"
import { useFetchUserProfiles } from "../../hooks/use-profile"
import PageLoading from "@/components/atoms/page-loading"
import { useFetchDeliveries } from "../../hooks/use-deliveries"
import { useFetchTransactionById } from "../../hooks/use-transaction"
import { useFetchAllApplication } from "../../hooks/use-application"
import GenerateReport from "@/components/organisms/generate-report"
import { lazy, Suspense } from "react";
import LoadingOverlay from "@/components/atoms/loading-overlay"
import { statusStyles } from "../../constants/categories"
import { useFetchUsers } from "../../hooks/use-users"
import { formatDistanceToNow } from "date-fns"
import ProfileHover from "@/components/molecules/profile-hover"
import { Panel, PanelEmpty, StatTile, ProgressCard, DonutStat, AlertList, type AlertItem, TONE_CYCLE, daysUntil, daysLeftLabel } from "@/components/molecules/dashboard-panels"

export default function SupplierDashboard({ userData }: LegacyProps) {

    const EventModal = useMemo(() => lazy(() => import("@/components/organisms/event-modal")), [])
    const { reviews: reviewed } = useFetchReviews()
    const { contracts } = useFetchContract()
    const { events, isLoading: isEventLoading } = useFetchEvents()
    const { services } = useFetchSupplierServices()
    const { supplier, isLoading: isSupplierLoading } = useFetchSupplierById(userData.id)
    const { suppliers, isLoading: isSuppliersLoading } = useFetchSuppliers()
    const { users } = useFetchUsers()
    const [now] = useState(new Date())
    const { userProfiles } = useFetchUserProfiles()
    const { deliveries, isLoading: isDeliveriesLoading } = useFetchDeliveries()
    const { transactions, isLoading: isTransactionLoading } = useFetchTransactionById(userData.id)
    const { applications: userApplications, isLoading: isApplicationLoading } = useFetchAllApplication()
    const ContractModal = useMemo(() => lazy(() => import("@/components/organisms/contract-modal")), []);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null)
    const [hoveredReviewerId, setHoveredReviewerId] = useState(null);

    const StarRating = ({ rating }: LegacyProps) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating
                            ? 'fill-orange-400 text-orange-400'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const applications = userApplications.filter(app => app.supplier_id === userData.id &&
        contracts.some(cont => cont.supplier_id === app.supplier_id && cont.event_id === app.event_id && (cont.status !== 'Completed' && cont.status !== 'Cancelled')))

    const isAllLoading = isSupplierLoading || isEventLoading || isDeliveriesLoading || isSuppliersLoading || isTransactionLoading || isApplicationLoading

    const userDeliveries = deliveries.filter(del => del.supplier_id === userData.id)


    // price competitive 
    const suppliersWithSameType = suppliers.filter(sup => sup.supplier_type?.value === supplier.supplier_type?.value && sup.id != userData.id)
    const supplierSameTypeServices = services.filter(serv => suppliersWithSameType.some(supp => serv.supplier_id === supp.id))
    const avgPrice = supplierSameTypeServices.length
        ? supplierSameTypeServices.reduce((sum, s) => sum + parseFloat(s.service_price || 0), 0) /
        supplierSameTypeServices.length
        : 0;

    const price = parseFloat(supplier?.service_price || 0);

    console.log("price:", price)
    const competitiveness = avgPrice
        ? ((avgPrice - price) / avgPrice) * 100
        : 0;

    const earningTransactions = transactions.filter(trans => trans.type === "CREDIT")

    const totalEarning = earningTransactions.reduce((sum, transaction) => sum + transaction.amount || 0, 0)

    // ontime deliveries
    const onTimeDeliveries = userDeliveries.filter(
        d => {
            const deliveredDate = d.delivered_date?.toDate ? d.delivered_date.toDate() : new Date(d.delivered_date)
            const plannedDate = d.planned_date?.toDate ? d.planned_date.toDate() : new Date(d.planned_date)

            return deliveredDate && plannedDate && deliveredDate < plannedDate
        }
    ).length;
    const totalDeliveries = userDeliveries.length;
    const onTimeRate = totalDeliveries ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    // Group competitor services by plan
    const competitorServicesByPlan = suppliersWithSameType.flatMap(sup =>
        supplierSameTypeServices.filter(serv => serv.supplier_id === sup.id)
    ).reduce((acc, service) => {
        const plan = service.service_plan?.value || 'unknown';
        if (!acc[plan]) acc[plan] = [];
        acc[plan].push(parseFloat(service.service_price || 0));
        return acc;
    }, {});

    console.log("compiasd:", competitorServicesByPlan)


    // Assuming your supplier has multiple plans
    const supplierPlans = services.filter(s => s.supplier_id === userData.id) || []; // e.g., [{ label: "Basic", value: "basic", price: 2500 }, { label: "Premium", value: "premium", price: 5000 }]

    const competitivenessPerPlan = supplierPlans.map(plan => {
        const competitorPrices = competitorServicesByPlan[plan.service_plan?.value] || [];
        const avgCompetitorPrice = competitorPrices.length
            ? competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
            : 0;

        const competitiveness = avgCompetitorPrice
            ? ((avgCompetitorPrice - plan.service_price) / avgCompetitorPrice) * 100
            : 0;


        return {
            plan: plan.service_plan.label,
            myPrice: plan.service_price,
            avgCompetitorPrice,
            competitiveness: competitiveness.toFixed(1) // as percentage
        };
    });

    console.log("peste", competitivenessPerPlan)

    const totalAppliedEvents = applications.filter(app => app.status === 'Pending').length

    const reviews = reviewed.filter(rev => rev.reviewed_id === userData.id)

    const pendingContracts = useMemo(() =>
        contracts.filter(contract => contract?.status === "Pending" && contract.supplier_id === userData.id),
        [contracts]);

    const activeContracts = useMemo(() =>
        contracts.filter(contract => contract?.status === "Approved" && contract.supplier_id === userData.id),
        [contracts, userData.id]);

    const activeEventsContracts = useMemo(() =>
        events.filter(event => activeContracts.some(cont => event.id === cont.event_id)),
        [events, activeContracts])

    const contractHistory = useMemo(() => contracts.filter(contract => (contract?.status === "Completed" || contract?.status === "Cancelled") && contract.supplier_id === userData.id), [contracts, userData.id])

    console.log(contractHistory)

    const contractEventsforPending = useMemo(() =>
        pendingContracts.map(contract =>
            events.find(event => event.id === contract.event_id)
        ).filter(Boolean),
        [pendingContracts, events]);

    const contractEventsforActive = useMemo(() =>
        activeContracts.map(contract =>
            events.find(event => event.id === contract.event_id)
        ).filter(Boolean),
        [activeContracts, events]);

    const monthlyRatings = Array(12).fill(null).map((_, i) => {
        const monthlyReviews = reviews?.filter(rev => {
            const date = rev.created_at?.toDate ? rev.created_at.toDate() : null;
            return date && date.getMonth() === i;
        });

        if (monthlyReviews.length === 0) return 0;
        const avg = monthlyReviews.reduce((sum, rev) => sum + rev.rating, 0) / monthlyReviews.length;
        return avg;
    });

    console.log(monthlyRatings)



    useEffect(() => {

        const sendDeliveryNotif = async () => {

            for (let i = 0; i < activeContracts.length; i++) {
                const contract = activeContracts[i];
                const eventData = contractEventsforActive[i];

                if (!supplier?.id || !contract?.id) return;


                if (!eventData?.event_date?.date_value) break;

                const eventDate = new Date(eventData.event_date.date_value);

                const twoDaysBeforeEvent = new Date(eventDate);
                twoDaysBeforeEvent.setDate(eventDate.getDate() - 2);

                console.log(twoDaysBeforeEvent)

                const isTwoDaysBefore =
                    now.getFullYear() === twoDaysBeforeEvent.getFullYear() &&
                    now.getMonth() === twoDaysBeforeEvent.getMonth() &&
                    now.getDate() === twoDaysBeforeEvent.getDate();

                if (isTwoDaysBefore) {
                    const notifQuery = query(
                        collection(db, "notifications"),
                        where("referenced_id", "==", contract.id),
                        where("receiver_id", "==", supplier?.id),
                        where("referenced_type", "==", "contract"),
                        where("reminder_type", "==", "2days_before")
                    );
                    const notifSnap = await getDocs(notifQuery);
                    if (notifSnap.empty) {
                        Swal.fire({
                            title: "Upcoming Delivery Reminder",
                            text: `Your delivery for "${eventData.event_name}" is in 2 days!`,
                            icon: "info",
                            confirmButtonText: "Got it",
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: supplier.supplier_name.charAt(0).toUpperCase(),
                            message: `Reminder: Delivery for contract ID: ${contract.id} ("${eventData.event_name}") is due in 2 days.`,
                            created_at: serverTimestamp(),
                            title: "2-Day Delivery Reminder",
                            referenced_type: 'contract',
                            referenced_id: contract.id,
                            unread: true,
                            receiver_id: supplier?.id,
                            reminder_type: '2days_before',
                        });

                        console.log("Notification created for 2-day reminder:", contract.id);
                    } else {
                        console.log("Notification already exists for this 2-day reminder.");
                    }
                }

                const isSameDay =
                    now.getFullYear() === eventDate.getFullYear() &&
                    now.getMonth() === eventDate.getMonth() &&
                    now.getDate() === eventDate.getDate();

                console.log('is sameday', isSameDay)

                if (isSameDay) {
                    const notifQuery = query(
                        collection(db, "notifications"),
                        where("referenced_id", "==", contract.id),
                        where("receiver_id", "==", supplier?.id),
                        where("referenced_type", "==", "contract"),
                        where("reminder_type", "==", "same_day")
                    );
                    const notifSnap = await getDocs(notifQuery);
                    if (notifSnap.empty) {
                        Swal.fire({
                            title: "Delivery Reminder",
                            text: `Today is the delivery day for "${eventData.event_name}"!`,
                            icon: "info",
                            confirmButtonText: "Got it",
                        });
                        await addDoc(collection(db, "notifications"), {
                            avatar: supplier.supplier_name.charAt(0).toUpperCase(),
                            message: `Today is the delivery day for contract ID: ${contract.id} with supplier "${eventData.event_name}".`,
                            created_at: serverTimestamp(),
                            title: "Delivery Day Reminder",
                            referenced_type: 'contract',
                            referenced_id: contract.id,
                            unread: true,
                            receiver_id: supplier?.id,
                            reminder_type: 'same_day'
                        });
                        console.log("Notification created for delivery day:", contract.id);
                    } else {
                        console.log("Notification already exists for this delivery day.");
                    }
                }
            }
        };

        sendDeliveryNotif();
    }, [activeContracts, contractEventsforActive, now, supplier?.id, supplier?.supplier_name]);

    const openContractModal = (contract) => {
        setSelectedContract(contract)
        setIsContractModalOpen(true)
    };

    const openEventModal = (event) => {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
        setIsEventModalOpen(false);
    };

    const closeContractModal = () => {
        setIsContractModalOpen(false)
        setSelectedContract(null)
    };


    const upcomingList = activeEventsContracts
        .map(event => ({ event, days: daysUntil(event.event_date?.date_value) }))
        .filter(item => item.days !== null && item.days >= 0)
        .sort((a, b) => a.days - b.days)

    const applicationStatusData = [
        { name: "Approved", value: applications.filter(a => a.status === "Approved").length, tone: "green" as const },
        { name: "Pending", value: applications.filter(a => a.status === "Pending").length, tone: "amber" as const },
        { name: "Rejected", value: applications.filter(a => a.status !== "Approved" && a.status !== "Pending").length, tone: "pink" as const },
    ]

    const overviewStats = [
        { title: "On-Time Delivery", value: onTimeRate.toFixed(0) + "%", icon: Package, tone: "blue" as const },
        ...competitivenessPerPlan.map(p => ({
            title: `${p.plan} Price Competitiveness`,
            value: p.competitiveness + "%",
            icon: ChartNoAxesCombined,
            tone: "amber" as const,
        })),
        { title: "Total Earnings", value: `₱${totalEarning.toLocaleString()}`, icon: PhilippinePeso, tone: "green" as const },
        { title: "Applied Events", value: totalAppliedEvents, icon: CalendarPlus, tone: "violet" as const },
    ]

    const contractRow = (contract, event, label: string) => (
        <li key={contract.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event?.event_name || "Untitled Event"}</p>
                    <p className="text-xs text-muted-foreground">
                        {label} {contract.created_at?.toDate()?.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </div>
            <button
                onClick={() => openContractModal({
                    supplierData: supplier,
                    eventData: event,
                    supplier_id: contract.supplier_id,
                    user_id: userData.id,
                    userData: userData,
                    event_id: contract.event_id,
                })}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
                View
            </button>
        </li>
    )

    const alerts: AlertItem[] = [
        ...pendingContracts.map(c => ({
            id: `offer-${c.id}`,
            text: "New offer awaiting your response",
            detail: events.find(e => e.id === c.event_id)?.event_name,
            level: "warning" as const,
        })),
        ...upcomingList
            .filter(({ days }) => days <= 7)
            .map(({ event, days }) => ({
                id: `soon-${event.id}`,
                text: `Delivery ${daysLeftLabel(days).toLowerCase()}`,
                detail: event.event_name,
                level: "info" as const,
            })),
        ...contractHistory
            .filter(c => c.status === "Completed" && !reviewed.some(r => r.reviewed_id === c.planner_id && r.user_id === c.supplier_id && r.event_id === c.event_id))
            .map(c => ({
                id: `review-${c.id}`,
                text: "Review your planner",
                detail: events.find(e => e.id === c.event_id)?.event_name,
                level: "success" as const,
            })),
    ]

    return (
        <>
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

            {isAllLoading ? (
                <PageLoading />
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {userData?.first_name}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Here's how your shop is performing.</p>
                        </div>

                        <GenerateReport
                            title="Supplier Performance Report"
                            filename={`${userData.first_name}_Supplier_Report`}
                            userData={userData}
                            fields={[
                                { label: "Total Earnings", value: `${totalEarning.toFixed(2)}` },
                                { label: "On-Time Delivery Rate", value: `${onTimeRate.toFixed(2)}%` },
                                { label: "Price Competitiveness", value: `${competitiveness.toFixed(2)}%` },
                                { label: "Total Applied Events", value: totalAppliedEvents.toFixed(2) },
                            ]}
                            sections={[
                                {
                                    title: "Monthly Ratings",
                                    head: ["Month", "Average Rating"],
                                    body: monthlyRatings.map((rating, i) => [
                                        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
                                        rating ? rating.toFixed(1) : "N/A",
                                    ]),
                                },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {overviewStats.map(stat => (
                            <StatTile key={stat.title} {...stat} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <Panel title="Calendar">
                        <EventCalendar events={activeEventsContracts} userId={userData?.id} onSelectEvent={openEventModal} />
                    </Panel>
                        <Panel title="Offers" count={pendingContracts.length}>
                            {pendingContracts.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {pendingContracts.map((offer, i) => contractRow(offer, contractEventsforPending[i], "Applied"))}
                                </ul>
                            ) : (
                                <PanelEmpty>No offers found.</PanelEmpty>
                            )}
                        </Panel>
                            <Panel title="Applications">
                                <DonutStat data={applicationStatusData} centerValue={applications.length} centerLabel="applied" />
                            </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <Panel title="Upcoming Deliveries" count={upcomingList.length} className="xl:col-span-2">
                            {upcomingList.length ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcomingList.slice(0, 6).map(({ event, days }, i) => (
                                        <ProgressCard
                                            key={event.id}
                                            title={event.event_name}
                                            daysLeft={daysLeftLabel(days)}
                                            tone={TONE_CYCLE[i % TONE_CYCLE.length]}
                                            onClick={() => openEventModal(event)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <PanelEmpty>No upcoming deliveries.</PanelEmpty>
                            )}
                        </Panel>
                            <Panel title="Alerts" count={alerts.length}>
                                <AlertList items={alerts} />
                            </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <Panel title="Active Contracts" count={activeContracts.length}>
                            {activeContracts.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {activeContracts.map((contract, i) => contractRow(contract, contractEventsforActive[i], "Signed"))}
                                </ul>
                            ) : (
                                <PanelEmpty>No contracts found.</PanelEmpty>
                            )}
                        </Panel>
                        <Panel title="Applied Events" count={applications.length}>
                            {applications.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {applications.map((app) => (
                                        <li key={app.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                    <Calendar className="size-5" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {events.find((ev) => ev.id === app.event_id)?.event_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Applied {app.applied_at?.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[app.status?.toLowerCase()] ?? "bg-red-100 text-red-700"}`}>
                                                {app.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <PanelEmpty>No applications found.</PanelEmpty>
                            )}
                        </Panel>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <Panel title="Recent Contract History">
                            {contractHistory.length ? (
                                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {contractHistory.slice(0, 5).map((contract) => {
                                        const event = events.find(e => e.id === contract.event_id)

                                        return (
                                            <li key={contract.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{event?.event_name || "Untitled Event"}</p>
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
                                                        reviewed.find(rev => rev.reviewed_id === contract.planner_id && rev.user_id === contract.supplier_id && contract.event_id === rev.event_id) ? (
                                                            <span className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">Reviewed</span>
                                                        ) : (
                                                            <Review reviewed_id={contract?.planner_id} reviewer_name={supplier.supplier_name} contractData={contract} />
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
                        <Panel title="Reviews" count={reviews.length}>
                            {reviews.length ? (
                                <ul className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                                    {reviews.map((rev, i) => {
                                        const reviewerProfile = userProfiles.find(profile => profile.id === rev.user_id)
                                        const reviewerDetail = users.find(user => user.id === rev.user_id)

                                        return (
                                            <li key={i} className="rounded-xl bg-muted/60 p-4">
                                                <div className="flex items-start gap-3">
                                                    {reviewerProfile?.profile_pic ? (
                                                        <img
                                                            loading="lazy"
                                                            src={reviewerProfile.profile_pic}
                                                            alt="Reviewer"
                                                            className="size-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                                                            {rev.reviewer_name?.[0]?.toUpperCase() || "A"}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div
                                                                className="relative"
                                                                onMouseEnter={() => setHoveredReviewerId(rev.id)}
                                                                onMouseLeave={() => setHoveredReviewerId(null)}
                                                            >
                                                                <div className="flex items-baseline gap-3">
                                                                    <h3 className="cursor-pointer text-sm font-medium">
                                                                        {reviewerDetail?.first_name} {reviewerDetail?.last_name}
                                                                    </h3>
                                                                    <p className="text-xs text-muted-foreground">{rev?.created_at ? formatDistanceToNow(new Date(rev.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}</p>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {reviewerDetail?.role === "Event Planner" ? 'Event' : 'Shop'}: {rev.reviewer_name}
                                                                </p>
                                                                {hoveredReviewerId === rev.id && (
                                                                    <ProfileHover hoveredReviewer={reviewerProfile} user={reviewerDetail} review={rev} />
                                                                )}
                                                            </div>
                                                            <StarRating rating={rev.rating} />
                                                        </div>
                                                        <p className="mt-2 text-sm">{rev.comment}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <PanelEmpty>No reviews yet.</PanelEmpty>
                            )}
                        </Panel>
                    </div>
                </div>
            )}
        </>
    )
}  
