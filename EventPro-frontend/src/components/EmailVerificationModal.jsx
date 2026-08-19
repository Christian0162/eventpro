import { Button, Dialog, DialogPanel } from '@headlessui/react'
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth'
import { X, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import LoadingOverlay from './LoadingOverlay'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

export default function EmailVerificationModal({ user }) {

    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [password, setPassword] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [error, setError] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    function open() {
        setIsOpen(true)
    }

    function close() {
        setIsOpen(false)
        setError('')
        setIsVerifying(false)
        setCurrentStep(1)
        setNewEmail('')
        setPassword('')
    }

    const handleChangeEmail = async () => {
        setIsVerifying(true)

        // Step 1: Check if password is empty
        if (!password && currentStep === 1) {
            setError('Please enter your password to continue.')
            setIsVerifying(false)
            return
        }

        // Step 2: Step 2 validation (email)
        if (currentStep === 2 && !newEmail) {
            setError('Please enter a new email address.')
            setIsVerifying(false)
            return
        }

        if (user.email === newEmail) {
            setError('You cannot change to the same email address.');
            setIsVerifying(false);
            return;
        }


        // Step 1: Verify password
        if (currentStep === 1) {
            const credential = EmailAuthProvider.credential(user.email, password)

            await reauthenticateWithCredential(user, credential)
                .then(() => {
                    setError('')
                    setIsVerifying(false)
                    setCurrentStep(2)
                })
                .catch((e) => {
                    console.error(e.code)
                    setIsVerifying(false)
                    if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
                        setError('The password you entered is incorrect. Please try again.')
                    } else {
                        setError('An unexpected error occurred. Please try again later.')
                    }
                })
        }

        // Step 2: Change email
        if (currentStep === 2) {
            setIsVerifying(true)
            try {
                await updateEmail(user, newEmail)

                await updateDoc(doc(db, 'users', user.uid), {
                    email_address: newEmail
                })

                await updateDoc(doc(db, 'userProfiles', user.uid), {
                    email_address: newEmail
                })

                setIsOpen(false)
                setError('')
                setIsVerifying(false)
                setCurrentStep(1)
                setNewEmail('')
                setPassword('')

                Swal.fire('Email Updated Successfully!!', 'Your email has been changed successfully.', 'success')
            } catch (e) {
                console.error(e.code)
                setIsVerifying(false)

                if (e.code === 'auth/email-already-in-use') {
                    setError('This email is already in use. Please try a different one.')
                } else if (e.code === 'auth/invalid-email') {
                    setError('The email address is invalid. Please enter a valid one.')
                } else {
                    setError('An error occurred while updating your email. Please try again.')
                }
            }
        }
    }

    return (
        <>
            <Button
                onClick={open}
                className='hover:text-blue-700 absolute right-5 top-6 text-blue-600 font-medium text-sm py-1 px-3'
            >
                Change
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="relative w-full max-w-md rounded-2xl mt-18 bg-white shadow-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-3 font-medium text-lg">
                                    Email Settings
                                </div>
                                <button
                                    onClick={close}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Step 1: Password Verification */}
                            {currentStep === 1 && (
                                <div className='px-10'>
                                    <div className='flex flex-col justify-center items-center my-4'>
                                        <h1 className='text-2xl text-gray-900 font-bold mb-2'>Verify Your Password</h1>
                                        <p className='text-gray-600'>Enter your password to change your email address</p>
                                    </div>

                                    <div className='relative mb-5'>
                                        <label className='text-sm text-gray-800 font-medium'>Current Email</label>
                                        <Mail className='absolute text-gray-400 top-10 left-3 h-4 w-4' />
                                        <input type="text" value={user?.email} disabled className='h-10 w-full bg-gray-100 border border-gray-200 rounded-md px-9 mt-1 text-md text-gray-500' />
                                    </div>

                                    <div className='relative mb-5'>
                                        <label className='text-sm text-gray-800 font-medium'>Password</label>
                                        <Lock className='absolute text-gray-400 top-10 left-3 h-4 w-4' />
                                        <input
                                            onChange={(e) => setPassword(e.target.value)}
                                            value={password}
                                            placeholder='Enter your password'
                                            type="password"
                                            className='h-10 w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-4 mt-1 text-md text-gray-700'
                                        />
                                        {error && <span className='block mt-1 text-sm text-red-600 ml-1'>{error}</span>}
                                    </div>

                                    <div className='flex justify-between gap-4 my-5'>
                                        <button onClick={close} className='py-2 w-full bg-gray-200 border border-gray-300 text-gray-600 rounded-lg hover:bg-blue-600 hover:text-white'>Cancel</button>
                                        <button onClick={handleChangeEmail} className={`py-2 w-full rounded-lg ${isVerifying ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                                            {isVerifying ? 'Verifying..' : 'Verify Password'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Change Email */}
                            {currentStep === 2 && (
                                <div className='px-10'>
                                    <div className='flex flex-col justify-center items-center my-4'>
                                        <h1 className='text-2xl text-gray-900 font-bold mb-2'>Change Email Address</h1>
                                        <p className='text-gray-600'>Enter your new email address</p>
                                    </div>

                                    <div className='relative mb-5'>
                                        <label className='text-sm text-gray-800 font-medium'>Current Email</label>
                                        <Mail className='absolute text-gray-400 top-10 left-3 h-4 w-4' />
                                        <input type="text" value={user?.email} disabled className='h-10 w-full bg-gray-100 border border-gray-200 rounded-md px-9 mt-1 text-md text-gray-500' />
                                    </div>

                                    <div className='relative mb-5'>
                                        <label className='text-sm text-gray-800 font-medium'>New Email Address</label>
                                        <Mail className='absolute text-gray-400 top-10 left-3 h-4 w-4' />
                                        <input
                                            type="text"
                                            placeholder='Enter new email address'
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className='h-10 w-full bg-gray-50 border focus:outline-none focus:border-blue-600 focus:border-2 border-gray-300 rounded-md px-9 mt-1 text-md text-gray-800'
                                        />
                                        {error && <span className='block mt-1 text-sm text-red-600 ml-1'>{error}</span>}
                                    </div>

                                    <div className='flex justify-between gap-4 my-5'>
                                        <button onClick={() => setCurrentStep(1)} className='py-2 w-full bg-gray-200 rounded-lg hover:bg-blue-600 hover:text-white'>Back</button>
                                        <button onClick={handleChangeEmail} className={`py-2 w-full rounded-lg ${isVerifying ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                                            {isVerifying ? 'Processing..' : 'Change email'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
