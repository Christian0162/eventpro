import { CalendarDays, Star, PhilippinePeso, ShieldCheck, Calendar, ReceiptText, BarChart3, ChartNoAxesCombined, CircleAlert } from "lucide-react"
import { TabGroup, TabPanel, TabPanels, TabList, Tab } from "@headlessui/react"
import { PieChart, BarChart } from "../../components/Charts"
import { Title } from "react-head"
import { useFetchContract } from "../../hooks/useContract"
import { useEffect, useMemo, useState } from "react"
import { useFetchEventsById } from "../../hooks/useEvents"
import { useFetchSuppliers } from "../../hooks/useSupplier"
import { useFetchTransactionById } from "../../hooks/useTransaction"
import PageLoading from "../../components/PageLoading"
import { useFetchReviews } from "../../hooks/useReviews"
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react"
import GenerateReport from "../../components/GeneraeReport"
import { lazy, Suspense } from "react";
import LoadingOverlay from "../../components/LoadingOverlay"
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { statusStyles } from "../../constants/categories"
import { Review } from "../../components/ReviewModal"

export default function EventDashboard({ userData }) {

    const EventModal = useMemo(() => lazy(() => import("../../components/EventModal")), [])
    const ContractModal = useMemo(() => lazy(() => import("../../components/ContractModal")), []);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null)
    const { contracts, isLoading: isContractsLoading } = useFetchContract()
    const { events, isLoading: isEventLoading } = useFetchEventsById(userData?.id)
    const { suppliers, isLoading: isSuppliersLoading } = useFetchSuppliers()
    const { transactions, isLoading: isTransactionsLoading } = useFetchTransactionById(userData?.id)
    const { reviews, isLoading: isReviewsLoading } = useFetchReviews()
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [barEventData, setBarEventData] = useState({
        labels: [],
        planned: [],
        actual: []
    });

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

    const getRandomColor = () => {
        const colors = [
            "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#f472b6", "#4ade80"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };


    useEffect(() => {
        const eventLabels = events.map(event => event.event_name);

        const supplierDatasets = suppliers.filter(s => approvedContracts.some(c => s.id === c.supplier_id)).map(supplierId => {
            const supplierContract = approvedContracts?.find(c => c.supplier_id === supplierId.id && c.status === "Approved");

            const supplier = suppliers.find(s => s.id === supplierContract?.supplier_id)
            console.log(supplierContract?.supplier_id)

            return {
                label: supplier?.supplier_type.label,
                data: events.map(event =>
                    event.id === supplierContract?.event_id
                        ? supplierContract?.service_plan?.service_price || 0
                        : 0
                ),
                backgroundColor: getRandomColor(),
                borderRadius: 10,
                stack: "Actual Spending"
            };
        });

        // Add planned budget dataset
        const plannedDataset = {
            label: "Planned Budget",
            data: events.map(event => Number(event.event_budget) || 0),
            backgroundColor: "#60a5fa",
            borderRadius: 10,
            stack: "Planned"
        };

        setBarEventData({
            labels: eventLabels,
            datasets: [plannedDataset, ...supplierDatasets]
        });

    }, [events, transactions, suppliers]);



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

    const eventsByType = useMemo(() => {
        const result = {};

        events.forEach(event => {
            const type = event.event_type?.label || "Unknown";
            const budget = Number(event.event_budget || 0);

            if (!result[type]) {
                result[type] = { count: 0, totalBudget: 0 };
            }

            result[type].count += 1;
            result[type].totalBudget += budget;
        });

        return result;
    }, [events]);

    const pieChartData = useMemo(() => {
        const labels = Object.keys(eventsByType);
        const dataValues = Object.values(eventsByType).map(e => e.totalBudget);

        const backgroundColors = [
            "#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#34d399"
        ].slice(0, labels.length);

        const borderColors = backgroundColors.map(color => color);

        return { labels, dataValues, backgroundColors, borderColors };
    }, [eventsByType]);

    const AppliedColor = (status) => {

        const colors = {
            Approved: 'bg-green-100',
            Pending: 'bg-yellow-100',
            Reject: 'bg-red-100',
        }
        return colors[status]
    }

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
                <>
                    <Title>Dashboard</Title>
                    {/* Header Section */}
                    <div>
                        <div className="flex justify-between items-baseline">
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-5">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                        Event Dashboard
                                    </h1>
                                    <p className="text-gray-600 text-sm sm:text-base mt-1">
                                        Welcome back, <span className="font-semibold text-gray-800">{userData?.first_name}</span>
                                    </p>
                                </div>
                            </div>

                            <GenerateReport
                                title="Planner Event Summary Report"
                                filename={`${userData.first_name}_Event_Report`}
                                userData={userData}
                                fields={fields}
                                sections={sections}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mb-5">
                            {userData.role !== 'Supplier' && (userData.verification_status === 'unverified' || userData.verification_status === 'rejected') && (
                                <a href='/verify' className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors text-center">
                                    Verify Account
                                </a>
                            )}

                            {userData?.verification_status === 'pending' && (
                                <span className="px-4 py-2 bg-yellow-400 text-white text-sm font-medium rounded-lg text-center">
                                    Pending
                                </span>
                            )}

                            {userData?.status === 'verified' && (
                                <span className="px-4 py-2 border-2 flex items-center justify-center gap-2 border-green-400 text-green-400 text-sm font-medium rounded-lg">
                                    Verified <ShieldCheck className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards - Modern Style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {[
                            { title: "Active Contracts", value: activeContracts.length, icon: ReceiptText, color: "from-blue-500 to-blue-600" },
                            { title: "Upcoming Events", value: totalUpcomingsEvents, icon: CalendarDays, color: "from-green-500 to-green-600" },
                            { title: "Rated Suppliers", value: reviewedSuppliers.length, icon: Star, color: "from-yellow-500 to-yellow-600" },
                            { title: "Budget Spent", value: transactions.reduce((sum, trans, i) => sum + trans.amount, 0).toFixed(2), icon: PhilippinePeso, color: "from-violet-500 to-violet-600" },
                        ].map(({ title, value, icon: Icon, color }, i) => (
                            <div
                                key={i}
                                className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group overflow-hidden"
                            >
                                {/* Glow effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${color} transition-opacity duration-300`} />

                                {/* Content */}
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <p className="text-sm text-gray-500">{title}</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
                                    </div>
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r ${color} shadow-md`}>
                                        <Icon className="text-white w-6 h-6" />
                                    </div>
                                </div>

                            </div>
                        ))}

                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

                        {/* Pie Chart - Supplier Distribution */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                            <div className="mb-4 sm:mb-6">
                                <div className="w-full lg:w-auto">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 /> Budget Allocation</h3>
                                </div>
                            </div>

                            <div className="mb-4 sm:mb-6 flex justify-center">
                                <div className="w-full max-w-[250px] mt-5">
                                    <PieChart
                                        className="w-full h-64"
                                        labels={pieChartData.labels || []}
                                        dataValues={pieChartData.dataValues || []}
                                        backgroundColors={pieChartData.backgroundColors || []}
                                        borderColors={pieChartData.borderColors || []}
                                        title="Event Budget Distribution by Type"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {pieChartData.labels.map((label, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: pieChartData.backgroundColors[idx] }}></div>
                                            <span className="text-sm text-gray-600">{label}</span>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {((pieChartData.dataValues[idx] / pieChartData.dataValues.reduce((sum, value) => sum + value, 0)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar Chart - Supplier Category Comparison */}
                        <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                            <div className="flex flex-col lg:flex-row justify-between items-start mb-4 sm:mb-6 gap-4">
                                <div className="w-full lg:w-auto">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ChartNoAxesCombined /> Budget Utilization</h3>
                                </div>

                            </div>
                            <div className="mt-4 sm:mt-6 overflow-x-auto">
                                <div className="min-w-[300px]">
                                    <BarChart
                                        className="h-96 w-full"
                                        labels={barEventData.labels || []}
                                        datasets={barEventData.datasets || []}
                                        title="Budget vs Actual Spending per Supplier"
                                        xLabel="Events"
                                        yLabel="Amount"
                                    />

                                </div>
                            </div>
                        </div>
                    </div>

                    <TabGroup className={'mt-5 bg-white border border-gray-200 rounded-2xl shadow-md p-3 transition-all'}>
                        <TabList className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                            {["Upcoming events", "Supplier Bookings", "Calendar"].map((tab, i) => (
                                <Tab
                                    key={i}
                                    className="rounded-full px-5 py-2 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-100 data-[selected]:bg-gradient-to-r data-[selected]:from-blue-500 data-[selected]:to-blue-600 data-[selected]:text-white shadow-sm transition-all"
                                >
                                    {tab}
                                </Tab>
                            ))}
                        </TabList>

                        {/* Upcoming events */}
                        <TabPanels className={'rounded-xl border border-gray-300 bg-white shadow-xl'}>
                            <TabPanel>
                                {events.length ? (
                                    <div className={`space-y-3 p-3 ${events.length > 2 && 'h-[250px]'} overflow-y-auto`}>
                                        {events.map((event) => (
                                            <div key={event.id} className="p-4 flex justify-between items-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all shadow-lg">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{event.event_name}</p>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Date: {event.event_date?.date_value || "TBA"}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => openEventModal(event)}
                                                    className={`"h-9 text-white hover:bg-blue-700 transition-all duration-100 rounded-md px-4 py-2 bg-blue-600 text-sm`}
                                                >
                                                    View Event
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-10">No upcoming events.</p>
                                )}
                            </TabPanel>

                            {/* Supplier Booking */}
                            <TabPanel>
                                <div className="p-2 flex flex-col gap-3">
                                    {bookingContracts.map((offers, index) => (
                                        <div key={index}>
                                            <div className={`flex flex-col sm:flex-row gap- sm:gap-2 justify-between ${AppliedColor(offers.status)} shadow-gray-200 shadow-lg items-start sm:items-center p-3 sm:py-4 rounded-lg sm:px-5`}>
                                                <div className="flex items-start sm:items-center space-x-3 flex-1">
                                                    <Calendar size={20} className="sm:size-6 text-blue-600 bg-gray-200 rounded-full h-8 w-8 sm:h-9 sm:w-9 p-1.5 sm:p-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                                                            Supplier name: {contractSuppliers[offers.supplier_id].supplier_name}
                                                        </span>

                                                        <span className="text-gray-500 text-xs sm:text-sm">
                                                            Applied: {offers.created_at.toDate().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => openContractModal({
                                                        supplierData: contractSuppliers[offers.supplier_id],
                                                        eventData: eventContracts.find(e => e.id === offers.event_id),
                                                        supplier_id: offers.supplier_id,
                                                        user_id: userData.id,
                                                        userData: userData,
                                                        event_id: offers.event_id,
                                                    })}
                                                    className={'transition-all duration-100 hover:bg-blue-700 self-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white '}
                                                >
                                                    View Contract
                                                </button>

                                            </div>
                                        </div>
                                    ))}

                                    {bookingContracts.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                            <span className="block font-semibold">No applied bookings.</span>
                                        </div>
                                    )}
                                </div>
                            </TabPanel>

                            {/* Calendar */}
                            < TabPanel >
                                <div className="p-3 sm:p-6 lg:p-10">
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[300px]">
                                            <FullCalendar
                                                plugins={[dayGridPlugin]}
                                                initialView="dayGridMonth"
                                                height="auto"
                                                aspectRatio={window.innerWidth < 768 ? 1 : 1.35}
                                                headerToolbar={{
                                                    left: 'prev,next',
                                                    center: 'title',
                                                    right: window.innerWidth < 640 ? '' : 'today'
                                                }}
                                                titleFormat={window.innerWidth < 640 ? { month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' }}
                                                events={events.map(e => ({
                                                    title: e.event_name,
                                                    date: e.event_date?.date_value,
                                                    extendedProps: { ...e } // pass the full event data
                                                }))}
                                                eventClick={(info) => {
                                                    openEventModal(info.event.extendedProps); // open your EventModal
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel >
                        </TabPanels>
                    </TabGroup>

                    {/* Recent Contracts Sidebar */}
                    < div className="lg:col-span-1 mt-5" >
                        <div className="bg-white border border-gray-300 shadow-xl rounded-xl p-6 flex flex-col h-full">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="p-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full"><ReceiptText size={20} /></div> Recent Contract History</h3>

                            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                                {contractHistory.slice(0, 5).map((contract, index) => {
                                    const supplier = suppliers.find(s => s.id === contract.supplier_id)
                                    const event = events.find(e => e.id === contract.event_id)

                                    return (
                                        <div
                                            key={contract.id}
                                            className="p-3 rounded-lg border flex justify-between items-center border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">
                                                    {supplier.supplier_name.charAt(0).toUpperCase() + supplier.supplier_name.slice(1) || "Untitled Event"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {contract.created_at?.toDate().toLocaleDateString([], {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[contract.status.toLowerCase()]}`}>
                                                    {contract.status}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openContractModal({
                                                        supplierData: supplier,
                                                        eventData: event,
                                                        supplier_id: contract.supplier_id,
                                                        user_id: userData.id,
                                                        userData: userData,
                                                        event_id: contract.event_id,
                                                    })}
                                                    className={'transition-all duration-100 hover:bg-blue-700 self-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white '}
                                                >
                                                    View Contract
                                                </button>
                                                {contract.status === "Completed" && (
                                                    <>
                                                        {reviews.find(rev => rev.reviewed_id === contract.supplier_id && rev.user_id === contract.planner_id && contract.event_id === rev.event_id) ? (
                                                            <span className="text-white py-1 px-4 rounded-md text-sm flex items-center bg-gray-400">Reviewed</span>
                                                        ) : (
                                                            <Review reviewed_id={contract?.supplier_id} reviewer_name={supplier.supplier_name} contractData={contract} />
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                        </div>
                                    )
                                })}

                                {contractHistory.length === 0 && (
                                    <p className="text-center text-gray-500 text-md pb-5 pt-3">No recent ended contracts</p>
                                )}
                            </div>
                        </div>
                    </div >

                </>
            )}
        </>
    )
}
