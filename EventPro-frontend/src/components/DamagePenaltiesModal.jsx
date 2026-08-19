import { Button, Dialog, DialogPanel } from "@headlessui/react";
import { X } from "lucide-react";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Swal from "sweetalert2";
import UploadWidget from "./UploadWidgen";

export default function DamagePenaltiesModal({ delivery, contractData, userData, deliveryId, onSuccess, eventData, type, report }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [penalties, setPenalties] = useState({
        lateDelivery: false,
        serviceNonConformity: false,
        damageType: "",
    });
    const [error, setError] = useState("");
    const [reason, setReason] = useState(""); // ✅ Added reason state
    const [proofFiles, setProofFiles] = useState([]);

    const open = () => {
        setIsOpen(true);
        setError("");
        setReason("");
    };

    const close = () => {
        if (loading) return;
        setIsOpen(false);
        setError("");
        setPenalties({
            lateDelivery: false,
            serviceNonConformity: false,
            damageType: "",
        });
        setReason("");
    };

    const handleCheckboxChange = (e) => {
        const { id, checked } = e.target;
        setPenalties((prev) => ({
            ...prev,
            [id]: checked,
            ...(id === "serviceNonConformity" && !checked ? { damageType: "" } : {}),
        }));
    };

    const handleSubmit = async () => {
        if (!type) {
            const { lateDelivery, serviceNonConformity, damageType } = penalties;

            if (!lateDelivery && !serviceNonConformity) {
                setError("Please select at least one issue.");
                return;
            }

            if (serviceNonConformity && !damageType) {
                setError("Please specify the type of damage.");
                return;
            }

            if (proofFiles.length === 0) {
                setError("Please provide a proof to proceed.");
                return;
            }

            if (!reason.trim()) {
                setError("Please provide a brief review or reason for issuing the report.");
                return;
            }

            if (!proofFiles) {
                setError("Please provide a proof to proceed.");
                return;
            }

            setError("");

            const penaltyDetails = [];
            if (lateDelivery)
                penaltyDetails.push("Late Delivery: 0.5% of contract value per day (max 10-20%)");
            if (serviceNonConformity)
                penaltyDetails.push(
                    `Service Non-Conformity: ${damageType === "bad"
                        ? "Badly Damaged (50%) – full deduction or replacement"
                        : "Slight Damage (5%) – partial deduction based on repair cost"
                    }`
                );

            Swal.fire({
                title: "Confirm Issue Report",
                html: `
                <div style="text-align:left;">
                    <p><strong>Selected Issues:</strong></p>
                    <ul style="margin-left: 20px; text-align:left;">
                        ${penaltyDetails.map((d) => `<li>${d}</li>`).join("")}
                    </ul>
                    <p style="margin-top:10px;"><strong>Review/Reason:</strong> ${reason}</p>
                </div>
                <p class="mt-3 text-gray-600">Are you sure you want to apply these issue details?</p>
            `,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, Confirm",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#6b7280",
                showLoaderOnConfirm: true,
                allowOutsideClick: () => !Swal.isLoading(),
                preConfirm: async () => {
                    try {
                        setLoading(true);
                        const deliveryRef = doc(db, "deliveries", deliveryId);

                        await addDoc(collection(db, "reports"), {
                            user_id: userData.id,
                            contract_id: contractData.id,
                            delivery_id: deliveryId,
                            reporter_role: userData?.role,
                            penalty_applied: penaltyDetails,
                            status: 'pending',
                            reason: reason,
                            report_type: 'delivery',
                            recipient_id: contractData.supplier_id,
                            proof: proofFiles,
                            created_at: serverTimestamp(),
                        });

                        await updateDoc(deliveryRef, {
                            status: "Issued",
                            updated_at: serverTimestamp(),
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: eventData?.event_name.charAt(0).toUpperCase(),
                            message: `The planner has reported issues with your delivery for the event "${eventData?.event_name}". Reason: "${reason}" Please review the penalties applied.`,
                            created_at: serverTimestamp(),
                            referenced_type: 'contract',
                            referenced_id: delivery?.contract_id,
                            title: "Delivery Issue Reported",
                            sender_id: eventData.user_id,
                            unread: true,
                            feedback: reason,
                            receiver_id: delivery?.supplier_id
                        });
                        return true;
                    } catch (error) {
                        Swal.showValidationMessage(`Error: ${error.message}`);
                        return false;
                    } finally {
                        setLoading(false);
                    }
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "Issues Recorded",
                        text: "The delivery issues have been successfully applied.",
                        icon: "success",
                        confirmButtonColor: "#2563eb",
                    });
                    if (onSuccess) onSuccess();
                    close();
                }
            });
        } else {
            Swal.fire({
                title: "Confirm Issue Report",
                html: `
                <div style="text-align:left;">
                    <p style="margin-top:10px;"><strong>Review/Reason:</strong> ${reason}</p>
                </div>
                <p class="mt-3 text-gray-600">Are you sure you want to apply these issue details?</p>
            `,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, Confirm",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#6b7280",
                showLoaderOnConfirm: true,
                allowOutsideClick: () => !Swal.isLoading(),
                preConfirm: async () => {
                    try {
                        setLoading(true);

                        await addDoc(collection(db, "reports"), {
                            user_id: userData.id,
                            contract_id: contractData.id,
                            delivery_id: deliveryId,
                            reporter_role: userData?.role,
                            reason: reason,
                            report_type: 'delivery',
                            recipient_id: contractData.supplier_id,
                            proof: proofFiles,
                            created_at: serverTimestamp(),
                        });

                        await updateDoc(doc(db, "reports", report.id), {
                            status: "under_review"
                        });

                        await addDoc(collection(db, "notifications"), {
                            avatar: eventData?.event_name.charAt(0).toUpperCase(),
                            message: `You have submitted a response regarding the delivery issue for the contract. Please wait for further action from the admin.`,
                            created_at: serverTimestamp(),
                            referenced_type: 'contract',
                            referenced_id: delivery?.contract_id,
                            title: "Delivery Issue Response Submitted",
                            sender_id: eventData.user_id,
                            unread: true,
                            feedback: reason,
                            receiver_id: contractData?.planner_id
                        });


                        return true;
                    } catch (error) {
                        Swal.showValidationMessage(`Error: ${error.message}`);
                        return false;
                    } finally {
                        setLoading(false);
                    }
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "Issues Recorded",
                        text: "The delivery issues have been successfully applied.",
                        icon: "success",
                        confirmButtonColor: "#2563eb",
                    });
                    if (onSuccess) onSuccess();
                    close();
                }
            });
        }
    };

    return (
        <>
            <Button
                onClick={open}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
                text-white font-semibold py-2 px-5 rounded-md shadow-md hover:shadow-lg 
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
                {loading ? "Processing..." : type ? "Reject" : "Issue"}
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-1000 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/40 transition-opacity duration-300" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="overflow-hidden w-full max-w-2xl rounded-2xl bg-white shadow-2xl duration-300 ease-out"
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Report Delivery Issues</h2>
                                <button
                                    onClick={close}
                                    disabled={loading}
                                    className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {!type && (
                                    <>
                                        <p className="text-gray-700 font-medium">Please select applicable issues:</p>

                                        {/* Late Delivery */}
                                        <div className="p-3 border rounded-md">
                                            <label className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="lateDelivery"
                                                    checked={penalties.lateDelivery}
                                                    onChange={handleCheckboxChange}
                                                    disabled={loading}
                                                    className="mr-2 accent-blue-600"
                                                />
                                                <span className="font-medium text-gray-800">Late Delivery</span>
                                            </label>
                                            <p className="text-sm text-gray-600 ml-6">
                                                0.5% of total contract value per day of delay (max 10-20%)
                                            </p>
                                        </div>

                                        {/* Service Non-Conformity */}
                                        <div className="p-3 border rounded-md">
                                            <label className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="serviceNonConformity"
                                                    checked={penalties.serviceNonConformity}
                                                    onChange={handleCheckboxChange}
                                                    disabled={loading}
                                                    className="mr-2 accent-blue-600"
                                                />
                                                <span className="font-medium text-gray-800">Service Non-Conformity</span>
                                            </label>
                                            <p className="text-sm text-gray-600 ml-6">
                                                Deduction of repair/replacement costs from payment
                                            </p>

                                            {penalties.serviceNonConformity && (
                                                <div className="ml-6 mt-3 space-y-2">
                                                    <p className="text-gray-700 font-medium">Select Damage Type:</p>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="damageType"
                                                            value="bad"
                                                            checked={penalties.damageType === "bad"}
                                                            onChange={(e) =>
                                                                setPenalties((prev) => ({
                                                                    ...prev,
                                                                    damageType: e.target.value,
                                                                }))
                                                            }
                                                            disabled={loading}
                                                            className="mr-2 accent-blue-600"
                                                        />
                                                        <span className="text-gray-800">Badly Damaged (50%)</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="damageType"
                                                            value="slight"
                                                            checked={penalties.damageType === "slight"}
                                                            onChange={(e) =>
                                                                setPenalties((prev) => ({
                                                                    ...prev,
                                                                    damageType: e.target.value,
                                                                }))
                                                            }
                                                            disabled={loading}
                                                            className="mr-2 accent-blue-500"
                                                        />
                                                        <span className="text-gray-800">Slight Damage (5%)</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* ✅ Reason textarea */}
                                <div className="p-3 border rounded-md">
                                    <label className="font-medium text-gray-800 mb-1 block">Review / Reason for Issuing</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Describe the issue or reason for applying penalties..."
                                        rows={3}
                                        disabled={loading}
                                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* ✅ Proof Upload */}
                                <div className="p-3 border rounded-md">
                                    <label className="font-medium text-gray-800 mb-1 block">Upload Proofs (images or documents)</label>
                                    <UploadWidget type={`proof`} setPicture={setProofFiles} />
                                </div>

                                {error && <p className="text-red-600 font-medium text-sm">{error}</p>}

                            </div>



                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={close}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 
                                    hover:bg-gray-100 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={`px-5 py-2 rounded-lg font-semibold text-white transition-all ${loading
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {loading ? "Saving..." : "Confirm"}
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
