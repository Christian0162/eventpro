import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../firebase/firebase";
import { useState } from "react";

export const useCreatePayout = () => {
    const [isLoading, setIsLoading] = useState(false)

    const createPayout = async (credentials, userData) => {

        console.log(credentials.account_holder_name)
        Swal.fire({
            title: "Are you sure?",
            text: "You are about to withdraw ₱" + credentials.amount,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, withdraw it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsLoading(true)
                const response = await fetch("https://eventpro-backend-python.onrender.com/api/v1/payout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reference_id: "Payout-" + credentials.user_id,
                        amount: credentials.amount,
                        channel_code: credentials.channel_code,
                        account_number: credentials.account_number,
                        account_holder_name: credentials.account_holder_name
                    })
                })

                const data = await response.json()
                console.log(data)

                const payout_id = data.id
                const checkStatus = setInterval(async () => {
                    const res = await fetch(`https://eventpro-backend-python.onrender.com/api/v1/payout/check-status/${payout_id}`)
                    const status = await res.json()

                    console.log(status)
                    try {
                        if (status.status === "SUCCEEDED") {
                            await setDoc(doc(db, "transactions", payout_id), {
                                contract_id: null,
                                transaction_id: payout_id,
                                user_id: credentials.user_id,
                                payment_method: credentials.channel_code,
                                user_email: credentials.user_email,
                                user_contract: credentials.account_number ?? 0,
                                amount: credentials.amount,
                                process_fee: 0,
                                type: "WITHDRAWN",
                                status: "SUCCEEDED",
                                created_at: serverTimestamp()
                            })

                            await updateDoc(doc(db, 'users', credentials.user_id), {
                                balance: userData.balance - credentials.amount
                            })

                            Swal.fire({
                                icon: 'success',
                                title: 'Success!',
                                text: 'Your withdrawal request has been submitted successfully.',
                            });
                            clearInterval(checkStatus)
                            setIsLoading(false)
                        }
                    }

                    catch (e) {
                        console.error(e)
                        clearInterval(checkStatus)
                        setIsLoading(false)
                    }
                }, 3000)

            }
        });
    };

    return { createPayout, isLoading }
}