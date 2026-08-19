import { Button, Dialog, DialogPanel, } from '@headlessui/react'
import { useEffect, useState, useRef } from 'react'
import { X, Check, ArrowLeftRight } from 'lucide-react'
import { FileText, MapPin, Clock, Wallet, ChevronDown, Calendar, Building, User, TriangleAlert, CreditCard, PhilippinePeso, Package } from 'lucide-react'
import { collection, doc, getDocs, query, where, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db, auth } from '../firebase/firebase'
import { paymentMethods, statusStyles } from '../constants/categories'
import { nanoid } from 'nanoid'
import { useCreatePayment } from '../hooks/usePayment'
import { useFetchAllTransaction, useFetchTransactionById } from '../hooks/useTransaction'
import SubmissionModal from './SubmissionModal'
import { useFetchDeliveries } from '../hooks/useDeliveries'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import LoadingOverlay from './LoadingOverlay'
import { RejectReview } from './ReviewModal'
import { useFetchUsers } from '../hooks/useUsers'
import { useFetchContract } from '../hooks/useContract'
import DamagePenaltiesModal from './DamagePenaltiesModal'
import ReportModal from './ReportModal'
import { useFetchAllReports } from '../hooks/useReports'
import PageLoading from './PageLoading'

export default function ContractModal({ isOpen, onClose, userData, event_id, supplier_id, eventData, supplierData, user_id }) {
    const [payment_method, setPayment_method] = useState([])
    const [payment_method_error, setPayment_method_error] = useState('')
    const [contract_transaction, setContract_Transaction] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isProcecssing, setIsProcessing] = useState(false)
    const [isReleasing, setIsReleasing] = useState(false)
    const { createPayment, isProcessing, invoiceUrl } = useCreatePayment()
    const { transactions } = useFetchTransactionById(eventData?.user_id)
    const { transactions: allTransaction } = useFetchAllTransaction()
    const [eventUser, setEventUser] = useState([])
    const { deliveries, isLoading: isDeliveriesLoading } = useFetchDeliveries()
    const { contracts: AllContracts } = useFetchContract()
    const { users } = useFetchUsers()
    const paymentSectionRef = useRef(null);
    const { reports } = useFetchAllReports()
    const navigate = useNavigate()
    const [now, setNow] = useState(new Date())

    const contract = AllContracts.find(contract => contract?.event_id === eventData?.id && contract?.supplier_id === supplierData?.id)

    const contractTransaction = allTransaction.filter(t => t.contract_id === contract?.id && t.event_id === eventData?.id)

    const isAlreadyReported = reports.find(r => r.contract_id === contract?.id && r.user_id === userData?.id && r.report_type !== "delivery")

    const contractDeliveries = deliveries.filter(del => del.contract_id === contract?.id && del.supplier_id === supplier_id)

    const computeTotalDeductions = (delivery, servicePrice) => {
        let totalDeduction = 0;

        if (!Array.isArray(delivery)) return 0; // safety check

        delivery.forEach((d) => {
            if (!Array.isArray(d.penalty_applied) || d.penalty_applied.length === 0) return;

            d.penalty_applied.forEach((penalty) => {
                if (penalty.includes("Late Delivery")) {
                    const planned = d.planned_date ? new Date(d.planned_date) : null;
                    const delivered = d.delivered_at
                        ? d.delivered_at.seconds
                            ? new Date(d.delivered_at.seconds * 1000)
                            : new Date(d.delivered_at)
                        : null;

                    if (!planned || !delivered || isNaN(planned) || isNaN(delivered)) return;

                    // Calculate days late (if any)
                    const diffDays = Math.max(
                        0,
                        Math.ceil((delivered - planned) / (1000 * 60 * 60 * 24))
                    );

                    const perDay = Number(servicePrice) * 0.005; // 0.5% per day
                    const maxDeduction = Number(servicePrice) * 0.5; // Max 20%
                    const lateDeduction = Math.min(diffDays * perDay, maxDeduction);

                    totalDeduction += lateDeduction;
                }

                // 🧾 Service Non-Conformity
                if (penalty.includes("Service Non-Conformity")) {
                    if (penalty.includes("Slight Damage")) {
                        totalDeduction += Number(servicePrice) * 0.05; // 5%
                    } else if (penalty.includes("Badly Damaged")) {
                        totalDeduction += Number(servicePrice) * 0.5; // 50%
                    }
                }
            });
        });

        return totalDeduction;
    };

    const isDownPayment = contract?.service_plan?.service_payment_notice?.label === "Down Payment required atleast 50 percent."
    const platformFee = Number(contract?.service_plan?.service_price) * 0.03
    const service_price = Number(contract?.service_plan?.service_price) || 0;
    const process_fee = payment_method?.process_fee || 0;
    const processFee = isDownPayment ? (service_price / 2) * process_fee : service_price * process_fee;

    const totalDeductions = computeTotalDeductions(contractDeliveries, service_price);

    const filteredTransactions = allTransaction.find(trans => trans.contract_id === contract?.id && trans.type === "CREDIT")

    const fullAmount = Number(contract?.service_plan?.service_price) + processFee
    const netAmount = Number(service_price - platformFee);

    const releasedMoney = Number(filteredTransactions?.amount) || 0

    const finalAmount = Number((netAmount - totalDeductions) - releasedMoney);

    console.log(Number(netAmount - totalDeductions))

    const downpayment = (service_price / 2) + processFee;
    const nextpayment = (service_price / 2) + processFee;

    const total_paid = contract_transaction.reduce((sum, trans) => sum + trans.amount, 0)
    const total_fees = contract_transaction.reduce((sum, trans) => sum + trans.process_fee, 0)

    const not_include_fees = total_paid - total_fees

    const eventDate = new Date(eventData?.event_date?.date_value);

    const eventEndTime = eventData?.event_time?.valueStartAndEnd[1] || "00:00"
    const [eventHour, eventMinute] = eventEndTime.split(":").map(Number)

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    eventDay.setHours(eventHour, eventMinute, 0, 0)

    // Collect and count unique issues
    const issueCount = contractDeliveries
        .flatMap((d) => d.penalty_applied || [])
        .filter((p) => p && p.trim() !== "")
        .reduce((acc, issue) => {
            acc[issue] = (acc[issue] || 0) + 1;
            return acc;
        }, {});


    useEffect(() => {
        const eventUser = users.filter(user => user.id === eventData?.user_id)
        setEventUser(eventUser[0])
    }, [users, eventData, supplierData])

    useEffect(() => {
        const filteredTransaction = transactions.filter(trans => trans.contract_id === contract?.id && trans.status === "HOLD")
        setContract_Transaction(filteredTransaction)
    }, [user_id, transactions, contract])


    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const showSubmitButton = userData?.role === "Supplier";

    const handleDeliveryStatus = async (deliveryId) => {
        Swal.fire({
            title: 'Mark as Received?',
            text: 'Are you sure you want to confirm that this delivery has been received?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                // proceed to mark as received
                const deliveryRef = doc(db, "deliveries", deliveryId);
                await updateDoc(deliveryRef, {
                    status: "Received",
                    confirmed_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });

                await addDoc(collection(db, "notifications"), {
                    avatar: eventData?.event_name?.charAt(0).toUpperCase(),
                    message: `The event planner has confirmed receipt of the delivery for the event "${eventData?.event_name}" under Contract ID: "${contract?.id}".`,
                    created_at: serverTimestamp(),
                    sender_id: eventData?.user_id,
                    referenced_type: 'contract',
                    referenced_id: contract?.id,
                    title: "Delivery Received",
                    unread: true,
                    receiver_id: supplier_id
                });


                Swal.fire({
                    title: 'Delivery Received!',
                    text: 'The delivery has been successfully received. You can now release the payment.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    const handleDeliveryReport = async (reportId, status, deliveryId, reportDetails) => {
        if (status === "Accept") {
            Swal.fire({
                title: "Are you sure?",
                text: "Once you accept this, the penalty will be applied to your payment.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Accept",
                cancelButtonText: "Cancel"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        Swal.fire(
                            "Approved!",
                            "The report has been accept successfully.",
                            "success"
                        );

                        await updateDoc(doc(db, "reports", reportId), {
                            status: "solved",
                            updated_at: serverTimestamp(),
                        })

                        await updateDoc(doc(db, "deliveries", deliveryId), {
                            penalty_applied: reportDetails.penalty_applied,
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: supplierData?.supplier_name.charAt(0).toUpperCase(),
                            message: `The supplier "${supplierData?.supplier_name}" has accepted the report terms on the Contract ID: ${contract?.id}.`,
                            created_at: serverTimestamp(),
                            sender_id: supplierData.id,
                            referenced_type: 'contract',
                            referenced_id: contract?.id,
                            title: "Delivery Report",
                            unread: true,
                            receiver_id: eventData?.user_id
                        });

                    }
                    catch (e) {
                        console.error(e)
                        setIsSubmitting(false)
                    }
                    finally {
                        setIsSubmitting(false)
                    }
                }
            });
        }

        if (status === "Reject") {
            Swal.fire({
                title: "Are you sure?",
                text: "If you reject this, the report will be forwarded to the admin for review and final decision.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Reject",
                cancelButtonText: "Cancel"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        Swal.fire(
                            "Submitted!",
                            "The report has been sent to the admin for review.",
                            "success"
                        );

                        await addDoc(collection(db, "notifications"), {
                            avatar: supplierData?.supplier_name.charAt(0).toUpperCase(),
                            message: `The supplier "${supplierData?.supplier_name}" has rejected the delivery report for Contract ID: ${contract?.id}. The admin will now review and decide on the case.`,
                            created_at: serverTimestamp(),
                            sender_id: supplierData.id,
                            referenced_type: 'contract',
                            referenced_id: contract?.id,
                            title: "Delivery Report Under Review",
                            unread: true,
                            receiver_id: eventData?.user_id
                        });

                    } catch (e) {
                        console.error(e);
                        setIsSubmitting(false);
                    } finally {
                        setIsSubmitting(false);
                    }
                }
            });
        }

    }

    const handleApprove = async (contract_id) => {
        setIsSubmitting(false)

        Swal.fire({
            title: "Are you sure?",
            text: "Once you approve this, the contract will begin and be treated as an approved agreement.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, approve it",
            cancelButtonText: "Cancel"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire(
                        "Approved!",
                        "The contract has been approved successfully.",
                        "success"
                    );

                    await updateDoc(doc(db, "contracts", contract_id), {
                        status: "Approved"
                    })

                    await addDoc(collection(db, "notifications"), {
                        avatar: supplierData?.supplier_name.charAt(0).toUpperCase(),
                        message: `The supplier "${supplierData?.supplier_name}" has approved the contract with ID: ${contract?.id}.`,
                        created_at: serverTimestamp(),
                        sender_id: supplierData.id,
                        referenced_type: 'contract',
                        referenced_id: contract?.id,
                        title: "Contract approved by supplier",
                        unread: true,
                        receiver_id: eventData?.user_id
                    });

                }
                catch (e) {
                    console.error(e)
                    setIsSubmitting(false)
                }
                finally {
                    setIsSubmitting(false)
                }
            }
        });
    }

    const handlePaymentMethod = (method) => {
        if (method !== payment_method) {
            setPayment_method(method)
            setPayment_method_error('')
        }
        else {
            setPayment_method([])
        }
    }

    const handleRelease = async (e, platform_fee) => {
        e.preventDefault()
        setIsReleasing(true)

        const result = await Swal.fire({
            title: 'Release Payment?',
            text: "If you release this, the money will be released to the supplier.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, release it!',
            cancelButtonText: 'Cancel'
        })

        if (result.isConfirmed) {
            try {

                await addDoc(collection(db, "transactions"), {
                    contract_id: contract?.id || null,
                    user_id: supplier_id,
                    payment_method: null,
                    event_id: contract.event_id,
                    event_email: eventUser.email_address,
                    event_contact: eventUser?.contact_number || null,
                    amount: finalAmount,
                    platform_fee: platform_fee,
                    process_fee: 0,
                    type: "CREDIT",
                    status: "COMPLETED",
                    created_at: serverTimestamp()
                })

                await updateDoc(doc(db, 'users', contract.supplier_id), {
                    balance: increment(finalAmount)
                })

                await addDoc(collection(db, "notifications"), {
                    avatar: eventData?.event_name?.charAt(0).toUpperCase(),
                    message: `The Event ${eventData?.event_name} has been completed Contract ID: "${contract?.id}". Your balance will be updated accordingly.`,
                    created_at: serverTimestamp(),
                    referenced_type: 'contract',
                    sender_id: eventData.id,
                    referenced_id: contract?.id,
                    title: 'Contract Completed',
                    unread: true,
                    receiver_id: supplier_id
                })


                // Update contract status
                await updateDoc(doc(db, "contracts", contract?.id), {
                    status: "Completed"
                })

                setIsReleasing(false)


                Swal.fire(
                    'Released!',
                    'The payment has been released to the supplier.',
                    'success'
                )
            } catch (error) {
                console.error(error)
                setIsReleasing(false)

                Swal.fire(
                    'Error!',
                    'Something went wrong while releasing the payment.',
                    'error'
                )
            }
            setIsReleasing(false)
        }
        else {
            setIsReleasing(false)

        }
    }

    const handlePayment = async (downpayment, nextpayment, processingFee) => {
        if (payment_method.length === 0) {

            if (paymentSectionRef.current) {
                paymentSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            return setPayment_method_error("Select Payment Method")
        }

        const payment_data = {
            external_id: nanoid(20),
            contract_id: contract?.id,
            event_name: eventData?.event_name,
            event_id: event_id,
            user_id: user_id,
            payment_method: payment_method.method,
            event_email: eventUser.email_address,
            event_contact: eventUser?.contact_number,
            amount: isDownPayment ? contract_transaction?.length > 0 ? downpayment : nextpayment : fullAmount,
            process_fee: processingFee
        }


        try {
            setPayment_method_error('')
            await createPayment(payment_data, supplierData)
        }

        catch (e) {
            console.error(e)
        }

    }

    const handleChat = async (e) => {
        e.preventDefault();
        setIsProcessing(true)
        try {
            const targetId = userData?.role === "Supplier" ? eventData?.user_id : supplierData.id;
            const targetName = userData?.role === "Supplier"
                ? `${eventUser.first_name} ${eventUser.last_name}`
                : supplierData?.supplier_name;

            const q = query(
                collection(db, "contacts"),
                where("user_id", "==", auth.currentUser.uid),
                where("contact_id", "==", targetId)
            );

            const querySnapShot = await getDocs(q);

            if (querySnapShot.empty) {
                await addDoc(collection(db, "contacts"), {
                    user_id: auth.currentUser.uid,
                    contact_id: targetId,
                    name: targetName,
                    avatar: targetName.slice(0, 1).toUpperCase(),
                    last_message: "",
                    isActive: false,
                    created_at: serverTimestamp(),
                });
                navigate(`/chats/`);
            } else {
                navigate(`/chats/`);
            }
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsProcessing(false)
        }
    };


    if (contract && contract?.length === 0) {
        return <div className='h-6 w-6 rounded-full animate-spin border border-t-blue-600'></div>
    }

    return (
        <>
            <Dialog open={isOpen} as='div' className={'z-999 relative focus:outline-none'} onClose={onClose}>
                <div className="fixed inset-0 bg-black/25 " />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <div className='relative'>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <LoadingOverlay isLoading={isProcecssing || isSubmitting} message='Processing...' />

                            <div>
                                <div>
                                    {/* Header */}
                                    <div className="flex justify-between bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl mb-2 px-7 py-7 gap-2">
                                        <div>
                                            <div className='flex items-center gap-3'>
                                                <FileText size={26} className="text-white" />
                                                <h2 className="text-2xl font-bold text-white">Event Service Contract</h2>
                                            </div>
                                            <p className='text-white'>Contract ID: {contract?.id}</p>
                                        </div>

                                        <div className='flex flex-col gap-2 text-sm items-center'>
                                            <div className='flex items-center gap-2  px-12'>
                                                <span className='block text-gray-200'>Contract status:</span>
                                                <span className={`block text-xs text-white px-3 ${contract?.status === "Pending" ? "bg-yellow-600" : (contract?.status === "Cancelled" || contract?.status === "Rejected") ? "bg-red-500" : "bg-green-500"} py-1 rounded-full text-sm`}>{contract?.status}</span>
                                            </div>
                                        </div>

                                    </div>

                                    <div className='grid grid-cols-2 px-9 py-4 gap-5 mx-auto'>
                                        <div className='flex items-center gap-3'>
                                            <Calendar className='text-blue-600' />
                                            <div className='flex flex-col'>
                                                <span className='block text-sm text-gray-400'>Event Name</span>
                                                <span className='block font-semibold'>{eventData?.event_name}</span>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-3'>
                                            <MapPin className='text-blue-600' />
                                            <div className='flex flex-col'>
                                                <span className='block text-sm text-gray-400'>Venue & Date</span>
                                                <span className='block font-semibold'>{eventData?.event_location}</span>
                                                <span className='block text-sm text-gray-400'>{eventData?.event_date?.date_value}</span>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-3'>
                                            <User className='text-blue-600' />
                                            <div className='flex flex-col'>
                                                <span className='block text-sm text-gray-400'>Event Planner</span>
                                                <span className='block font-semibold'>{eventUser?.first_name} {eventUser?.last_name}</span>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-3'>
                                            <Building className='text-blue-600' />
                                            <div className='flex flex-col'>
                                                <span className='block text-sm text-gray-400'>Event Supplier</span>
                                                <span className='block font-semibold'>{supplierData?.supplier_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex flex-col items-start px-9 py-8 justify-center'>

                                        <div className="w-full rounded-xl p-6 mb-7 border border-gray-200 shadow-sm bg-gray-50">
                                            {/* Header */}
                                            <div className='flex items-center gap-3 mb-6'>
                                                <Package className='text-blue-600' size={24} />
                                                <span className='font-bold text-lg text-gray-800'>Delivery Submissions</span>
                                            </div>

                                            {/* No Deliveries */}
                                            {(contractDeliveries.length === 0) && !isDeliveriesLoading && (
                                                <div className='flex justify-center py-12'>
                                                    <span className='text-gray-500 text-sm'>No deliveries have been submitted yet.</span>
                                                </div>
                                            )}

                                            {isDeliveriesLoading && (
                                                <div className='max-h-[350px] relative -top-40'>
                                                    <PageLoading />
                                                </div>
                                            )}

                                            {/* Deliveries */}
                                            {contractDeliveries.length > 0 && !isDeliveriesLoading && (
                                                <div className="space-y-5 max-h-[350px] overflow-y-auto">
                                                    {contractDeliveries.map((delivery, index) => {
                                                        const deliveryReports = reports.find(r => r.delivery_id === delivery.id && r.reporter_role === "Event Planner")
                                                        const deliveryResponse = reports.filter(r => r.contract_id === contract.id && r.reporter_role === "Supplier")
                                                        const supplierResponse = deliveryResponse[0]

                                                        return (
                                                            <div
                                                                key={index}
                                                                className="border border-gray-300 rounded-lg p-5 shadow-md bg-white hover:shadow-lg transition"
                                                            >
                                                                {deliveryReports && (
                                                                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6 transition-all hover:shadow-lg">
                                                                        {/* Header */}
                                                                        <div className="flex items-center justify-between mb-5">
                                                                            <div>
                                                                                <h2 className="text-base font-semibold text-red-500 tracking-wide uppercase">
                                                                                    Delivery Issue
                                                                                </h2>
                                                                                <p className="text-sm text-gray-500">
                                                                                    Detailed report of the issue encountered during delivery.
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="text-sm font-semibold text-gray-700 mr-2">Status:</span>
                                                                                <span
                                                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize shadow-sm
                                                                                        ${deliveryReports.status === "pending" || deliveryReports.status === "under_review"
                                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                                            : deliveryReports.status === "solved"
                                                                                                ? "bg-green-100 text-green-700"
                                                                                                : deliveryReports.status === "rejected" || deliveryReports.status === "Issued"
                                                                                                    ? "bg-red-100 text-red-700"
                                                                                                    : deliveryReports.status === "Picked Up" || deliveryReports.status === "On Going"
                                                                                                        ? "bg-blue-100 text-blue-700"
                                                                                                        : "bg-gray-100 text-gray-700"
                                                                                        }`}
                                                                                >
                                                                                    {deliveryReports.status}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Body */}
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-900">
                                                                                    Event Name: <span className="font-semibold">{eventData.event_name}</span>
                                                                                </p>
                                                                            </div>

                                                                            {deliveryReports.admin_feedback?.length > 0 && (
                                                                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                                                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Admin Feedback</h3>
                                                                                    <p className="text-sm text-gray-800">{deliveryReports.admin_feedback}</p>
                                                                                </div>
                                                                            )}

                                                                            <div>
                                                                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Issue Applied</h3>
                                                                                <ul className="ml-4 list-disc text-sm text-gray-800 space-y-1">
                                                                                    {deliveryReports?.penalty_applied?.map((report, index) => (
                                                                                        <li key={index}>{report}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>

                                                                            <div>
                                                                                <p className="text-sm text-gray-900 italic border-l-4 border-gray-300 pl-3 mt-3">
                                                                                    "{deliveryReports.reason}"
                                                                                </p>
                                                                            </div>

                                                                            <div>
                                                                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Image Proof</h3>
                                                                                <a href={deliveryReports.proof} target="_blank" rel="noopener noreferrer">
                                                                                    <img
                                                                                        src={deliveryReports.proof}
                                                                                        alt="Proof"
                                                                                        className="w-full max-w-sm rounded-xl border border-gray-200 object-cover hover:opacity-90 transition"
                                                                                    />
                                                                                </a>
                                                                            </div>


                                                                            {/* Reason */}
                                                                            {supplierResponse && (
                                                                                <>
                                                                                    <div className="mt-6 bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-5">
                                                                                        <h3 className="text-base font-semibold text-blue-600 mb-3">
                                                                                            Supplier Response
                                                                                        </h3>
                                                                                        <div className="mb-3">
                                                                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Response Reason</h4>
                                                                                            <p className="text-sm text-gray-800 italic border-l-4 border-blue-300 pl-3">
                                                                                                "{supplierResponse.reason}"
                                                                                            </p>
                                                                                        </div>


                                                                                        <div className="mt-3">
                                                                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Proof Provided</h4>
                                                                                            <a
                                                                                                href={supplierResponse.proof}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
                                                                                                <img
                                                                                                    src={supplierResponse.proof}
                                                                                                    alt="Supplier Proof"
                                                                                                    className="w-25 h-25 rounded-xl border border-gray-200 object-cover hover:opacity-90 transition"
                                                                                                />
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                        </div>

                                                                        {/* Action Buttons */}
                                                                        {userData.role === "Supplier" &&
                                                                            !["solved", "under_review", "rejected"].includes(deliveryReports.status) && (
                                                                                <div className="flex justify-end gap-3 mt-5 border-t border-gray-100 pt-4">
                                                                                    <DamagePenaltiesModal report={deliveryReports} contractData={contract} userData={userData} delivery={delivery} deliveryId={delivery.id} eventData={eventData} type={userData?.role === "Supplier" && 'supplier'} />
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleDeliveryReport(deliveryReports.id, "Accept", delivery.id, deliveryReports)
                                                                                        }
                                                                                        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm"
                                                                                    >
                                                                                        Accept
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}

                                                                {delivery?.delivery_type?.value === "lalamove" && (
                                                                    <>
                                                                        <div className="bg-white shadow-lg border border-gray-300 rounded-lg">
                                                                            <div className="px-4 py-4">
                                                                                <div className='flex items-center justify-between'>
                                                                                    <span className="text-sm mb-4 block text-gray-600">
                                                                                        <strong>Status:</strong>{" "}
                                                                                        <span
                                                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.status === "Pending" || delivery.status === "Driver Assigned"
                                                                                                ? "bg-yellow-100 text-yellow-600"
                                                                                                : delivery.status === "Delivered" || delivery.status === "Received"
                                                                                                    ? "bg-green-100 text-green-600"
                                                                                                    : delivery.status === "Damaged" || delivery.status === "Issued"
                                                                                                        ? "bg-red-100 text-red-600"
                                                                                                        : delivery.status === "Picked Up" || delivery.status === "On Going"
                                                                                                            ? "bg-blue-100 text-blue-600"
                                                                                                            : "bg-gray-100 text-gray-600"
                                                                                                }`}
                                                                                        >
                                                                                            {delivery.status}
                                                                                        </span>
                                                                                    </span>

                                                                                    <div className="flex justify-between items-center mb-4">
                                                                                        <div className="flex items-center gap-2">
                                                                                        </div>
                                                                                        <span className="text-xs text-gray-400">
                                                                                            Submitted:{" "}
                                                                                            {delivery.submitted_at?.toDate
                                                                                                ? delivery.submitted_at.toDate().toLocaleString()
                                                                                                : "N/A"}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                                                                        {/* <div className="text-white text-2xl">🏍️</div> */}
                                                                                        <img src="delivery-man.png" alt="" className='w-8 h-8' />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-medium text-gray-700">{delivery.delivery_service_type}</span>
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className='text-sm font-semibold text-gray-900'>{delivery?.courier?.name || "Unknown"}</span>
                                                                                            <span className='text-xs text-gray-600'>{delivery?.courier?.phone || "Unknown"}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Main Content */}
                                                                        <div className="py-6 space-y-6">
                                                                            {/* Route Section */}
                                                                            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-4">
                                                                                <div className="flex items-center justify-between mb-4">
                                                                                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Route</h2>
                                                                                </div>

                                                                                <div className="flex gap-3">
                                                                                    {/* Pickup Location */}
                                                                                    <div className='flex flex-col py-3 gap-2 items-center'>
                                                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                                                        <div className="w-0.5 h-full bg-gray-300"></div>
                                                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <div className="flex gap-3">
                                                                                            <div className="flex-1 pb-4">
                                                                                                <div className="font-medium text-gray-900">
                                                                                                    {delivery?.pickup_location?.pickup.address}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                                    {delivery.pickup_location.sender.name} | {delivery.pickup_location.sender.phone}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* Dropoff Location */}
                                                                                        <div className="flex gap-3">

                                                                                            <div className="flex-1">
                                                                                                <div className="font-medium text-gray-900">
                                                                                                    {delivery?.dropoff_location?.dropoff.address}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                                    {delivery.dropoff_location.recipients.name} | {delivery.dropoff_location.recipients.phone}

                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                </div>
                                                                                <a href={delivery.delivery_link} target='_blank' className='transition-all w-33 bg-orange-600 text-sm hover:bg-orange-700 flex p-2 px-3 rounded-lg text-white ml-auto'>
                                                                                    View more details
                                                                                </a>
                                                                            </div>

                                                                            {/* Price Section */}
                                                                            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-4">
                                                                                <div className="flex items-center justify-between mb-4">
                                                                                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Price</h2>
                                                                                </div>

                                                                                <div className="space-y-3">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <div>
                                                                                            <div className="font-medium text-gray-900">Delivery Fee</div>
                                                                                            <div className="text-xs text-gray-500">lalamove</div>
                                                                                        </div>
                                                                                        <div className="text-lg font-semibold text-gray-900">₱38</div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {delivery?.delivery_type?.value === "personal" && (
                                                                    <>

                                                                        <div className='flex justify-between'>
                                                                            <div>
                                                                                <div className='text-sm text-gray-700'>
                                                                                    Submitted Time:{" "}
                                                                                    {delivery?.submitted_at
                                                                                        ? new Date(delivery.submitted_at.seconds * 1000).toLocaleString()
                                                                                        : "No timestamp available"}
                                                                                </div>

                                                                                <p className="text-sm text-gray-700 mb-4">
                                                                                    <span>Note:</span> {delivery.notes || "No notes provided"}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <span className="text-sm text-gray-600">
                                                                                    <strong>Status:</strong>{" "}
                                                                                    <span
                                                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.status === "Pending"
                                                                                            ? "bg-yellow-100 text-yellow-600"
                                                                                            : delivery.status === "Confirmed" || delivery.status === "Received"
                                                                                                ? "bg-green-100 text-green-600"
                                                                                                : delivery.status === "Damaged" || delivery.status === "Issued"
                                                                                                    ? "bg-red-100 text-red-600"
                                                                                                    : "bg-gray-100 text-gray-600"
                                                                                            }`}
                                                                                    >
                                                                                        {delivery.status}
                                                                                    </span>
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Proofs */}
                                                                        {delivery.proof?.length > 0 && (
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                                                                                <a
                                                                                    key={index}
                                                                                    href={delivery.proof}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="block rounded-lg overflow-hidden hover:ring hover:ring-blue-400 transition"
                                                                                >
                                                                                    <img
                                                                                        src={delivery.proof}
                                                                                        alt={`Proof ${index + 1}`}
                                                                                        className="w-full h-32 object-cover"
                                                                                    />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {/* Action Buttons - Only show if user is event planner and delivery is pending */}
                                                                {userData?.role !== "Supplier" && (delivery.status === "Pending" || delivery.status === "Delivered") && (
                                                                    <div className="flex justify-end gap-2">
                                                                        <DamagePenaltiesModal contractData={contract} userData={userData} delivery={delivery} deliveryId={delivery.id} eventData={eventData} />

                                                                        <button
                                                                            onClick={() => handleDeliveryStatus(delivery.id, "Confirmed")}
                                                                            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                                                                        >
                                                                            Received
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* Submit Button for Supplier for full payment*/}
                                            {showSubmitButton && (contract?.status !== "Pending" && contract?.status !== "Completed") && contractDeliveries.length === 0 && contract?.service_plan.service_payment_notice.label === "Pay after service delivered" && (
                                                <div className="flex justify-end mt-6">
                                                    <SubmissionModal
                                                        contract={contract}
                                                        eventData={eventData}
                                                        supplierData={supplierData}
                                                    />
                                                </div>
                                            )}

                                            {/* Submit Button for Supplier for down payment*/}
                                            {showSubmitButton && not_include_fees > 0 && (contract?.status !== "Pending" && contract?.status !== "Completed") && contractDeliveries.length === 0 && contract?.service_plan.service_payment_notice.label === "Down Payment required atleast 50 percent" && (
                                                <div className="flex justify-end mt-6">
                                                    <SubmissionModal
                                                        contract={contract}
                                                        eventData={eventData}
                                                        supplierData={supplierData}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className={`w-full flex flex-col rounded-lg transition-all duration-200 shadow-md border border-gray-300
                                            bg-blue-50`}
                                        >
                                            <div>
                                                <div className="rounded-t-md bg-blue-600 text-white">
                                                    <h3 className="font-bold text-2xl text-center py-5">{contract?.service_plan.service_plan?.label}</h3>
                                                </div>

                                                <div className="flex items-center justify-center">
                                                    <p className="text-gray-900 text-2xl font-bold leading-relaxed mt-3">
                                                        ₱{contract?.service_plan?.service_price}.0/deliver
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between gap-3 h-full space-x-4">

                                                <div className="text-left px-6 mt-3">
                                                    {contract?.service_plan?.service_inclusions?.map((inclusion, inclusionIndex) => (
                                                        <div className="flex gap-3 space-y-3" key={inclusionIndex}>
                                                            <Check className="text-green-400" />
                                                            <span className="flex text-sm text-gray-600" >{inclusion}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div>
                                                    <div className="px-6 mb-5 text-left">
                                                        <hr className="border-b-0 border-gray-400 mb-1" />
                                                        <span className="text-left text-sm text-gray-600">Note: {contract?.service_plan?.service_payment_notice?.label}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* penlaties for service failure */}
                                        <div className="w-full h-[300px] rounded-lg overflow-y-auto bg-red-50 p-6 mt-8 border border-gray-300">
                                            <div className='flex gap-2 items-center'>
                                                <TriangleAlert className='text-red-600' />
                                                <p className="font-bold text-lg">{contract?.penalty_clauses?.title}</p>
                                            </div>
                                            <span className="text-gray-600 mt-3 block">{contract?.penalty_clauses?.description}</span>
                                            {contract?.penalty_clauses?.clauses.map((clause, penalIndex) => (
                                                <div className="mb-3" key={penalIndex}>
                                                    <span className="text-red-600 mt-5 block font-semibold">{penalIndex + 1}. {clause.title}</span>
                                                    {clause?.details?.map((details, detailIndex) => (
                                                        <p className="text-gray-600 mt-2" key={detailIndex}>{details}</p>
                                                    ))}
                                                </div>

                                            ))}
                                        </div>

                                        {(contract?.status === "Approved" || contract?.status === "Completed" || contract?.status === "Cancelled") && (
                                            <>
                                                {/* payment method */}
                                                {(total_paid - total_fees) !== service_price && userData?.role != "Supplier" && contract.status !== "Cancelled" && (
                                                    <div ref={paymentSectionRef} className="w-full bg-blue-50 p-6 mt-8 border rounded-lg border-gray-300">
                                                        <div className='flex gap-2 items-center'>
                                                            <CreditCard className='text-blue-600' />
                                                            <p className="font-bold text-lg">Payment Methods</p>
                                                        </div>

                                                        <div className='flex flex-col gap-5 mt-5'>
                                                            {paymentMethods.map((methods, methodIndex) => (
                                                                <button onClick={() => handlePaymentMethod(methods)} className={`transition-all duration-100 rounded-lg flex justify-between border hover:ring hover:ring-blue-600
                                                         ${payment_method.method === methods.method ? 'border border-blue-600' : 'border-gray-300'} shadow-lg p-5`}
                                                                    key={methodIndex}
                                                                >

                                                                    <div className='flex items-center gap-3'>
                                                                        <div className='flex items-center gap-1'>
                                                                            <img src={methods.payment_method_logo} className='w-12 h-12 object-cover rounded-xl' alt="" />
                                                                        </div>
                                                                        <div className='flex flex-col gap-1'>
                                                                            <span className='block text-left text-gray-900 font-semibold'>{methods.name}</span>
                                                                            <span className='block text-left text-sm text-gray-500'>{methods.type}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className={`rounded-full h-5 w-5 border flex items-center justify-center border-gray-300 ${payment_method.method === methods.method ? methods.color : 'bg-gray-300'}`}>
                                                                        {payment_method.method === methods.method && <Check className='w-3 h-3 text-white' />}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {payment_method_error && (
                                                                <span className='ml-3 text-sm text-red-500'>{payment_method_error}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Summary */}
                                                {contract.status !== 'Cancelled' && (
                                                    <div className={`w-full ${userData?.role === "Supplier" ? 'h-[470px]' : 'h-[410px]'}  rounded-lg p-6 mt-8 border border-gray-300`}>
                                                        <div className='flex items-center justify-between mb-2'>
                                                            <div className='flex gap-2 items-center'>
                                                                <PhilippinePeso className='text-green-600' />
                                                                <p className="font-bold text-lg">Payment Summary</p>
                                                            </div>

                                                            <div className='flex items-center gap-2'>
                                                                <span className='block text-sm text-gray-800 font-semibold'>Payment status:</span>
                                                                <span className={`block text-white px-3 py-[2px] rounded-full text-sm ${(total_paid - total_fees) === service_price ? "bg-green-600" : contract_transaction.length > 0 ? "bg-orange-500" : 'bg-gray-400'}`}>{(total_paid - total_fees) === service_price ? 'FULLY PAID' : contract_transaction.length > 0 ? 'PARTIAL PAID' : 'UNPAID'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className='flex justify-between flex-col'>
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-gray-600">Services Subtotal</span>
                                                                        <span className="font-semibold">₱{service_price.toLocaleString()}</span>
                                                                    </div>
                                                                    {userData?.role === "Supplier" && (
                                                                        <>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-gray-600">Platform Fee (3%)</span>
                                                                                <span className="font-semibold text-red-600"> - ₱{platformFee.toLocaleString()}</span>
                                                                            </div>

                                                                            <div className="flex flex-col gap-2">

                                                                                <div className="flex flex-col gap-2">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="text-gray-600 font-medium">Total Deductions (from deliveries)</span>
                                                                                        <span className="font-semibold text-red-600">
                                                                                            - ₱{totalDeductions.toLocaleString()}
                                                                                        </span>
                                                                                    </div>

                                                                                    {Object.keys(issueCount).length > 0 && (
                                                                                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                                                            {Object.entries(issueCount).map(([issue, count]) => (
                                                                                                <li key={issue}>
                                                                                                    {issue} {count > 1 && <span className="text-gray-500">(×{count})</span>}
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="border-t border-gray-300 pt-3">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-md font-semibold text-gray-800">Amount To Receive</span>
                                                                                    <span className="text-lg font-semibold text-gray-800">₱{userData?.role === "Supplier" ? finalAmount.toLocaleString() : service_price}</span>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}


                                                                    {userData?.role === "Event Planner" && (
                                                                        <>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-gray-600">Processing Fee ({process_fee * 100}% Xendit)</span>
                                                                                <span className="font-semibold">₱{processFee.toLocaleString()}</span>
                                                                            </div>
                                                                            {isDownPayment ? (
                                                                                <>
                                                                                    <div>
                                                                                        <div className="border-t pt-2 border-gray-300 flex justify-between items-center">
                                                                                            <span className="text-md  text-gray-800">To Pay Now (Down Payment)</span>
                                                                                            <span className="text-lg font-semibold text-blue-600">₱{contract_transaction?.length > 0 ? 0 : downpayment.toLocaleString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span className="text-md text-gray-800">Next Payment (Balance)</span>
                                                                                            <span className="text-lg font-semibold text-orange-600">₱{contract_transaction?.length > 1 ? 0 : nextpayment.toLocaleString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div>
                                                                                    <div className="border-t pt-2 border-gray-300 flex justify-between items-center">
                                                                                        <span className="text-md  text-gray-800">To Pay Now (Full Payment)</span>
                                                                                        <span className="text-lg font-semibold text-blue-600">₱{contract_transaction?.length > 0 ? 0 : fullAmount.toLocaleString()}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                        </>
                                                                    )}

                                                                    <div className="border-t border-gray-300 mt-12 mb-1 pt-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className='flex gap-2 items-baseline'>
                                                                                <span className="text-lg font-semibold text-gray-800">Total Paid by Planner</span>
                                                                                <span className="text-md text-gray-600">(Not incl. fees)</span>
                                                                            </div>
                                                                            <span className="text-2xl font-semibold text-green-600">₱{not_include_fees.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                                <p className='text-sm mt-4 text-gray-600'>
                                                                    Note: Your payment is securely processed via Xendit. The downpayment is received by our platform and only manually released to the supplier once confirmed
                                                                </p>
                                                            </div>



                                                            {/* <div className='relative top-8 w-full rounded-2xl p-1 border border-gray-600 h-5'>
                                                                    <div className={`transition-all bg-green-500 h-2.5 rounded-2xl`} style={{ width: `${(totalpaid / netAmount) * 100}%`}}></div>
                                                                </div> */}
                                                        </div>

                                                    </div>
                                                )}

                                                <div className={`w-full mt-5 flex flex-col px-7 py-7 rounded-lg transition-all duration-200 shadow-md border border-gray-300 `}
                                                >
                                                    <div className='flex gap-2 items-center'>
                                                        <ArrowLeftRight className='text-blue-600' />
                                                        <p className="font-bold text-lg">Recent Transactions</p>
                                                    </div>

                                                    <div className={`flex flex-col mt-5 gap-3 overflow-y-auto ${contractTransaction.length > 2 && 'h-[200px]'}`}>
                                                        {contractTransaction.map((t, i) => (
                                                            <div key={i} className='bg-gray-50 border border-gray-200 shadow-lg rounded-lg py-5 px-6 flex items-center justify-between'>
                                                                <div className='flex flex-col space-y-2'>
                                                                    <div className='flex items-baseline gap-2'>
                                                                        <span className='font-semibold'>Payment Transaction</span>
                                                                        <span className={`py-1 w-18 text-xs rounded-full ${statusStyles[t.status.toLowerCase()]} block text-center `}>{t.status}</span>
                                                                    </div>
                                                                    <span className='text-gray-500 text-sm'>{t?.created_at?.toDate().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>

                                                                <span className='text-gray-800 font-semibold'>₱ {t.amount}</span>
                                                            </div>
                                                        ))}

                                                        {contractTransaction.length === 0 && (
                                                            <div className='block text-center py-2 pb-5 text-gray-600 font-semibold'>No transactions made yet.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>


                                    <div className='flex mb-2 relative bottom-3 right-10'>
                                        <div className='flex left-20 gap-2 relative '>
                                            <button
                                                onClick={handleChat}
                                                className=" transition-all duration-50 text-sm items-center hover:bg-gray-700 py-2 px-5 rounded-md bg-gray-600 text-white"
                                            >
                                                {userData?.role === "Supplier"
                                                    ? `Message Planner`
                                                    : `Message Supplier`}
                                            </button>
                                            {contract?.status === "Approved" && (
                                                <>
                                                    {isAlreadyReported ? (
                                                        <div className='bg-gray-300 px-5 py-2 rounded-lg text-gray-600'>Reported</div>
                                                    ) : (
                                                        <ReportModal contractData={contract} userData={userData} eventData={eventData} supplierData={supplierData} />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {userData?.role != "Supplier" && contract?.status !== "Completed" && (
                                            <>
                                                {(total_paid - total_fees) === service_price && (deliveries[0]?.status === "Received" || deliveries[0]?.status === "Issued") && (
                                                    <div className='flex justify-end ml-auto gap-3 '>
                                                        {/* <button className='transition-all duration-50 text-sm items-center hover:bg-gray-700 py-2 px-5 rounded-md bg-gray-600 text-white'>Contact Supplier</button> */}

                                                        <button
                                                            onClick={(e) => handleRelease(e, platformFee, netAmount)}
                                                            disabled={isReleasing}
                                                            className={`transition-all duration-50 text-sm items-center py-2 px-5 rounded-md text-white ${isReleasing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                                                }`}
                                                        >
                                                            {isReleasing ? (
                                                                <div className='flex items-center gap-2'>
                                                                    Processing...
                                                                    <div className='border-t-2 h-4 w-4 rounded-full animate-spin'></div>
                                                                </div>
                                                            ) : (
                                                                'Complete Transaction'
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {contract?.status === "Approved" && (total_paid - total_fees) !== service_price && contract?.service_plan.service_payment_notice.label === "Pay after service delivered"
                                                    && (
                                                        <button
                                                            onClick={() => handlePayment(downpayment, nextpayment, processFee)}
                                                            disabled={(contractDeliveries.length === 0 && contract_transaction.length > 0) || isProcessing}
                                                            className={`px-7 py-2 ${(contractDeliveries.length === 0)
                                                                ? 'bg-blue-300 cursor-not-allowed'
                                                                : 'bg-blue-500 hover:bg-blue-600'
                                                                } text-white text-sm rounded flex justify-end items-end ml-auto `}
                                                        >
                                                            {isProcessing ? (
                                                                <a href={invoiceUrl} target='_blank' className='flex items-center gap-3 '>
                                                                    View Invoice Link
                                                                    <div className='border-t-2 h-4 w-4 rounded-full animate-spin'></div>
                                                                </a>
                                                            ) : (contractDeliveries.length === 0) ? (
                                                                'Must deliver before pay'
                                                            ) : (
                                                                'Pay Contract'
                                                            )}
                                                        </button>
                                                    )}

                                                {contract?.status === "Approved" && (total_paid - total_fees) !== service_price && contract?.service_plan.service_payment_notice.label === "Down Payment required atleast 50 percent." && (
                                                    <button
                                                        onClick={() => handlePayment(downpayment, nextpayment, processFee)}
                                                        disabled={(contractDeliveries.length === 0 && contract_transaction.length > 0) || isProcessing}
                                                        className={`px-7 py-2 ${(contractDeliveries.length === 0 && contract_transaction.length > 0)
                                                            ? 'bg-blue-300 cursor-not-allowed'
                                                            : 'bg-blue-500 hover:bg-blue-600'
                                                            } text-white text-sm rounded flex justify-end items-end ml-auto `}
                                                    >
                                                        {isProcessing ? (
                                                            <a href={invoiceUrl} target='_blank' className='flex items-center gap-3 '>
                                                                View Invoice Link
                                                                <div className='border-t-2 h-4 w-4 rounded-full animate-spin'></div>
                                                            </a>
                                                        ) : (contractDeliveries.length === 0 && contract_transaction.length > 0) ? (
                                                            'Must deliver before pay'
                                                        ) : (
                                                            'Pay Contract'
                                                        )}
                                                    </button>
                                                )}

                                                {event_id === user_id && contract?.status === "Pending" && (
                                                    <button disabled={true} className='px-7 py-2 flex justify-end items-end ml-auto bg-gray-400 text-white text-sm rounded'>Awaiting Approval</button>
                                                )}


                                            </>
                                        )}

                                        {supplier_id === user_id && contract?.status === "Pending" && (
                                            <div className='flex p-2 gap-2 justify-end items-end ml-auto '>
                                                <RejectReview contract={contract} supplier={supplierData} event_id={eventData.id} event_name={eventData.event_name} supplier_id={supplierData.id} className={`transition duration-50 py-1 px-5 border rounded-md hover:bg-red-600 hover:text-white`} />
                                                <button onClick={() => handleApprove(contract?.id)} disabled={isSubmitting} className={`transition-all duration-50 px-7 py-2 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm rounded`}>{isSubmitting ?
                                                    <>
                                                        <div className='h-5 w-5 border-t-2 rounded-full animate-spin border-white'></div>
                                                    </> : 'Approve Offer'}
                                                </button>
                                            </div>
                                        )}
                                    </div>


                                </div>

                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}