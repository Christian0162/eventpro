import { Dialog, DialogPanel, Button } from '@headlessui/react'
import { useState } from 'react'
import { X } from 'lucide-react'

export default function VerificationCheckbox({ onChange, checked }) {

    const [isOpen, setIsOpen] = useState(false)

    function close() {
        setIsOpen(false)
    }

    function open() {
        setIsOpen(true)
    }

    return (
        <div className="flex space-x-3 p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm w-full text-sm text-gray-800">
            <input
                type="checkbox"
                id="confirm"
                name="confirm"
                required
                checked={checked}
                onChange={onChange}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="confirm" className="flex-1 cursor-pointer">
                <p className="font-semibold">
                    I confirm that all information provided is accurate and authentic.
                </p>
                <p className="mt-1">
                    I understand that submitting false information may result in rejection of verification.
                </p>
                <p className="mt-3 text-gray-600">
                    By submitting this form, you agree to our{' '}
                    <Button
                        type="button"
                        onClick={open}
                        className="text-blue-600 hover:underline"
                    >
                        verification process and terms of service
                    </Button>

                    <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                        <div className="fixed inset-0 bg-black/25" />
                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center">
                                <DialogPanel
                                    transition
                                    className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl duration-300"
                                >
                                    <div className='relative px-5 py-5 bg-gray-100  rounded-t-xl'>
                                        <button
                                            onClick={close}
                                            type='button'
                                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                        >
                                            <X size={20} className="text-gray-600" />
                                        </button>
                                        <h2 className="text-blue-400">Terms and Conditions</h2>

                                    </div>

                                    <div className="px-5 pt-3 pb-5 max-h-96 overflow-y-auto">
                                        <div className="text-sm text-gray-500 space-y-4">
                                            <section>
                                                <h4 className="font-semibold text-gray-900 mb-2">Verification Process</h4>
                                                <p>
                                                    Our verification process ensures the authenticity and credibility of all suppliers on our platform.
                                                    By submitting your business information, you agree to undergo our standard verification procedures.
                                                </p>
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>Document review and validation</li>
                                                    <li>Business credentials verification</li>
                                                    <li>Identity confirmation through government-issued ID</li>
                                                    <li>Review process may take 3-5 business days</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h4 className="font-semibold text-gray-900 mb-2">Terms of Service</h4>
                                                <p>
                                                    By using our platform, you agree to comply with our terms and conditions:
                                                </p>
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>Provide accurate and truthful information</li>
                                                    <li>Maintain updated business credentials</li>
                                                    <li>Comply with all applicable laws and regulations</li>
                                                    <li>Respect intellectual property rights</li>
                                                    <li>Maintain professional conduct on the platform</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h4 className="font-semibold text-gray-900 mb-2">Data Privacy</h4>
                                                <p>
                                                    We are committed to protecting your personal and business information.
                                                    All submitted documents and data are encrypted and stored securely,
                                                    and will only be used for verification purposes.
                                                </p>
                                            </section>

                                            <section>
                                                <h4 className="font-semibold text-gray-900 mb-2">Account Suspension</h4>
                                                <p>
                                                    Failure to comply with our terms may result in account suspension or termination.
                                                    We reserve the right to reject applications that do not meet our verification standards.
                                                </p>
                                            </section>
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                                                onClick={close}
                                            >
                                                I Understand
                                            </button>
                                        </div>
                                    </div>


                                </DialogPanel>
                            </div>
                        </div>
                    </Dialog>
                </p>
            </label>
        </div>
    );
};

