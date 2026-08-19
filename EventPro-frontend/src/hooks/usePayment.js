import { setDoc, serverTimestamp, updateDoc, doc, addDoc, collection } from "firebase/firestore"
import { useState, useRef, } from "react"
import { db } from "../firebase/firebase"
import Swal from "sweetalert2"

export const useCreatePayment = () => {
    const [isProcessing, setIsProcessing] = useState(false)
    const payment_window_ref = useRef()
    const [invoiceUrl, setInvoiceUrl] = useState('')

    const createPayment = async (payment_data, supplierData) => {

        console.log(payment_data)
        setIsProcessing(true)

        const payment_terms = await Swal.fire({
            title: '<strong class="text-2xl font-bold text-gray-800">Payment Terms and Conditions</strong>',
            icon: 'info',
            html: `
    <div class="text-left max-h-[300px] overflow-y-auto pr-2">
        <h4 class="text-lg font-semibold text-gray-700 mt-4">1. Payment Method</h4>
        <p class="text-gray-600 mb-3">
            Payments for event contracts must be made securely through the platform’s approved payment channels. 
            Accepted methods include credit/debit cards, Gcash, Maya and other supported digital payment services.
        </p>

        <h4 class="text-lg font-semibold text-gray-700 mt-4">2. Payment Schedule</h4>
        <p class="text-gray-600 mb-3">
            Payment must be completed before the supplier begins providing the agreed services. 
            In some cases, a partial deposit may be required, followed by full payment before the event date.
        </p>

        <h4 class="text-lg font-semibold text-gray-700 mt-4">3. Refund and Cancellation Policy</h4>
        <p class="text-gray-600 mb-3">
            If a contract is canceled by the planner before the supplier begins the service, the planner may request a refund. 
            However, any applicable transaction, processing, or platform fees will not be included in the refund amount.
            <br><br>
            In cases of non-delivery or breach of contract by the supplier, the planner will receive a full refund of the paid amount.
        </p>

        <div class="flex items-center mt-4">
            <input type="checkbox" id="acceptTerms" class="mt-1 mr-2">
            <label for="acceptTerms" class="text-gray-700">I agree to the event contract payment terms and conditions</label>
        </div>
    </div>
    `,
            showCancelButton: true,
            confirmButtonText: "Pay Contract",
            showConfirmButton: true,
            width: '800px',
            preConfirm: () => {
                const isChecked = document.getElementById("acceptTerms").checked;
                if (!isChecked) {
                    Swal.showValidationMessage("You must accept the terms to proceed");
                    return false;
                }
                return true;
            }
        });


        if (payment_terms.isConfirmed) {
            try {
                const response = await fetch("https://eventpro-backend-python.onrender.com/api/v1/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        external_id: payment_data.external_id,
                        net_amount: payment_data.amount,
                        payer_email: payment_data.event_email,
                        payment_method: payment_data.payment_method,
                    })
                })

                const data = await response.json()

                console.log(data)

                setInvoiceUrl(data.invoice_url)
                const invoice_id = data?.data?.id

                payment_window_ref.current = window.open(data.invoice_url, "_blank")

                const checkStatus = setInterval(async () => {
                    const res = await fetch(`https://eventpro-backend-python.onrender.com/api/v1/payment/check-status?id=${invoice_id}`)
                    const status = await res.json()

                    await setDoc(doc(db, "transactions", invoice_id), {
                        external_id: payment_data.external_id,
                        contract_id: payment_data.contract_id || null,
                        user_id: payment_data.user_id,
                        payment_method: payment_data.payment_method,
                        event_id: payment_data.event_id,
                        event_email: payment_data.event_email,
                        event_contact: payment_data.contact_number ?? 0,
                        amount: payment_data.amount,
                        process_fee: payment_data.process_fee,
                        type: "ESCROW",
                        status: "PENDING",
                        created_at: serverTimestamp()
                    })

                    try {
                        if (status.status === "PAID") {
                            setIsProcessing(false)
                            updateDoc(doc(db, "transactions", invoice_id), {
                                status: "HOLD"
                            })

                            await addDoc(collection(db, "notifications"), {
                                avatar: payment_data.event_name.charAt(0).toUpperCase(),
                                message: `The event "${payment_data.event_name}" has successfully completed the partial payment for Contract ID: ${payment_data.contract_id}.`,
                                created_at: serverTimestamp(),
                                reference_id: supplierData.id,
                                title: 'Payment Received',
                                unread: true,
                                user_id: supplierData.id
                            })

                            Swal.fire('Payment Successful', 'Your payment has been processed successfully.', 'success')


                            clearInterval(checkStatus)

                        }

                        else if (status.status === "EXPIRED") {
                            setIsProcessing(false)

                            updateDoc(doc(db, "transactions", invoice_id), {
                                status: "FAILED"
                            })

                            clearInterval(checkStatus)
                        }
                    }
                    catch (e) {
                        console.error(e)
                        clearInterval(checkStatus)
                    }

                    console.log(status)
                }, 3000)

            }
            catch (e) {
                console.error(e)
                Swal.fire(
                    'Something went wrong',
                    'There was a problem processing your payment. Please try again.',
                    'error'
                )
                setIsProcessing(false)

            }

        }
        else {
            setIsProcessing(false)
        }

    }

    return { createPayment, isProcessing, invoiceUrl }
}
