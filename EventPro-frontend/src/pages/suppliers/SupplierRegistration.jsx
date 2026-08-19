import { MapPin, Mail, Phone, Clock, PhilippinePeso, Calendar } from 'lucide-react';
import Select from 'react-select';
import AddressAutocomplete from '../../components/AddressAutoComplete';
import { useState, useEffect } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { auth } from '../../firebase/firebase';
import Swal from 'sweetalert2'
import { SupplierOptions } from '../../constants/categories';
import { supplierTypeToExpertise } from '../../constants/categories';
import LoadingOverlay from '../../components/LoadingOverlay';
import AvailabilityPicker from '../../components/AvailabilityPicker';

export default function SupplierRegistration() {

    const [supplier_type, setSupplier_type] = useState(null)
    const [expertise, setExpertise] = useState([]);
    const [coords, setCoords] = useState([])
    const [supplier_name, setSupplier_name] = useState('')
    const [location, setLocation] = useState('')
    const [supplier_description, setSupplier_description] = useState('')
    const [supplier_specialization, setSupplier_specialization] = useState('')
    const [email_address, setEmail_address] = useState('');
    const [phone_number, setPhone_number] = useState('');
    const [response_time, setRespone_time] = useState('')
    const [supplier_availability, setSupplier_availability] = useState('')
    const [timeError, setTimeError] = useState('')
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expertiseOptions, setExpertiseOptions] = useState([])

    useEffect(() => {
        if (supplier_type && supplier_type.value) {
            const suggestedExpertise = supplierTypeToExpertise[supplier_type.value] || [];

            setExpertiseOptions(suggestedExpertise)

        }
    }, [supplier_type]);

    const responseTimeOptions = [
        { label: 'Within 1 Hour', value: 'within 1 hour' },
        { label: 'Within 4 Hour', value: 'within 4 hour' },
        { label: 'Within 24 Hour', value: 'within 24 hour' },
        { label: 'Within 48 Hour', value: 'within 48 hour' },
    ]

    const handleExertiseChange = (option) => {
        setExpertise(prev => {
            if (prev.includes(option)) {
                return prev.filter(item => item !== option)
            }
            else {
                return [...prev, option]
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!expertise || expertise.length === 0) {
            setIsLoading(false);
            return setError('Must fill all fields');
        }

        if (supplier_availability.length === 0) {
            setIsLoading(false);
            return setError('Must select atleast availability days and time');

        }
        if (timeError.length > 0) {
            setIsLoading(false);
            Swal.fire({
                icon: 'error',
                title: 'Invalid Availability',
                text: timeError,
            })
            return;
        }

        try {
            Swal.fire({
                title: 'Success',
                icon: 'success',
                text: 'Shop created successfully',
            })

            await setDoc(doc(db, "shops", auth.currentUser.uid), {
                supplier_background_image: "",
                supplier_name,
                supplier_location: location,
                supplier_type,
                supplier_description,
                supplier_expertise: expertise,
                supplier_specialization,
                supplier_email: email_address,
                supplier_number: phone_number,
                supplier_response_time: response_time,
                supplier_availability,
                created_at: serverTimestamp(),
                status: "active",
                is_verified: false
            });



        } catch (e) {
            console.error(e);
            setError("Failed to create shop. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading} message='Processing...' />

            <div className="max-w-4xl mx-auto">
                <div className={`max-w-xl py-2 font-bold rounded-lg mb-5 px-5 text-white bg-red-400 ${error ? 'block' : 'hidden'}`}>
                    <ul>
                        <li>{error}</li>
                    </ul>
                </div>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">Supplier Registration</h1>
                        <p className="text-pink-100">Join our network of trusted suppliers</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-8">
                            {/* Supplier Information */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Supplier Information</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Supplier Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="SupplierName"
                                            onChange={(e) => setSupplier_name(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg  focus:border-transparent transition-colors`}
                                            placeholder="Enter your supplier name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="inline w-4 h-4 mr-1" />
                                            Location *
                                        </label>
                                        <AddressAutocomplete className={'w-full px-3 py-3 rounded-md ring-1 ring-black'} setLocation={setLocation} setCoords={setCoords} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Supplier Type *
                                    </label>
                                    <Select
                                        onChange={setSupplier_type}
                                        value={supplier_type}
                                        options={SupplierOptions}
                                        isClearable
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Supplier Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        required
                                        onChange={(e) => setSupplier_description(e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg  focus:border-transparent transition-colors `}
                                        placeholder="Describe your Supplier, products, and services..."
                                    />
                                </div>
                            </div>

                            {/* Expertise */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Areas of Expertise</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select all that apply *
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {supplier_type && (
                                            <>
                                                {expertiseOptions.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => handleExertiseChange(option)}
                                                        type="button"
                                                        className={`px-4 py-2 border rounded-lg text-sm transition-colors ${expertise.includes(option) ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                    {!supplier_type && (
                                        <span className="block mt-5 text-gray-500 text-center mb-5">Must select one in supplier type.</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specializations
                                    </label>
                                    <textarea
                                        name="specializations"
                                        rows={3}
                                        required
                                        onChange={(e) => setSupplier_specialization(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg  focus:border-transparent transition-colors"
                                        placeholder="Describe any unique specializations you offer."
                                    />
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Contact Information</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="inline w-4 h-4 mr-1" />
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            onChange={(e) => setEmail_address(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg  focus:border-transparent transition-colors `}
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Phone className="inline w-4 h-4 mr-1" />
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ""); // remove non-numeric
                                                if (value.length <= 11) {
                                                    setPhone_number(value);
                                                }
                                            }}
                                            value={phone_number}
                                            inputMode="numeric"
                                            className="w-full px-4 py-3 border rounded-lg focus:border-transparent transition-colors"
                                            placeholder="(123) 456-7890"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Supplier Details */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Supplier Details</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Clock className="inline w-4 h-4 mr-1" />
                                            Typical Response Time
                                        </label>
                                        <Select
                                            onChange={setRespone_time}
                                            value={response_time}
                                            options={responseTimeOptions}
                                            isClearable
                                            required
                                        />
                                    </div>

                                    <div>
                                        <AvailabilityPicker onChange={(val) => setSupplier_availability(val)} setTimeError={setTimeError} />
                                        {timeError && (
                                            <span className="text-red-500 text-sm mt-1">{timeError}</span>
                                        )}
                                    </div>



                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-6 border-t border-gray-500">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full ${isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-5 rounded-lg text-md font-semibold transition-all duration-200 shadow-lg`}
                                >
                                    {isLoading ? "Submitting.." : "Submit"}
                                </button>
                                <p className="text-sm text-gray-500 text-center mt-3">
                                    By submitting, you agree to our terms and conditions for suppliers.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}