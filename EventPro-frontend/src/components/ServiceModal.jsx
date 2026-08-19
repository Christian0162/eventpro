import { Button, Dialog, DialogPanel } from '@headlessui/react'
import { X, Container, MessageSquareWarning, SquarePen, PackagePlus, PhilippinePeso } from 'lucide-react'
import { useState } from 'react'
import Select from 'react-select'
import { planTypeOptions, paymentNoticeOptions } from '../constants/categories'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import Swal from 'sweetalert2'
import { useFetchSupplierServices } from '../hooks/useSupplier'

export default function ServiceModal({ userData, supplierData }) {

    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [service_plan, setService_plan] = useState(null)
    const [inclusions, setInclusions] = useState('')
    const [allInclusions, setAllInclusions] = useState([])
    const [price, setPrice] = useState('')
    const [payment_notice, setPayment_notice] = useState(null)
    const [error, setError] = useState('')
    const { services } = useFetchSupplierServices()

    function open() {
        setIsOpen(true)
    }
    function close() {
        setAllInclusions([])
        setPrice('')
        setService_plan(null)
        setPayment_notice(null)
        setIsOpen(false)
    }

    const supplierService = services.filter(serv => serv.supplier_id === userData.id)

    const hasReachedLimit = supplierService.length >= 2;

    // Filter out options that already exist
    const existingPlans = supplierService
        ? Object.values(supplierService).map(service => service.service_plan.value.toLowerCase())
        : []

    const filteredPlanOptions = planTypeOptions.filter(
        option => !existingPlans.includes(option.value.toLowerCase())
    )


    const handleInclusions = (inclusions) => {
        try {
            const trimmed = inclusions.trim()
            if (!trimmed) return

            setAllInclusions(prev => {
                if (prev.includes(inclusions)) {
                    setError('The item is already in the list.')
                    return prev
                }

                else {
                    setError('')
                    return [...prev, inclusions]
                }
            })
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setInclusions('')
        }
    }

    const removeInclusion = (inclusion) => {
        try {
            setAllInclusions(prev => {
                if (prev.includes(inclusion)) {
                    setError('')
                    return prev.filter(remove => remove !== inclusion)
                }
            })
        }

        catch (e) {
            console.error(e)
        }
    }

    const handleService = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (allInclusions.length === 0) {
                setError('Please add at least one inclusion.')
                setIsSubmitting(false)
                return
            }

            await addDoc(collection(db, "services"), {
                service_plan: service_plan,
                service_price: price,
                service_inclusions: allInclusions,
                service_payment_notice: payment_notice,
                supplier_id: userData.id
            })

            Swal.fire('Success!', 'Your service has been added successfully.', 'success')
            close()
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsSubmitting(false)
        }
    }


    return (
        <>
            {userData?.id === supplierData?.id && (
                <Button
                    onClick={open}
                    disabled={hasReachedLimit}
                    className={`flex items-center ml-auto gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md
                         ${hasReachedLimit
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                >
                    <Container size={16} />
                    <span className="hidden sm:block md:block lg:block">
                        {hasReachedLimit ? 'Service Limit Reached' : 'Make a Service'}
                    </span>
                </Button>
            )}

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl rounded-2xl mt-17 bg-white shadow-2xl duration-300"
                        >
                            <div className='relative px-10 py-7 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-blue-600">
                                        Service Plan Type
                                    </h2>
                                </div>
                                <p className="text-gray-600 text-sm">Designed to make things easier, so you can focus on what matters most.</p>
                            </div>

                            <form onSubmit={handleService}>
                                <div className='flex flex-col px-10 py-5'>
                                    <div className='relative flex flex-col gap-5'>
                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <SquarePen size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>Service Plan Type</label>
                                            </div>
                                            <Select onChange={setService_plan} value={service_plan} options={filteredPlanOptions} placeholder="e.g Basic Plan" required />
                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <PhilippinePeso size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>Price</label>
                                            </div>
                                            <input type="number" className='px-4 py-2 rounded-md focus:outline-none border border-gray-400' onChange={(e) => setPrice(e.target.value)} required placeholder='e.g ₱5000' />
                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <PackagePlus size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>List Inclusions</label>
                                            </div>
                                            <div className='flex gap-3'>
                                                <input
                                                    type="text"
                                                    className='w-full px-4 py-2 rounded-md focus:outline-none border border-gray-400'
                                                    onChange={(e) => setInclusions(e.target.value)}
                                                    value={inclusions}
                                                    placeholder='Enter inclusion or offer details'
                                                />
                                                <button onClick={() => handleInclusions(inclusions)} className='w-1/3 bg-blue-600 hover:bg-blue-700 transition-all duration-200 rounded-md text-white' type='button'>Add</button>
                                            </div>
                                            {error && (
                                                <span className='text-sm text-red-500'>{error}</span>
                                            )}

                                            {allInclusions?.length > 0 && (
                                                <>
                                                    <span className="text-sm font-semibold text-gray-600 mt-2">
                                                        Added inclusions
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {allInclusions.map((inclusion, index) => (
                                                            <span
                                                                key={index}
                                                                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-blue-100 text-blue-700 font-medium text-sm"
                                                            >
                                                                {inclusion}
                                                                <button
                                                                    onClick={() => removeInclusion(inclusion)}
                                                                    type="button"
                                                                    className="text-blue-600 hover:text-red-500 transition"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <MessageSquareWarning size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>Payment Notice</label>
                                            </div>
                                            <Select onChange={setPayment_notice} value={payment_notice} options={paymentNoticeOptions} placeholder="e.g Pay after service.." required />
                                        </div>
                                    </div>

                                    <button
                                        disabled={isSubmitting}
                                        className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-md mt-7 py-2 rounded-md text-white flex justify-center text-center items-center gap-3`}
                                    >
                                        {isSubmitting ? <div className='h-4 w-4 rounded-full border border-t-2 animate-spin'></div> : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}