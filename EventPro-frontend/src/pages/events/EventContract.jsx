import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useParams } from "react-router-dom";
import { Title } from "react-head";
import PrimaryButton from "../../components/PrimaryButton";
import { useFetchSupplierById } from "../../hooks/useSupplier";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { termsOfCondition } from "../../constants/categories";
import { useFetchSupplierServices } from "../../hooks/useSupplier";
import { useFetchEvents } from "../../hooks/useEvents";
import PageLoading from "../../components/PageLoading";
import { useFetchAllApplication } from "../../hooks/useApplication";

export default function EventContract({ userData }) {

    const { eventId, supplierId } = useParams()
    const navigate = useNavigate()
    const { supplier, isLoading: isSupplierLoading } = useFetchSupplierById(supplierId)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [error, setError] = useState(false)
    const [additional_information, setAdditional_Information] = useState("")
    const { services: shopServices, isLoading: isServiceLoading } = useFetchSupplierServices()
    const { events, isLoading: isEventsLoading } = useFetchEvents()
    const { applications: userApplication } = useFetchAllApplication()
    const [selectedService, setSelectedService] = useState()

    const currentEvent = events.find(event => event.id === eventId)

    const services = shopServices.filter(serv => serv.supplier_id === supplierId)

    const isAllLoading = isEventsLoading || isServiceLoading || isSupplierLoading

    useEffect(() => {
        if (services.length === 1 && !selectedService) {
            setSelectedService(services[0]);
            setError(false);
        }
    }, [shopServices]);

    const application = userApplication.find(app => app.event_id === eventId && app.supplier_id === supplierId)

    const goToNextStep = () => {
        if (!selectedService) {
            setError(true)
            return
        }

        setCurrentStep(2)
    }

    const goToPreviousStep = () => {
        setCurrentStep(1)
        setError(false)
    }

    const handleSubmit = async () => {
        Swal.fire({
            title: 'Send Contract Offer?',
            text: "You're about to send a contract offer to the selected supplier. This action confirms your proposed terms and initiates the agreement process.",
            showConfirmButton: true,
            confirmButtonText: 'Send Offer',
            showCancelButton: true,
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            if (result.isConfirmed) {
                try {
                    setIsSubmitting(true)
                    const applicationRef = application?.id

                    const newContractRef = await addDoc(collection(db, "contracts"), {
                        supplier_id: supplierId,
                        event_id: eventId,
                        planner_id: userData?.id,
                        service_plan: selectedService,
                        penalty_clauses: termsOfCondition,
                        additional_information: additional_information,
                        created_at: serverTimestamp(),
                        status: 'Pending'
                    })

                    if (!applicationRef) {
                        await addDoc(collection(db, "applications"), {
                            supplier_id: supplierId,
                            event_id: eventId,
                            applied_at: serverTimestamp(),
                            status: 'Approved'
                        })
                    }

                    if (applicationRef) {
                        updateDoc(doc(db, "applications", applicationRef), {
                            status: "Approved",
                            approve_at: serverTimestamp()
                        })
                    }

                    await addDoc(collection(db, "notifications"), {
                        avatar: currentEvent.event_name.charAt(0).toUpperCase(),
                        message: `The event planner for "${currentEvent.event_name}" applied for your service.`,
                        created_at: serverTimestamp(),
                        sender_id: currentEvent.user_id,
                        referenced_type: 'contract',
                        referenced_id: newContractRef?.id,
                        title: 'New service application received.',
                        unread: true,
                        receiver_id: supplierId
                    })

                    Swal.fire({
                        icon: 'success',
                        title: 'Offer Sent Successfully',
                        text: 'Your offer has been sent to the supplier. You will be notified once it is approved.',
                        confirmButtonText: 'OK',
                        timer: 2000,
                    });

                    setIsSubmitting(false)

                    return navigate(`/events/edit/${eventId}`)

                }
                catch (e) {
                    console.error(e)
                    setIsSubmitting(false)

                }
                finally {
                    setIsSubmitting(false)
                }
            }
        })
    }

    return (
        <>
            <Title>Contract</Title>
            {isAllLoading && (
                <PageLoading />
            )}

            {!isAllLoading && (
                <div className="max-w-5xl mx-auto px-4">
                    {/* Step Container with Fixed Height */}
                    <div className="relative min-h-[750px]">

                        {/* Step 1: Role Selection */}
                        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentStep === 1
                            ? 'opacity-100 translate-x-0 pointer-events-auto'
                            : 'opacity-0 -translate-x-8 pointer-events-none'
                            }`}>
                            <div className="flex flex-col items-center text-center px-15">
                                <h1 className="font-bold text-3xl mb-3">{supplier.supplier_name} Service Plan</h1>
                                <p className="text-gray-600 mb-5">
                                    Choose a service plan and start connecting with suppliers today.
                                </p>

                                {/* Role Selection Cards */}
                                <div className="w-full flex gap-3 max-w-5xl mb-6">
                                    {services?.map((service, index) => {
                                        const selected = service.service_plan === selectedService?.service_plan
                                        return (
                                            <button
                                                key={index}
                                                className={`w-full flex flex-col bg-gray-50 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${selected
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : error
                                                        ? 'border-red-300'
                                                        : 'border-gray-200'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    if (selectedService === service) {
                                                        setSelectedService(null)
                                                    }
                                                    setError(false);
                                                }}
                                            >
                                                <div>
                                                    <div className="rounded-t-md bg-blue-600 text-white">
                                                        <h3 className="font-bold text-2xl text-center py-5">{service.service_plan.label}</h3>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <p className="text-gray-900 text-2xl font-bold leading-relaxed mt-3">
                                                            ₱{service.service_price}.0/deliver
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-between gap-3 h-full space-x-4">

                                                    <div className="text-left px-6 mt-3">
                                                        {service?.service_inclusions?.map((inclusion, index) => (
                                                            <div className="flex gap-3 space-y-3" key={index}>
                                                                <Check className="text-green-400" />
                                                                <span className="flex text-sm text-gray-600" >{inclusion}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div>
                                                        <div className="px-6 text-left">
                                                            <hr className="border-b-0 border-gray-400 mb-1" />
                                                            <span className="text-left text-sm text-gray-600">Note: {service.service_payment_notice.label}</span>
                                                        </div>

                                                        <div className="px-6 mb-3 mt-2">
                                                            <div className={`rounded py-2 w-full ${selected ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>{selected ? <div className="flex text-center justify-center items-center gap-2"><Check size={20} /> Selected</div> : 'Select Plan'}</div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {error && (
                                    <p className="text-red-600 text-sm mb-4">
                                        Please select a service plan first
                                    </p>
                                )}

                                <PrimaryButton className={'max-w-md'} onClick={goToNextStep} >
                                    Proceed to Contract Details
                                </PrimaryButton>
                            </div>
                        </div>

                        {/* Step 2: Registration Form */}
                        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentStep === 2
                            ? 'opacity-100 translate-x-0 pointer-events-auto'
                            : 'opacity-0 translate-x-8 pointer-events-none'
                            }`}>

                            <div className="flex flex-col items-center">
                                <div className="text-center mb-5">
                                    <h1 className="font-bold text-3xl mb-3">Contract</h1>
                                    <p className="text-gray-600">
                                        Finalize your agreement to begin your partnership with this supplier.
                                    </p>
                                </div>

                                <div className="bg-white max-w-3xl p-6 rounded-2xl shadow-lg border border-gray-200 w-full">

                                    {/* selected plan */}
                                    <div className="w-full flex justify-between bg-gray-50 py-6 border border-gray-300 rounded-lg px-7">
                                        <div className="flex flex-col">
                                            <span className="block text-lg font-bold text-gray-800">
                                                Selected Plan: {selectedService?.service_plan?.label}
                                            </span>
                                            <span className="block text-gray-600">
                                                ₱ {selectedService?.service_price}.0
                                            </span>
                                        </div>
                                        <button onClick={goToPreviousStep} className="text-blue-600 ">Change Plan</button>
                                    </div>

                                    {/* penlaties for service failure */}
                                    <div className="w-full h-[300px] rounded-lg overflow-y-auto bg-gray-50 p-6 mt-5 border border-gray-300">
                                        <p className="font-bold text-lg">{termsOfCondition.title}</p>

                                        <span className="text-gray-600 mt-3 block">{termsOfCondition.description}</span>

                                        {termsOfCondition.clauses.map((clause, index) => (
                                            <div className="mb-3" key={index}>
                                                <span className="text-gray-700 mt-5 block font-semibold">{index + 1}. {clause.title}</span>
                                                {clause?.details?.map((details, index) => (
                                                    <p className="text-gray-600 mt-2" key={index}>{details}</p>
                                                ))}
                                            </div>

                                        ))}
                                    </div>

                                    {/* additional information (optional) */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Information (Optional)
                                        </label>
                                        <textarea
                                            onChange={(e) => setAdditional_Information(e.target.value)}
                                            name="additional_information"
                                            className="w-full p-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px]"
                                            placeholder="Enter any additional requirements or notes..."
                                        />
                                    </div>

                                    <button disabled={isSubmitting} className={`mt-3 py-2 w-full transition-all duration-200 text-white rounded-md  ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={() => handleSubmit()}>{isSubmitting ?
                                        <div className="flex justify-center items-center space-x-3">
                                            <div className="h-4 w-4 rounded-full border-t-2  border-white animate-spin"></div>
                                            <span>
                                                Submitting..
                                            </span>
                                        </div>
                                        : 'Send Offer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}