import { Dialog, DialogPanel, Button } from '@headlessui/react'
import { useState, useEffect, useRef } from 'react'
import { X, MapPin, MapPinOff, Truck, Phone } from 'lucide-react'
import UploadWidget from './UploadWidgen'
import Select from 'react-select'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import Swal from 'sweetalert2'
import AddressAutocomplete from './AddressAutoComplete'
import { serviceType } from '../constants/categories'
import { useFetchUserProfiles } from '../hooks/useProfile'
import LoadingOverlay from './LoadingOverlay'

export default function SubmissionModal({ contract, supplierData, eventData }) {
    const [isOpen, setIsOpen] = useState(false)
    const [picture, setPicture] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [note, setNote] = useState("")
    const [phoneNumber, setPhoneNumber] = useState('')
    const [deliveryType, setDeliveryType] = useState({
        value: "lalamove", label: "Lalamove"
    })
    const [pickup, setPickup] = useState({
        coordinates: { lat: null, lng: null },
        address: ""
    })
    const [dropoff, setDropoff] = useState({
        coordinates: { lat: null, lng: null },
        address: ""
    })
    const [quotation, setQuotation] = useState(null)
    const [servicePlan, setServicePlan] = useState(null)
    const [isDeliverBookingLoading, setIsDeliveryBookingLoading] = useState(false)
    const [isQuotationLoading, setIsQuotationLoading] = useState(false)
    const timeoutRef = useRef()
    const { userProfiles } = useFetchUserProfiles()
    const [phoneError, setPhoneError] = useState("");

    const eventUser = userProfiles?.find(u => u.id === eventData.user_id)

    const deliveryOptions = [
        { value: "lalamove", label: "Lalamove" },
        { value: "personal", label: "Personal Transportation" },
    ];

    console.log("+63" + supplierData.supplier_number.slice(1))

    function open() { setIsOpen(true) }

    function close() {
        setIsOpen(false)
        setNote('')
        setPicture([])
        setPickup({ coordinates: { lat: null, lng: null }, address: "" })
        setDropoff({ coordinates: { lat: null, lng: null }, address: "" })
        setQuotation(null)
        setDeliveryType({
            value: "lalamove",
            label: "Lalamove"
        })
    }


    const handleSubmit = async () => {
        if (!picture.length) return
        setIsSubmitting(true)

        try {
            await addDoc(collection(db, "deliveries"), {
                contract_id: contract?.id,
                supplier_id: contract?.supplier_id,
                status: "Pending",
                delivery_type: deliveryType,
                submitted_at: serverTimestamp(),
                delivered_date: serverTimestamp(),
                planned_date: eventData.event_date.date_value,
                confirmed_at: null,
                notes: note,
                proof: picture,
                pickup_location: pickup,
                dropoff_location: dropoff,
                created_at: serverTimestamp(),
                updated_at: null,
            })

            await addDoc(collection(db, "notifications"), {
                avatar: supplierData.supplier_name.charAt(0).toUpperCase(),
                message: `The supplier "${supplierData.supplier_name}" submitted a delivery for contract ID: ${contract?.id}.`,
                created_at: serverTimestamp(),
                sender_id: supplierData.id,
                referenced_type: 'contract',
                referenced_id: contract?.id,
                title: 'New delivery submission received.',
                unread: true,
                receiver_id: eventData.user_id
            })

            Swal.fire('Submitted Successfully', 'Your delivery has been submitted successfully.', 'success')

            // Reset state
            setIsOpen(false)
            setNote('')
            setPicture([])
            setPickup('')
            setDropoff('')
            setQuotation(null)
        } catch (e) {
            console.error(e)
            Swal.fire('Submission Failed', 'Something went wrong. Please try again.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBookDelivery = async () => {
        setIsDeliveryBookingLoading(true)

        if (phoneNumber.length < 11) {
            setPhoneError('Contact number must be exactly 11 digits.')
            setIsDeliveryBookingLoading(false)
            return
        }

        try {
            const res = await fetch("https://eventpro-backend-nodejs.onrender.com/create-delivery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: {
                        name: supplierData.supplier_name,
                        phone: "+63" + supplierData.supplier_number.slice(1)
                    },
                    recipients: {
                        name: eventData.event_name,
                        phone: "+63" + phoneNumber?.slice(1)
                    },
                    stops: quotation.stops,
                    quotationId: quotation.quotationId,
                    stopId: quotation.stops[0].stopId,
                    quotationData: quotation
                })
            })

            const data = await res.json()
            console.log(data)

            if (data) {
                await setDoc(doc(db, "deliveries", data.data.orderId), {
                    contract_id: contract?.id,
                    supplier_id: contract?.supplier_id,
                    status: "Assigning Driver",
                    submitted_at: serverTimestamp(),
                    delivered_at: null,
                    delivery_type: deliveryType,
                    delivery_service_type: servicePlan.value,
                    planned_date: eventData.event_date.date_value,
                    confirmed_at: null,
                    notes: note,
                    delivery_link: data.data.shareLink,
                    proof: null,
                    pickup_location: {
                        pickup,
                        sender: {
                            name: supplierData.supplier_name,
                            phone: "+63" + supplierData.supplier_number.slice(1)
                        }
                    },
                    dropoff_location: {
                        dropoff,
                        recipients: {
                            name: eventData.event_name,
                            phone: "+63" + phoneNumber?.slice(1)
                        },
                    },
                    courier: null,
                    created_at: serverTimestamp(),
                    updated_at: null,
                })

                Swal.fire({
                    icon: 'success',
                    title: 'Delivery Booking Successful',
                    text: 'Your delivery booking has been submitted successfully.'
                });

                close()
            }
        }
        catch (e) {
            setIsSubmitting(false)
            console.error(e)
            Swal.fire({
                icon: 'error',
                title: 'Delivery Booking Failed',
                text: 'Something went wrong. Please try again.'
            });
        }
    }

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }


        if (pickup?.address?.length && dropoff?.address?.length && servicePlan) {
            setIsQuotationLoading(true)

            timeoutRef.current = setTimeout(async () => {
                try {
                    const res = await fetch('https://eventpro-backend-nodejs.onrender.com/delivery-quotation', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            serviceType: servicePlan.value,
                            stops: [
                                {
                                    coordinates: pickup.coordinates,
                                    address: pickup.address
                                },
                                {
                                    coordinates: dropoff.coordinates,
                                    address: dropoff.address
                                }
                            ]
                        })
                    })

                    const data = await res.json()

                    setQuotation(data.data)
                    setIsQuotationLoading(false)

                    console.log(data)
                } catch (e) {
                    console.error(e)
                    setIsQuotationLoading(false)
                }
            }, 700)
        }
    }, [pickup, dropoff, servicePlan])

    console.log(isQuotationLoading)

    return (
        <>
            <Button
                onClick={open}
                className="transition-all duration-100 hover:bg-blue-700 px-6 py-2 text-sm rounded-md bg-blue-600 text-white"
            >
                Submit Delivery
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-999" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                            <div className="relative px-8 py-6">
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                {isDeliverBookingLoading && (
                                    <LoadingOverlay isLoading={isDeliverBookingLoading} message='Processing...' />
                                )}

                                <div className='mt-5'>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                        Delivery Submission
                                    </h2>

                                    {/* Delivery Type */}
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className="flex gap-1 items-center">
                                            <Truck className="text-gray-500" size={20} />
                                            <span className="text-gray-900 font-semibold">Delivery Type</span>
                                        </div>
                                        <Select
                                            name="delivery_type"
                                            options={deliveryOptions}
                                            value={deliveryType}
                                            onChange={setDeliveryType}
                                            placeholder="Select delivery type"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    padding: "4px 0",
                                                    borderRadius: "8px",
                                                    borderColor: "#d1d5db",
                                                    "&:hover": {
                                                        borderColor: "#d1d5db",
                                                    },
                                                }),
                                            }}
                                        />
                                    </div>

                                    {/* LALAMOVE FORM */}
                                    {deliveryType?.value === "lalamove" && (
                                        <div className="space-y-5">
                                            {/* Pickup */}
                                            <div>
                                                <div className="flex gap-1 items-center mb-2">
                                                    <MapPin className="text-gray-500" size={20} />
                                                    <span className="text-gray-900 font-semibold">Pick Up</span>
                                                </div>
                                                <AddressAutocomplete
                                                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus:outline-none"
                                                    setLocation={(value) =>
                                                        setPickup((prev) => ({ ...prev, address: value }))
                                                    }
                                                    default_location={pickup.address}
                                                    setCoords={(value) =>
                                                        setPickup((prev) => ({
                                                            ...prev,
                                                            coordinates: { lat: value.lat, lng: value.lon },
                                                        }))
                                                    }
                                                />
                                            </div>

                                            {/* Dropoff */}
                                            <div>
                                                <div className="flex gap-1 items-center mb-2">
                                                    <MapPinOff className="text-gray-500" size={20} />
                                                    <span className="text-gray-900 font-semibold">Drop Off</span>
                                                </div>
                                                <AddressAutocomplete
                                                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus:outline-none"
                                                    setLocation={(value) =>
                                                        setDropoff((prev) => ({ ...prev, address: value }))
                                                    }
                                                    default_location={dropoff.address}
                                                    setCoords={(value) =>
                                                        setDropoff((prev) => ({
                                                            ...prev,
                                                            coordinates: { lat: value.lat, lng: value.lon },
                                                        }))
                                                    }
                                                />
                                            </div>

                                            {/* Service Type */}
                                            <div>
                                                <div className="flex gap-1 items-center mb-2">
                                                    <Truck className="text-gray-500" size={20} />
                                                    <span className="text-gray-900 font-semibold">Service Type</span>
                                                </div>
                                                <Select
                                                    name="service_plan"
                                                    options={serviceType}
                                                    value={servicePlan}
                                                    onChange={setServicePlan}
                                                    placeholder="Select service type"
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            padding: "4px 0",
                                                            borderRadius: "8px",
                                                            borderColor: "#d1d5db",
                                                            "&:hover": {
                                                                borderColor: "#d1d5db",
                                                            },
                                                        }),
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex gap-1 items-center mb-2">
                                                    <Phone className="text-gray-500" size={20} />
                                                    <span className="text-gray-900 font-semibold">Contact Number</span>
                                                </div>
                                                <input placeholder="Enter your contact number (e.g., 09123456789)"
                                                    value={phoneNumber || ""}
                                                    type="text"
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        setPhoneNumber(value);
                                                    }}
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    pattern="[0-9]*"
                                                    className='w-full py-3 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus:outline-none' />
                                                {phoneError && (
                                                    <span className='ml-1 mt-1 block text-sm text-red-600'>{phoneError}</span>
                                                )}
                                            </div>
                                            {/* Quotation */}
                                            <div className="font-medium text-gray-700">
                                                Estimated Cost:{" "}
                                                {isQuotationLoading ? (
                                                    <div className="ml-3 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin inline-block"></div>
                                                ) : (
                                                    `₱${quotation?.priceBreakdown.total ?? 0}`
                                                )}
                                            </div>

                                            {/* Notes */}
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Additional Information (Optional)"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px]"
                                            />

                                            {/* Submit */}
                                            <button
                                                onClick={handleBookDelivery}
                                                className={`transition-all flex ml-auto py-2 px-5 rounded-md text-white w-full sm:w-auto ${isSubmitting ||
                                                    !pickup.address ||
                                                    !dropoff.address
                                                    ? "bg-blue-400"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {isSubmitting ? "Booking..." : "Book delivery"}
                                            </button>
                                        </div>
                                    )}

                                    {/* PERSONAL TRANSPORTATION */}
                                    {deliveryType?.value === "personal" && (
                                        <div className="mt-6 space-y-6">
                                            {/* Notes */}
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Additional Information (Optional)"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px]"
                                            />

                                            <div>
                                                <h3 className="text-md font-semibold text-gray-800 mb-3">
                                                    Upload & Submit
                                                </h3>
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                    <UploadWidget className="w-full sm:w-60" setPicture={setPicture} />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSubmit}
                                                className={`transition-all flex ml-auto py-2 px-5 rounded-md text-white w-full sm:w-auto ${isSubmitting ||
                                                    picture.length === 0
                                                    ? "bg-blue-400"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {isSubmitting ? "Delivering..." : "Submit Delivery"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
