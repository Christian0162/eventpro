import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase/firebase";
import Swal from "sweetalert2";
import { useFetchAllTransaction } from "./useTransaction";

export const useCreateRefund = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { transactions } = useFetchAllTransaction()

    const createRefund = async (transaction, contract_id) => {
        setIsLoading(true);
        try {
            const response = await fetch("https://eventpro-backend-python.onrender.com/api/v1/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refund: transaction }),
            });
            const data = await response.json();
            console.log("data:", data);

            const refund_ids = data?.data?.map(r => r.id) || [];

            if (refund_ids.length === 0) {
                setIsLoading(false);
                Swal.fire({
                    icon: "error",
                    title: "Refund Failed",
                    text: "No refund IDs were created. Please check the transaction.",
                });
                return;
            }

            let hasShownSuccess = false;

            // Start polling
            const checkStatus = setInterval(async () => {
                console.log("Checking refund status...");
                try {
                    const res = await fetch("https://eventpro-backend-python.onrender.com/api/v1/refund/status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refund_ids }),
                    });
                    const status = await res.json();
                    console.log("status:", status);

                    const refunds = status?.data || [];
                    const allSucceeded = refunds.every(r => r.status === "SUCCEEDED");

                    if (allSucceeded && !hasShownSuccess) {
                        hasShownSuccess = true
                        // Update all relevant docs
                        for (const t of transaction) {
                            await updateDoc(doc(db, "transactions", t.invoice_id), {
                                status: "REFUNDED",
                                updated_at: serverTimestamp(),
                            });
                        }

                        clearInterval(checkStatus);
                        setIsLoading(false);

                        Swal.fire({
                            icon: "success",
                            title: "Refund Completed",
                            text: "All refunds have been successfully processed.",
                            confirmButtonText: "OK",
                        });



                    }
                } catch (e) {
                    console.error("Error checking refund status:", e);
                    clearInterval(checkStatus);
                    setIsLoading(false);
                    Swal.fire({
                        icon: "error",
                        title: "Refund Error",
                        text: "Something went wrong while checking refund status.",
                    });
                }
            }, 3000);
        } catch (e) {
            console.error("Refund request failed:", e);
            Swal.fire({
                icon: "error",
                title: "Refund Request Failed",
                text: "Unable to initiate refund. Please try again later.",
            });
        }
    };

    return {
        isLoading,
        createRefund,
    };
};
