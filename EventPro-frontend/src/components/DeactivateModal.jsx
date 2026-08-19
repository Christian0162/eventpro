import { Button, Dialog, DialogPanel, } from '@headlessui/react'
import { X, Eye, EyeOff, TriangleAlert, AlertTriangle, User } from 'lucide-react'
import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth'
import { useFetchEvents } from '../hooks/useEvents'
import { useFetchSuppliers } from '../hooks/useSupplier'
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/firebase'
import LoadingOverlay from './LoadingOverlay'
import Swal from 'sweetalert2'

export default function DeactivateModal({ user, userData }) {

    const [isOpen, setIsOpen] = useState(false)
    const { events } = useFetchEvents()
    const { suppliers } = useFetchSuppliers()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const userEvents = events.filter(events => events.user_id === userData.id)
    const userShops = suppliers.filter(shops => shops.id === userData.id)

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
    }
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const reasons = [
        'Too many emails',
        'Privacy concerns',
        'Not useful anymore',
        'Found a better alternative',
        'Temporary break',
        'Other'
    ];

    const validateForm = () => {
        const newErrors = {};

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        if (!reason) {
            newErrors.reason = 'Please select a reason';
        }

        if (reason === 'Other' && !customReason.trim()) {
            newErrors.customReason = 'Please specify your reason';
        }

        if (!confirmDeactivate) {
            newErrors.confirm = 'You must confirm account deactivation';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true)

            const credential = EmailAuthProvider.credential(user.email, password)
            await reauthenticateWithCredential(user, credential).then(async () => {

                Swal.fire({
                    icon: 'info',
                    title: 'Account Deactivation',
                    html: `
        <strong>How to reactivate your account:</strong><br/>
        You can reactivate your account at any time by logging into your EventPro account with your email and password.
                    `,
                    confirmButtonText: 'OK',
                    showCancelButton: true
                }).then(async (result) => {

                    if (result.isConfirmed) {
                        setIsSubmitting(true)
                        try {
                            if (userData.role === "Event Planner") {

                                for (const events of userEvents) {
                                    await updateDoc(doc(db, "events", events.id), {
                                        status: "deactivated"
                                    })
                                }

                                await updateDoc(doc(db, "users", userData.id), {
                                    status: "deactivated",
                                    is_online: false,
                                    deactivated_at: serverTimestamp(),
                                    deactivation_reason: customReason > 0 ? customReason : reason,
                                    deactivation_history: arrayUnion({
                                        date: new Date(),
                                        reason: customReason > 0 ? customReason : reason
                                    })
                                })

                                Swal.fire({
                                    icon: 'success',
                                    title: 'Account Deactivated',
                                    text: 'Your account has been successfully deactivated.',
                                });

                                await signOut(auth)
                            }

                            else {
                                await updateDoc(doc(db, "shops", userData.id), {
                                    status: 'deactivated'
                                })

                                await updateDoc(doc(db, "users", userData.id), {
                                    status: "deactivated",
                                    deactivated_at: serverTimestamp(),
                                    deactivation_reason: customReason > 0 ? customReason : reason,
                                    deactivation_history: arrayUnion({
                                        date: new Date(),
                                        reason: customReason > 0 ? customReason : reason
                                    })
                                })

                                Swal.fire({
                                    icon: 'success',
                                    title: 'Account Deactivated',
                                    text: 'Your account has been successfully deactivated.',
                                });

                                await signOut(auth)
                            }
                        }
                        catch (e) {
                            console.error(e)
                            setIsSubmitting(false)
                        }
                        finally {
                            setIsSubmitting(false)

                        }
                    }
                });

            }).catch((e) => {
                // console.error(e.code)
                setErrors(error => ({ ...error, password: "Password is incorrect" }))
            }).finally(() => {
                setIsSubmitting(false)
            })

            // Show success message or redirect
            // alert('Account deactivation request submitted successfully.');
            // setIsOpen(false);
            // resetForm();
        }

    };

    const resetForm = () => {
        setPassword('');
        setReason('');
        setCustomReason('');
        setConfirmDeactivate(false);
        setShowPassword(false);
        setErrors({});
    };


    return (
        <>
            <Button
                onClick={open}
                className="flex items-center text-slate-700 hover:text-red-600 transition-colors font-medium"
            >
                <TriangleAlert className="w-4 h-4 mr-2" />
                Deactivate Account
            </Button>


            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-2xl rounded-2xl mt-18 bg-white shadow-2xl duration-300"
                        >

                            <LoadingOverlay isLoading={isSubmitting} message='Processing..' />

                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Deactivate Account
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">
                                        <strong>Warning:</strong> Deactivating your account will remove access to all your data and settings. This action cannot be easily undone.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Reason Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Why are you deactivating your account? <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            {reasons.map((reasonOption) => (
                                                <label key={reasonOption} className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={reasonOption}
                                                        checked={reason === reasonOption}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-700">{reasonOption}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.reason && (
                                            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                                        )}
                                    </div>

                                    {/* Custom Reason */}
                                    {reason === 'Other' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Please specify <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                                placeholder="Tell us more about your reason..."
                                            />
                                            {errors.customReason && (
                                                <p className="mt-1 text-sm text-red-600">{errors.customReason}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Password Confirmation */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Re-enter your password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    {/* Confirmation Checkbox */}
                                    <div>
                                        <label className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={confirmDeactivate}
                                                onChange={(e) => setConfirmDeactivate(e.target.checked)}
                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                                            />
                                            <span className="text-sm text-gray-700">
                                                I understand that deactivating my account will permanently remove my access and data.
                                                I confirm that I want to proceed with this action. <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        {errors.confirm && (
                                            <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={close}
                                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={(e) => handleSubmit(e)}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                                        >
                                            Deactivate Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}