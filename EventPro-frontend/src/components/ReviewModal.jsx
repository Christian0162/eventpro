import { Button, Dialog, DialogPanel, } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { X, Star, ThumbsUp, MessageSquare } from 'lucide-react'
import { addDoc, updateDoc, collection, serverTimestamp, doc, query, where, deleteDoc, getDocs, arrayUnion, increment } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/firebase'
import Swal from 'sweetalert2'
import LoadingOverlay from './LoadingOverlay'
import { statusStyles } from '../constants/categories'
import { useFetchAllTransaction } from '../hooks/useTransaction'
import { useCreateRefund } from '../hooks/useRefund'
import { useFetchContract } from '../hooks/useContract'
import { useFetchUsers } from '../hooks/useUsers'
import { useFetchEvents } from '../hooks/useEvents'

export const Review = ({ reviewed_id, reviewer_name, eventData, contractData }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [reviewerName, setReviewerName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setReviewerName(reviewer_name)
    }, [reviewer_name])


    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
        // Reset form when closing
        setRating(0)
        setHoverRating(0)
        setReviewText('')
        setIsSubmitting(false)
    }

    function handleStarClick(starRating) {
        setRating(starRating)
    }

    function handleStarHover(starRating) {
        setHoverRating(starRating)
    }

    function handleStarLeave() {
        setHoverRating(0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        Swal.fire({
            title: 'Are you sure',
            text: 'Do you want to submit this for review?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            try {
                if (result.isConfirmed) {
                    setIsSubmitting(true)
                    await addDoc(collection(db, 'reviews'), {
                        user_id: auth.currentUser.uid,
                        reviewer_name: reviewerName,
                        reviewed_id: reviewed_id,
                        event_id: eventData?.id || contractData.event_id,
                        rating: rating,
                        comment: reviewText,
                        created_at: serverTimestamp()
                    })

                    await addDoc(collection(db, "notifications"), {
                        avatar: reviewer_name.charAt(0).toUpperCase(),
                        title: "New Review Received",
                        message: `"${reviewer_name}" left a review for you — "${reviewText}"`,
                        sender_id: reviewed_id,
                        feedback: reviewText,
                        created_at: serverTimestamp(),
                        referenced_id: reviewed_id,
                        unread: true,
                        receiver_id: reviewed_id
                    });

                    Swal.fire('Success', 'Review has been submitted', 'success')
                    setIsSubmitting(false)

                    close()
                }
            }
            catch (e) {
                console.error(e)
            }
        })
    }

    const getRatingText = (rating) => {
        const texts = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        }
        return texts[rating] || ''
    }

    return (
        <>
            <Button onClick={open} className={'transition-all duration-100 hover:bg-blue-700 px-6 py-2 text-sm rounded-md bg-blue-600 text-white '}>Review</Button>

            <Dialog open={isOpen} as='div' className={'z-50 relative focus:outline-none'} onClose={close}>
                <div className="fixed inset-0 bg-black/25 " />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-xl mt-18 rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <LoadingOverlay isLoading={isSubmitting} message='Processing..' />
                            <div className='relative'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className='p-8'>
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h2>
                                    <p className="text-gray-600">Share your experience with others</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Rating Section */}
                                    <div className="text-center">
                                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                                            How would you rate your experience?
                                        </label>
                                        <div className="flex justify-center items-center space-x-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleStarClick(star)}
                                                    onMouseEnter={() => handleStarHover(star)}
                                                    onMouseLeave={handleStarLeave}
                                                    className="transition-all duration-200 transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={35}
                                                        className={`${star <= (hoverRating || rating)
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                            } transition-colors duration-200`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {rating > 0 && (
                                            <p className="text-lg font-medium text-gray-700">
                                                {getRatingText(rating)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Name Input */}
                                    <div>
                                        <label htmlFor="reviewer-name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="reviewer-name"
                                                value={reviewerName}
                                                onChange={(e) => setReviewerName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full pl-5 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Review
                                        </label>
                                        <textarea
                                            id="review-text"
                                            rows={5}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Tell us about your experience..."
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                        />
                                        <div className="text-right text-sm text-gray-500 mt-1">
                                            {reviewText.length}/500
                                        </div>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex space-x-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={close}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || rating === 0}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ThumbsUp size={20} />
                                                    <span>Submit Review</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                    <p className="text-sm text-gray-500">
                                        Your review helps others make informed decisions
                                    </p>
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export const RejectReview = ({ id, event_id, supplier_id, userData, event_name, supplier, event, contract, className }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [reviewText, setReviewText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)

        setIsSubmitting(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        Swal.fire({
            title: 'Reject this submission?',
            text: 'Are you sure you want to reject this request? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reject it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            try {
                setIsSubmitting(true)

                if (result.isConfirmed) {
                    if (userData?.role === "Admin") {
                        await updateDoc(doc(db, "verification", id), {
                            is_verified: false
                        })

                        await updateDoc(doc(db, "users", id), {
                            verification_status: 'rejected'
                        })

                        await addDoc(collection(db, "notifications"), {
                            receiver_id: id,
                            avatar: 'A',
                            title: 'Verification Rejected',
                            message: "Unfortunately, your submission did not meet the required criteria. Please review the feedback and re-submit your application for verification.",
                            feedback: reviewText,
                            created_at: serverTimestamp(),
                            unread: true
                        })
                    }

                    else {
                        const q = query(collection(db, "applications"),
                            where("event_id", "==", event_id),
                            where("supplier_id", "==", supplier_id))
                        const snapShotApplications = await getDocs(q)
                        const applications = snapShotApplications.docs.map(app => ({ id: app.id, ...app.data() }))

                        if (contract) {
                            await addDoc(collection(db, "notifications"), {
                                receiver_id: contract.planner_id,
                                avatar: supplier.supplier_name.charAt(0).toUpperCase(),
                                title: "Offer Rejected",
                                referenced_id: event_id,
                                referenced_type: 'event',
                                sender_id: supplier.id,
                                message: `Unfortunately, ${supplier.supplier_name} has rejected your offer for the event "${event_name}".`,
                                feedback: reviewText,
                                created_at: serverTimestamp(),
                                unread: true
                            });

                            await deleteDoc(doc(db, "contracts", contract.id));

                        }
                        else {
                            await addDoc(collection(db, "notifications"), {
                                receiver_id: applications[0]?.supplier_id,
                                avatar: event_name.charAt(0).toUpperCase(),
                                title: 'Application Rejected',
                                referenced_id: event_id,
                                referenced_type: 'event',
                                sender_id: event.user_id,
                                message: `We're sorry, your application for the event "${event_name}" has been rejected.`,
                                feedback: reviewText,
                                created_at: serverTimestamp(),
                                unread: true
                            });
                        }

                        await deleteDoc(doc(db, "applications", applications[0].id));


                    }

                    Swal.fire('Rejected', 'The review has been rejected.', 'success');
                    close()

                    if (!supplier) {
                        navigate('/admin/dashboard', { replace: true })
                    }
                }
            }
            catch (e) {
                console.error(e)
            }
            finally {
                setIsSubmitting(false)
            }
        })
    }

    return (
        <>
            <Button onClick={open} className={`${className}`}>Reject</Button>

            <Dialog open={isOpen} as='div' className={'z-999 relative focus:outline-none'} onClose={close}>
                <div className="fixed inset-0 bg-black/25 " />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <LoadingOverlay isLoading={isSubmitting} message='Processing..' />
                            <div className='relative'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className='p-8'>
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reject Submission</h2>
                                    <p className="text-gray-600">(Optional) Please provide a reason for rejecting this request.</p>
                                </div>

                                <div className="space-y-6">

                                    {/* Review Text */}
                                    <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        id="review-text"
                                        rows={5}
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Explain why this submission is being rejected..."
                                        className="w-full px-4 py-3 ring ring-gray-300 rounded-lg transition-all duration-200 resize-none"
                                    />
                                    <div className="text-right text-sm text-gray-500 mt-1">
                                        {reviewText.length}/500 characters
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex space-x-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={close}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e)}
                                            disabled={isSubmitting}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                    <p className="text-sm text-gray-500">
                                        Your feedback will be sent to the user as the reason for rejection.
                                    </p>
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export const ReportReview = ({ report, userData, response, eventData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isApprovedSubmitting, setIsApproveSubmitting] = useState(false);
    const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const { transactions: allTransaction } = useFetchAllTransaction()
    const { contracts } = useFetchContract()
    const { createRefund, isLoading } = useCreateRefund()
    const { events } = useFetchEvents()
    const { users } = useFetchUsers()

    const userTransactionContract = allTransaction.filter(t => t.user_id === report?.user_id && t.contract_id === report.contract_id && t.type === "ESCROW" && t.status === "HOLD")

    const userContract = contracts.find(c => c.id === report?.contract_id)

    const id = report?.reporter_role === 'Event Planner' ? userContract?.supplier_id : userContract?.planner_id

    const contract = contracts?.find(c => c.id === response?.contract_id)

    const selectedUser = users.find(u => u.id === id)

    const userEvents = events.filter(event => event.user_id === id)

    const data = userTransactionContract.map(t => ({
        reference_id: t.external_id,
        amount: Math.floor(Number(t.amount) - Number(t.process_fee)),
        invoice_id: t.id
    }))

    function open() {
        setIsOpen(true);
    }

    function close() {
        setIsOpen(false);
        setIsApproveSubmitting(false);
    }

    const handleReject = async () => {
        setIsRejectSubmitting(true);
        if (report.report_type === "contract") {
            try {

                await addDoc(collection(db, "notifications"), {
                    avatar: 'A',
                    title: "Issue Reported",
                    message: `Your report has been reviewed and unfortunately, it has been rejected by the admin. Please check the details and, if necessary, submit a revised report.`,
                    feedback: rejectReason,
                    created_at: serverTimestamp(),
                    referenced_type: "report",
                    referenced_id: report?.id,
                    unread: true,
                    receiver_id: report?.user_id,
                });


                await updateDoc(doc(db, 'reports', report.id), {
                    status: 'rejected',
                    admin_feedback: rejectReason
                })

                Swal.fire({
                    icon: 'success',
                    title: 'Action Completed',
                    text: 'The action has been successfully completed.',
                    confirmButtonText: 'OK'
                });

            } catch (err) {
                console.error(err);
                setIsRejectSubmitting(false);
            }
            finally {
                setIsRejectSubmitting(false);
                setIsRejectOpen(false);
                setIsOpen(isLoading);
            }
        }

        if (report.report_type === "delivery") {
            Swal.fire({
                icon: 'warning',
                title: 'Reject Report?',
                html: `
                Rejecting this report means no penalties will be applied to the supplier.
                <br><br>
                Are you sure you want to reject this report?
            `,
                showCancelButton: true,
                confirmButtonText: 'Yes, reject',
                cancelButtonText: 'Cancel',
            }).then(async (r) => {
                if (r.isConfirmed) {
                    try {
                        await updateDoc(doc(db, "reports", report.id), {
                            status: "rejected",
                            admin_feedback: rejectReason,
                            updated_at: serverTimestamp(),
                        });

                        await updateDoc(doc(db, "deliveries", report.delivery_id), {
                            penalty_applied: [],
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            title: "Issue Reported",
                            message: `Your report has been rejected by the admin because it lacks sufficient proof.`,
                            feedback: rejectReason,
                            created_at: serverTimestamp(),
                            referenced_type: "report",
                            referenced_id: report?.id,
                            unread: true,
                            receiver_id: report?.user_id,
                        });
                        const totalContractPayment = Number(contract?.service_plan.service_price)

                        const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);

                        const totalFee = contract?.service_plan.service_price * 0.03

                        const totalAmountPlusFee = totalAmount - totalFee

                        const supplierCredentials = users.find(u => u.id === response?.user_id)

                        if (totalAmount === totalContractPayment) {
                            await addDoc(collection(db, "transactions"), {
                                contract_id: response?.contract_id || null,
                                event_id: eventData.id,
                                user_id: response?.user_id,
                                payment_method: null,
                                event_email: supplierCredentials.email_address,
                                event_contact: supplierCredentials?.contact_number || null,
                                amount: totalAmountPlusFee,
                                platform_fee: 0,
                                process_fee: 0,
                                type: "CREDIT",
                                status: "COMPLETED",
                                created_at: serverTimestamp()
                            })
                        } else {
                            await addDoc(collection(db, "transactions"), {
                                contract_id: response?.contract_id || null,
                                event_id: eventData.id,
                                user_id: response.user_id,
                                payment_method: null,
                                event_email: supplierCredentials.email_address,
                                event_contact: supplierCredentials?.contact_number || null,
                                amount: totalAmount,
                                platform_fee: 0,
                                process_fee: 0,
                                type: "CREDIT",
                                status: "COMPLETED",
                                created_at: serverTimestamp()
                            })
                        }

                        await updateDoc(doc(db, "users", response.user_id), {
                            balance: increment(totalAmount)
                        })

                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            title: "Issue Resolved",
                            message: `Your proof was valid. The down payment will now be released to your account and your balance will be updated.`,
                            created_at: serverTimestamp(),
                            referenced_type: "contract",
                            referenced_id: report?.contract_id,
                            unread: true,
                            receiver_id: response?.user_id,
                        });

                    } catch (e) {
                        console.error(e);
                    } finally {
                        setIsRejectSubmitting(false);
                        Swal.fire({
                            icon: "success",
                            title: "Report Processed",
                            text: "The report has been processed successfully.",
                            confirmButtonText: "OK",
                        });
                    }
                }
            });
        }

    };

    const handleApprove = async () => {
        if (report.report_type === "contract") {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Approve Report?',
                html: `
            Approving this report will have the following consequences:
            <ul class="mb-5 mt-5" style="text-center: left;">
                <li>The reported account may be banned or terminated.</li>
                <li>If the planner has an active escrow for the contract, it will be refunded within 2-3 days.</li>
            </ul>
            Are you sure you want to proceed?
        `,
                showCancelButton: true,
                confirmButtonText: 'Yes, approve',
                cancelButtonText: 'Cancel',
            });

            if (result.isConfirmed) {
                setIsApproveSubmitting(true);
                try {


                    if (data && report.reporter_role === "Event Planner") {
                        await createRefund(data, report.contract_id)
                    }

                    await addDoc(collection(db, "notifications"), {
                        avatar: 'A',
                        title: "Report Approved",
                        message: `The reported ${report?.reporter_role === "Event Planner" ? 'supplier' : 'event planner'} account will be terminated or banned. Any escrow or contracts affected will be refunded within 2-3 days.`,
                        created_at: serverTimestamp(),
                        referenced_type: "report",
                        referenced_id: report?.id,
                        unread: true,
                        receiver_id: report?.user_id,
                    });

                    await updateDoc(doc(db, 'reports', report?.id), {
                        status: 'approved',
                    });

                    await updateDoc(doc(db, "contracts", report.contract_id), {
                        status: 'Cancelled'
                    })

                    await updateDoc(doc(db, 'users', id), {
                        reported_history: arrayUnion({
                            reason: report.penalty_applied,
                            date: new Date()
                        }),
                        reportedAttempts: selectedUser?.reportedAttempts + 1,
                    })

                    if (selectedUser.reportedAttempts === 3) {
                        await updateDoc(doc(db, 'users', id), {
                            status: 'banned'
                        })

                        if (selectedUser.role === 'Event Planner') {
                            for (const e of userEvents) {
                                await updateDoc(doc(db, 'events', e.id), {
                                    status: "banned"
                                })
                            }
                        }

                        if (selectedUser.role === 'Supplier') {
                            await updateDoc(doc(db, 'shops', id), {
                                status: "banned"
                            })
                        }
                    }

                    if (selectedUser.reportedAttempts === 2) {
                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            title: "Warning Issued",
                            message: `Your account has received a warning due to a reported incident. If similar behavior occurs again, your account may be suspended or permanently banned.`,
                            created_at: serverTimestamp(),
                            referenced_type: "report",
                            referenced_id: report?.id,
                            unread: true,
                            receiver_id: id,
                        });
                    }

                    if (report.reporter_role === "Supplier") {
                        Swal.fire({
                            icon: "success",
                            title: "Report Processed",
                            text: "The report has been processed successfully.",
                            confirmButtonText: "OK",
                        });
                    }
                } catch (err) {
                    console.error(err);
                    setIsApproveSubmitting(false);
                } finally {
                    setIsApproveSubmitting(isLoading);
                }
            }
        }

        if (report.report_type === "delivery") {
            Swal.fire({
                icon: 'warning',
                title: 'Approve Report?',
                html: `
        Approving this report will apply the corresponding penalties to the supplier involved.
        <ul class="mb-5 mt-5" style="text-align: left;">
            <li>The supplier’s account may receive deductions or penalty points based on the report.</li>
            <li>Any applicable contract deductions will be reflected in the final payment summary.</li>
            <li>This action cannot be undone once confirmed.</li>
        </ul>
        Are you sure you want to proceed?
    `,
                showCancelButton: true,
                confirmButtonText: 'Yes, approve',
                cancelButtonText: 'Cancel',
            }).then(async (r) => {
                if (r.isConfirmed) {
                    setIsApproveSubmitting(true);
                    try {
                        await updateDoc(doc(db, "reports", report.id), {
                            status: "solved",
                            updated_at: serverTimestamp(),
                        })

                        await updateDoc(doc(db, "deliveries", report.delivery_id), {
                            penalty_applied: report.penalty_applied,
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            title: "Report Approved",
                            message: `The report for this delivery has been approved. Penalties have been applied to the supplier based on the reported issue and will be reflected in their payment summary.`,
                            created_at: serverTimestamp(),
                            referenced_type: "contract",
                            referenced_id: report?.contract_id,
                            unread: true,
                            receiver_id: report?.user_id,
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: 'A',
                            title: "Report Approved",
                            message: `The report for this delivery has been approved. Penalties have been applied to the supplier based on the reported issue and will be reflected in their payment summary.`,
                            created_at: serverTimestamp(),
                            referenced_type: "contract",
                            referenced_id: report?.contract_id,
                            unread: true,
                            receiver_id: report?.recipient_id,
                        });
                    }
                    catch (e) {
                        console.error(e)
                    }
                    finally {
                        setIsApproveSubmitting(false);
                        Swal.fire({
                            icon: "success",
                            title: "Report Processed",
                            text: "The report has been processed successfully.",
                            confirmButtonText: "OK",
                        });
                    }
                }
            });
        }
    };

    return (
        <>
            <Button
                onClick={open}
                className="py-1 rounded-lg px-6 text-white transition-all hover:bg-blue-700 bg-blue-600"
            >
                Review
            </Button>

            {/* First Dialog */}
            <Dialog open={isOpen} as="div" className="relative z-[999]" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel transition className="w-full max-w-3xl z-10 rounded-2xl bg-white shadow-2xl p-8 duration-200 relative">
                            {/* Close Button */}
                            <button
                                onClick={close}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    Report Details
                                </h2>
                                <p className="text-gray-600">
                                    Review the issue and provide your decision below.
                                </p>
                            </div>

                            <LoadingOverlay isLoading={isLoading || isApprovedSubmitting || isRejectSubmitting} message='Do not refresh until it’s done...' />

                            {/* Penalty */}
                            <div className="mb-6">
                                <div className='flex justify-between'>
                                    <h3 className="text-md font-semibold text-gray-800 mb-2">
                                        Penalty Applied
                                    </h3>

                                    <div className="text-md font-semibold text-gray-800 flex items-center mb-2 gap-1">
                                        Status: <span className={`rounded-full py-1 px-3 ${statusStyles[report?.status]}`}>{report?.status.charAt(0).toUpperCase() + report?.status.slice(1)}</span>
                                    </div>
                                </div>
                                {report?.penalty_applied ? (
                                    <div className="w-full p-5 bg-gray-100 border border-gray-200 shadow rounded-lg">
                                        {report.penalty_applied}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No issue listed.</p>
                                )}
                            </div>

                            {/* Issue */}
                            <div className="mb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-2">
                                    Issue
                                </h3>
                                {(report?.issue || report?.reason) ? (
                                    <div className="w-full p-5 bg-gray-100 border border-gray-200 shadow rounded-lg">
                                        {report.issue || report.reason}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No issue listed.</p>
                                )}
                            </div>

                            {/* Proof Section */}
                            <div className="mt-8">
                                <h3 className="text-md font-semibold text-gray-800 mb-3">
                                    Attachments
                                </h3>

                                {report?.proof && report.proof.length > 0 ? (
                                    <div className="flex flex-wrap gap-4">
                                        {report.proof.map((fileUrl, index) => (
                                            <div
                                                key={index}
                                                className="w-48 h-32 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition relative group"
                                            >
                                                <img
                                                    src={fileUrl}
                                                    alt={`Proof ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 flex items-end justify-center bg-black/0 hover:bg-black/30 transition group-hover:opacity-100"
                                                >
                                                    <span className="text-white text-xs mb-2 bg-black/60 px-2 py-1 rounded">
                                                        View
                                                    </span>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No attachments provided.</p>
                                )}

                                {response && (
                                    <>
                                        {/* reported response */}
                                        <div className="mb-6">
                                            <h3 className="text-md font-semibold text-gray-800 mb-2 mt-9">
                                                Supplier Response
                                            </h3>
                                            {(response?.issue || response?.reason) ? (
                                                <div className="w-full p-5 bg-gray-100 border border-gray-200 shadow rounded-lg">
                                                    {response.issue || response.reason}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No issue listed.</p>
                                            )}
                                        </div>

                                        {/* Proof Section */}
                                        <div className="mt-8">
                                            <h3 className="text-md font-semibold text-gray-800 mb-3">
                                                Proofs
                                            </h3>

                                            {response?.proof && response.proof.length > 0 ? (
                                                <div className="flex flex-wrap gap-4">
                                                    {response.proof.map((fileUrl, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-48 h-32 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition relative group"
                                                        >
                                                            <img
                                                                src={fileUrl}
                                                                alt={`Proof ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 flex items-end justify-center bg-black/0 hover:bg-black/30 transition group-hover:opacity-100"
                                                            >
                                                                <span className="text-white text-xs mb-2 bg-black/60 px-2 py-1 rounded">
                                                                    View
                                                                </span>
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No attachments provided.</p>
                                            )}

                                            {report?.admin_feedback?.length > 0 && (
                                                <div className="mt-8 mb-3">
                                                    <h3 className="text-md font-semibold text-gray-800 mb-2">
                                                        Admin Feedback
                                                    </h3>

                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {report?.admin_feedback ? (
                                    <div className="w-full p-5 bg-gray-100 border border-gray-200 shadow rounded-lg mt-5">
                                        {report.admin_feedback}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic mt-7">No admin feedback listed.</p>
                                )}

                                {userData.role === "Admin" && (report?.status !== "rejected" && report?.status !== "approved") && (
                                    < div className="flex space-x-4 pt-8">
                                        <button
                                            type="button"
                                            onClick={() => setIsRejectOpen(true)}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleApprove()}
                                            disabled={isApprovedSubmitting}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                                        >
                                            {isApprovedSubmitting ? (
                                                <div className='flex justify-center items-center gap-2'>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent self-center rounded-full animate-spin"></div> Processing..
                                                </div>
                                            ) : (
                                                "Approve"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </div >
            </Dialog >

            <Dialog
                open={isRejectOpen}
                as="div"
                className="relative z-[1000]"
                onClose={() => setIsRejectOpen(false)}
            >
                <div className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-md bg-white z-50 rounded-xl shadow-2xl p-6 relative">
                            <button
                                onClick={() => { setIsRejectOpen(false); setRejectReason('') }}
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
                            >
                                <X size={18} />
                            </button>

                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Reject Report
                            </h2>
                            <p className="text-gray-600 text-sm mb-4">
                                Please provide a reason for rejecting this report. This message
                                may be visible to the reporting user.
                            </p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-400 focus:outline-none text-sm"
                            ></textarea>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => { setIsRejectOpen(false); setRejectReason('') }}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={isRejectSubmitting || !rejectReason.trim()}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                                >
                                    {isRejectSubmitting ? "Processing..." : "Confirm Reject"}
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

