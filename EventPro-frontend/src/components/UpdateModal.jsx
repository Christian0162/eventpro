import { Button, Dialog, DialogPanel, } from '@headlessui/react'
import { updateDoc, doc } from 'firebase/firestore'
import { Edit3, X, UserPen, Store, MapPin, Container, MessageSquareWarning, SquarePen, PackagePlus, PhilippinePeso, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { auth, db } from '../firebase/firebase'
import Select from 'react-select'
import { SupplierOptions, planTypeOptions, paymentNoticeOptions } from '../constants/categories'
import AddressAutocomplete from './AddressAutoComplete'
import { supplierTypeToExpertise } from '../constants/categories'
import Swal from 'sweetalert2'
import { useFetchSupplierServices } from '../hooks/useSupplier'
import UploadWidget from './UploadWidgen'
import LoadingOverlay from './LoadingOverlay'

export const AboutOurBusiessEdit = ({ supplierData }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [expertise, setExpertise] = useState([])
    const [supplier_description, setSupplier_description] = useState('')
    const [removedExpertise, setRemovedExpertise] = useState([])

    const supplierType = supplierData?.supplier_type?.value

    useEffect(() => {
        setExpertise(supplierData?.supplier_expertise)
        setSupplier_description(supplierData?.supplier_description)
    }, [supplierData])

    console.log(supplierTypeToExpertise[supplierType])

    const handleExpertiseChange = (option) => {
        setExpertise(prev => {
            if (prev.includes(option)) {

                setRemovedExpertise(removed => removed.includes(option) ? removed : [...removed, option])

                return prev.filter(prev => prev !== option)
            }
            else {
                return [...prev, option]
            }
        })
    }

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_description: supplier_description,
                supplier_expertise: expertise
            })

            Swal.fire('Updated', 'Your profile\'s About section has been updated.', 'success')

            setIsSubmitting(false)
            close()
        }

        catch (e) {
            console.error(e)
            setIsSubmitting(false)
        }

    }

    console.log(removedExpertise)
    return (
        <>
            <Button onClick={open} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                <Edit3 size={16} />
                Edit
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl mt-18 duration-300"
                        >
                            <div className='relative px-10 py-5 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex flex-col gap-1 mb-2 mt-2">
                                    <div className='flex gap-2 items-center'>
                                        <UserPen size={24} className='text-blue-600' />
                                        <h2 className="text-3xl font-bold text-blue-600">
                                            Edit About Profile
                                        </h2>
                                    </div>
                                    <p className='text-gray-600'>Update your business and information</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className='flex flex-col px-10 py-5'>
                                    <div className='relative flex flex-col'>
                                        <label htmlFor="search" className='text-sm mb-2 text-gray-800 font-bold'>About our Business</label>
                                        <textarea
                                            onChange={(e) => setSupplier_description(e.target.value)}
                                            type="text"
                                            value={supplier_description}
                                            placeholder="Tell us briefly about your business..."
                                            className='rounded-lg focus:outline-none border resize-none h-[130px] border-gray-300 shadow-lg py-2 px-4'
                                        />
                                        <span className='text-sm block text-gray-600 mt-2 text-right' >{supplier_description?.length}/500</span>


                                    </div>

                                    {error && (
                                        <span className='mt-5 text-red-500'>{error}</span>
                                    )}

                                    <div className='flex flex-col gap-3'>
                                        <span className='block text-gray-800 font-bold mt-3 text-sm'>Expertise</span>
                                        <div className='flex flex-wrap gap-2'>
                                            {expertise?.length > 0 && (
                                                <>
                                                    {expertise.map((supplier, index) => (
                                                        <button type='button' onClick={() => handleExpertiseChange(supplier)} className="group flex items-center px-3 py-2 rounded-2xl bg-blue-100 text-blue-700 font-medium text-sm"
                                                            key={index}>
                                                            {supplier} <span className='ml-2 transition-all duration-200 text-blue-700 group-hover:text-red-600 flex'> - </span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}


                                        </div>

                                        {expertise?.length === 0 && (
                                            <div className='flex justify-center items-center'>
                                                <span className='text-gray-600 block text-center'>No expertise</span>
                                            </div>
                                        )}

                                        <span className='block text-gray-800 font-bold mt-3 text-sm'>Available Expertise</span>
                                        <div className='flex flex-wrap gap-2'>
                                            <>
                                                {supplierTypeToExpertise[supplierType]?.map((supplier, index) => (
                                                    <button type='button' onClick={() => handleExpertiseChange(supplier)} className="group flex items-center gap-2 px-3 py-2 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 font-medium text-sm"
                                                        key={index}>
                                                        {supplier} <span className='ml-2 transition-all duration-200 text-blue-600 group-hover:text-red-700 font-bold flex'> + </span>
                                                    </button>
                                                ))}
                                            </>
                                        </div>
                                    </div>



                                    <button
                                        disabled={isSubmitting}
                                        className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-md mt-7 py-2 rounded-md text-white flex justify-center text-center items-center gap-3`}
                                    >
                                        {isSubmitting ? <div className='h-6 w-6 rounded-full border border-t-2 animate-spin'></div> : 'Update'}

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

export const SupplierDetails = ({ supplierData }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [supplier_type, setSupplier_type] = useState(null)
    const [store_name, setStore_name] = useState('')
    const [supplier_location, setSupplier_location] = useState('')
    const [coords, setCoords] = useState([])

    useEffect(() => {
        setSupplier_location(supplierData?.supplier_location)
        setStore_name(supplierData?.supplier_name)
        setSupplier_type(supplierData?.supplier_type)
    }, [supplierData])


    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await updateDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_name: store_name,
                supplier_location: supplier_location,
                supplier_type: supplier_type,
                supplier_expertise: []
            })

            Swal.fire('Updated', 'Your profile\'s About section has been updated.', 'success')

            setIsSubmitting(false)
            close()
        }

        catch (e) {
            console.error(e)
            setIsSubmitting(false)
        }

    }

    return (
        <>
            <Button onClick={open} className="flex items-center ml-auto gap-2 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                <Edit3 size={16} />
                Edit Details
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl mt-15 rounded-2xl bg-white shadow-2xl duration-300 "
                        >
                            <div className='relative px-10 py-5 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex flex-col gap-1 mb-2 mt-2">
                                    <div className='flex gap-2 items-center'>
                                        <UserPen size={24} className='text-blue-600' />
                                        <h2 className="text-3xl font-bold text-blue-600">
                                            Edit Profile Details
                                        </h2>
                                    </div>
                                    <p className='text-gray-600 text-sm mt-1'>Update your profile details</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className='flex flex-col space-y-5 px-10 py-5'>
                                    <div className='relative flex flex-col'>
                                        <div className='flex items-center gap-2'>
                                            <Store size={20} className='text-blue-600' />
                                            <label htmlFor="">Shop name</label>
                                        </div>
                                        <input type="text" value={store_name} onChange={(e) => setStore_name(e.target.value)} required className='px-4 py-2 mt-3 border border-gray-400 rounded-md focus:outline-none' placeholder='e.g Rivera Shop' />
                                    </div>

                                    <div className='relative flex flex-col'>
                                        <div className='flex items-center gap-2'>
                                            <MapPin size={20} className='text-blue-600' />
                                            <label htmlFor="">Location</label>
                                        </div>
                                        <AddressAutocomplete setCoords={setCoords} setLocation={setSupplier_location} default_location={supplier_location} className={'w-full px-3 py-2 mt-3 rounded-md border border-gray-400'} />
                                    </div>

                                    <div className='relative flex flex-col'>
                                        <div className='flex items-center gap-2'>
                                            <Container size={20} className='text-blue-600' />
                                            <label htmlFor="">Supplier Type</label>
                                        </div>
                                        <Select className='mt-3' onChange={setSupplier_type} value={supplier_type} options={SupplierOptions} required placeholder="e.g Wedding" />
                                    </div>

                                    <button
                                        disabled={isSubmitting}
                                        className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-md mt-7 py-2 rounded-md text-white flex justify-center text-center items-center gap-3`}
                                    >
                                        {isSubmitting ? <div className='h-6 w-6 rounded-full border border-t-2 animate-spin'></div> : 'Update'}

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

export const ServiceEdit = ({ supplierData, service_id, services }) => {

    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [service_plan, setService_plan] = useState(null)
    const [inclusions, setInclusions] = useState('')
    const [allInclusions, setAllInclusions] = useState([])
    const [price, setPrice] = useState('')
    const [payment_notice, setPayment_notice] = useState(null)
    const [errors, setErrors] = useState({
        service_plan: '',
        price: '',
        inclusions: '',
    });
    const { services: service } = useFetchSupplierServices()

    function open() {
        setIsOpen(true)
    }
    function close() {
        setIsOpen(false)
    }

    useEffect(() => {
        const supplierService = service.find(s => s.id === service_id)

        setService_plan(supplierService?.service_plan)
        setPrice(supplierService?.service_price)
        setPayment_notice(supplierService?.service_payment_notice)
        setAllInclusions(supplierService?.service_inclusions)
    }, [services, supplierData, service_id, service])


    const handleInclusions = (inclusions) => {
        const trimmed = inclusions.trim();
        if (!trimmed) return;

        setAllInclusions(prev => {
            if (prev.includes(trimmed)) {
                setErrors(prev => ({ ...prev, inclusions: 'The item is already in the list.' }));
                return prev;
            } else {
                setErrors(prev => ({ ...prev, inclusions: '' }));
                return [...prev, trimmed];
            }
        });
    };



    const removeInclusion = (inclusion) => {
        try {
            setAllInclusions(prev => {
                if (prev.includes(inclusion)) {
                    setErrors(prev => ({ ...prev, inclusions: '' }));
                    return prev.filter(remove => remove !== inclusion)
                }
                else {
                    return prev
                }
            })
        }

        catch (e) {
            console.error(e)
        }
    }

    const handleService = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Reset all errors first
        setErrors({
            service_plan: '',
            price: '',
            inclusions: '',
        });

        try {
            let valid = true;
            const newErrors = {};

            // Find the service being edited
            const currentService = service.find(s => s.id === service_id);

            // Check if the selected service plan already exists for another service (not the one being edited)
            if (
                service.some(
                    s =>
                        s.supplier_id === supplierData.id &&
                        s.id !== service_id && // ignore current service
                        s.service_plan?.value === service_plan?.value // compare by value
                )
            ) {
                newErrors.service_plan = 'The selected service plan already exists for another service.';
                valid = false;
            }

            // Inclusion validation
            if (allInclusions.length === 0) {
                newErrors.inclusions = 'Please add at least one inclusion.';
                valid = false;
            }

            // Price validation
            const numericPrice = parseFloat(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                newErrors.price = 'Please enter a valid price greater than 0.';
                valid = false;
            }

            // Stop if invalid
            if (!valid) {
                setErrors(prev => ({ ...prev, ...newErrors }));
                setIsSubmitting(false);
                return;
            }

            await updateDoc(doc(db, "services", service_id), {
                service_plan: service_plan,
                service_price: numericPrice,
                service_inclusions: allInclusions,
                service_payment_notice: payment_notice,
            });

            Swal.fire('Success!', 'Your service has been updated successfully.', 'success');
            close();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log(service_plan)

    return (
        <>
            {supplierData?.id === auth.currentUser.uid && (
                <Button
                    onClick={open}
                    className="flex items-center justify-center gap-2 w-full text-center py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    Edit
                </Button>
            )}

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl mt-17 rounded-2xl bg-white shadow-2xl duration-300"
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
                                            <Select onChange={setService_plan} value={service_plan} options={planTypeOptions} placeholder="e.g Basic Plan" required />

                                            {errors.service_plan && <span className="text-sm text-red-500">{errors.service_plan}</span>}
                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <PhilippinePeso size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>Price</label>
                                            </div>
                                            <input type="text" value={price} className='px-4 py-2 rounded-md focus:outline-none border border-gray-400' onChange={(e) => setPrice(e.target.value)} required placeholder='e.g ₱5000' />
                                            {errors.price && <span className="text-sm text-red-500">{errors.price}</span>}


                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <div className='flex gap-2 items-center'>
                                                <PackagePlus size={20} className='text-blue-600' />
                                                <label htmlFor="" className='text-gray-700 font-bold'>List Inclusions</label>
                                            </div>
                                            <div className='flex gap-3'>
                                                <input value={inclusions} type="text" className='w-full px-4 py-2 rounded-md focus:outline-none border border-gray-400' onChange={(e) => setInclusions(e.target.value)} placeholder='Enter inclusion or offer details' />
                                                <button onClick={() => handleInclusions(inclusions)} className='w-1/3 bg-blue-600 hover:bg-blue-700 transition-all duration-200 rounded-md text-white' type='button'>Add</button>
                                            </div>
                                            {errors.inclusions && <span className="text-sm text-red-500">{errors.inclusions}</span>}


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
                                        {isSubmitting ? <div className='h-8 w-8 rounded-full border border-t-2 animate-spin'></div> : 'Save'}
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

export const UpdateProfile = ({ userData }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isProfileLoading, setIsProfileLoading] = useState(false)
    const [profile, setProfile] = useState('')

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    const handleSubmit = async () => {
        setIsProfileLoading(true)
        try {
            await updateDoc(doc(db, "userProfiles", userData.id), {
                profile_pic: profile
            })
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsProfileLoading(false)
            close()
            setProfile('')
        }
    }

    return (
        <>
            <Button onClick={open} className={'transition-all absolute hover:ring-2 hover:ring-blue-600 -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center'}>

                <Pencil className="w-4 h-4 text-gray-800" />
            </Button>

            <Dialog open={isOpen} as='div' className={'z-50 relative focus:outline-none'} onClose={close}>
                <div className="fixed inset-0 bg-black/25 " />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-xl mt-18 rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <div className='relative px-8 py-4 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-blue-600">
                                        Update Profile
                                    </h2>
                                </div>
                            </div>

                            <div className='p-8'>
                                <UploadWidget className={'py-2'} setPicture={setProfile} />
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => handleSubmit()}
                                        disabled={!profile}
                                        className={`transition-all duration-75 px-4 h-10 rounded-md text-white ${profile ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'
                                            }`}
                                    >
                                        Submit
                                    </button>
                                </div>
                                {isProfileLoading && (
                                    <LoadingOverlay isLoading={isProfileLoading} message="Processing.." />
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </div >
            </Dialog >
        </>
    )
}

export const UpdateEventBackground = ({ id, className }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false)
    const [background, setBackground] = useState('')

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }

    const handleSubmit = async () => {
        setIsBackgroundProcessing(true)
        try {
            await updateDoc(doc(db, "events", id), {
                event_background: background
            })
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsBackgroundProcessing(false)
            close()
            setBackground('')
        }
    }

    return (
        <>
            <Button onClick={open} className={`${className} transition-all text-sm gap-1 text-white hover:ring-2 hover:ring-blue-600 px-3 py-2 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center`}>
                Edit
                <Pencil className="w-4 h-4 text-white" />
            </Button>

            <Dialog open={isOpen} as='div' className={'z-50 relative focus:outline-none'} onClose={close}>
                <div className="fixed inset-0 bg-black/25 " />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-xl mt-18 rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <div className='relative px-8 py-4 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-blue-600">
                                        Update Background
                                    </h2>
                                </div>
                            </div>

                            <div className='p-8'>
                                <UploadWidget className={'py-2'} setPicture={setBackground} />
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => handleSubmit()}
                                        disabled={!background}
                                        className={`transition-all duration-75 px-4 h-10 rounded-md text-white ${background ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'
                                            }`}
                                    >
                                        Submit
                                    </button>
                                </div>
                                {isBackgroundProcessing && (
                                    <LoadingOverlay isLoading={isBackgroundProcessing} message="Processing.." />
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </div >
            </Dialog >
        </>
    )
}

