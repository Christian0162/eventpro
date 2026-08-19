import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeactivateModal from '../components/DeactivateModal'
import { auth, db } from '../firebase/firebase'
import Swal from 'sweetalert2'

// Mock dependencies
jest.mock('../firebase/firebase', () => ({
    auth: {},
    db: {}
}))

jest.mock('../hooks/useEvents', () => ({
    useFetchEvents: () => ({
        events: []
    })
}))

jest.mock('../hooks/useSupplier', () => ({
    useFetchSuppliers: () => ({
        suppliers: []
    })
}))

jest.mock('firebase/auth', () => ({
    EmailAuthProvider: {
        credential: jest.fn()
    },
    reauthenticateWithCredential: jest.fn(),
    signOut: jest.fn()
}))

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    serverTimestamp: jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn()
}))

jest.mock('sweetalert2', () => ({
    fire: jest.fn()
}))

// Mock LoadingOverlay component
jest.mock('../components/LoadingOverlay', () => {
    return function MockLoadingOverlay({ isLoading, message }) {
        if (!isLoading) return null
        return <div data-testid="loading-overlay">{message}</div>
    }
})

const mockUser = {
    email: 'test@example.com'
}

const mockUserData = {
    id: 'user123',
    role: 'Event Planner'
}

const mockEvents = [
    { id: 'event1', user_id: 'user123', title: 'Test Event' }
]

const mockSuppliers = [
    { id: 'user123', name: 'Test Shop' }
]

describe('DeactivateModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const renderComponent = (props = {}) => {
        const defaultProps = {
            user: mockUser,
            userData: mockUserData,
            ...props
        }
        return render(<DeactivateModal {...defaultProps} />)
    }

    const openModal = () => {
        // Get the trigger button (the one that opens the modal)
        const deactivateButtons = screen.getAllByText('Deactivate Account')
        const triggerButton = deactivateButtons.find(button => 
            button.className.includes('text-slate-700') || 
            button.className.includes('hover:text-red-600')
        )
        fireEvent.click(triggerButton)
    }

    const fillPassword = (password = 'testpassword123') => {
        const passwordInput = screen.getByPlaceholderText('Enter your password')
        fireEvent.change(passwordInput, { target: { value: password } })
    }

    const selectReason = (reason = 'Too many emails') => {
        const reasonRadio = screen.getByDisplayValue(reason)
        fireEvent.click(reasonRadio)
    }

    const checkConfirmation = () => {
        const confirmCheckbox = screen.getByRole('checkbox')
        fireEvent.click(confirmCheckbox)
    }

    const submitForm = () => {
        // Get the submit button inside the modal (the one with red background)
        const deactivateButtons = screen.getAllByText('Deactivate Account')
        const submitButton = deactivateButtons.find(button => 
            button.className.includes('bg-red-600') || 
            button.getAttribute('type') === 'submit'
        )
        fireEvent.click(submitButton)
    }

    describe('TC-132: Deactivate without selecting reason', () => {
        it('should show error when trying to deactivate without selecting a reason', async () => {
            renderComponent()

            openModal()
            fillPassword()
            checkConfirmation()
            submitForm()

            await waitFor(() => {
                expect(screen.getByText('Please select a reason')).toBeInTheDocument()
            })

            // Verify that SweetAlert and Firebase functions were not called
            expect(Swal.fire).not.toHaveBeenCalled()
            expect(require('firebase/auth').reauthenticateWithCredential).not.toHaveBeenCalled()
        })
    })

    describe('TC-133: Deactivate with empty and incorrect password', () => {
        it('should show error when password is empty', async () => {
            renderComponent()

            openModal()
            selectReason()
            checkConfirmation()
            submitForm()

            await waitFor(() => {
                expect(screen.getByText('Password is required')).toBeInTheDocument()
            })

            expect(Swal.fire).not.toHaveBeenCalled()
        })

        it('should show error when password is incorrect', async () => {
            const { reauthenticateWithCredential } = require('firebase/auth')
            reauthenticateWithCredential.mockRejectedValue(new Error('Invalid password'))

            renderComponent()

            openModal()
            selectReason()
            fillPassword('wrongpassword')
            checkConfirmation()
            submitForm()

            await waitFor(() => {
                expect(screen.getByText('Password is incorrect')).toBeInTheDocument()
            })

            expect(Swal.fire).not.toHaveBeenCalled()
        })
    })

    describe('TC-134: Deactivate account without agreeing to terms and conditions', () => {
        it('should show error when trying to deactivate without confirmation', async () => {
            renderComponent()

            openModal()
            selectReason()
            fillPassword()
            // Don't check the confirmation checkbox
            submitForm()

            await waitFor(() => {
                expect(screen.getByText('You must confirm account deactivation')).toBeInTheDocument()
            })

            expect(Swal.fire).not.toHaveBeenCalled()
            expect(require('firebase/auth').reauthenticateWithCredential).not.toHaveBeenCalled()
        })
    })

    // describe('Successful deactivation scenarios', () => {
    //     it('should successfully deactivate account with valid inputs', async () => {
    //         const { reauthenticateWithCredential, signOut } = require('firebase/auth')
    //         const { doc, updateDoc, arrayUnion, serverTimestamp } = require('firebase/firestore')

    //         reauthenticateWithCredential.mockResolvedValue()
    //         signOut.mockResolvedValue()
    //         updateDoc.mockResolvedValue()
    //         doc.mockImplementation((db, collection, id) => ({ id }))
    //         arrayUnion.mockReturnValue([])
    //         serverTimestamp.mockReturnValue(new Date())

    //         Swal.fire.mockResolvedValue({ isConfirmed: true })

    //         // Mock the hooks to return data
    //         jest.spyOn(require('../hooks/useEvents'), 'useFetchEvents')
    //             .mockReturnValue({ events: mockEvents })
    //         jest.spyOn(require('../hooks/useSupplier'), 'useFetchSuppliers')
    //             .mockReturnValue({ suppliers: mockSuppliers })

    //         renderComponent()

    //         openModal()
    //         selectReason('Privacy concerns')
    //         fillPassword('correctpassword')
    //         checkConfirmation()
    //         submitForm()

    //         await waitFor(() => {
    //             expect(Swal.fire).toHaveBeenCalledWith({
    //                 icon: 'info',
    //                 title: 'Account Deactivation',
    //                 html: expect.stringContaining('How to reactivate your account'),
    //                 confirmButtonText: 'OK',
    //                 showCancelButton: true
    //             })
    //         })

    //         // Verify that reauthentication was called with correct credentials
    //         expect(reauthenticateWithCredential).toHaveBeenCalled()

    //         // Verify that events were updated for Event Planner
    //         await waitFor(() => {
    //             expect(updateDoc).toHaveBeenCalled()
    //         })
    //     })

    //     it('should handle "Other" reason with custom text', async () => {
    //         const { reauthenticateWithCredential } = require('firebase/auth')
    //         reauthenticateWithCredential.mockResolvedValue()
    //         Swal.fire.mockResolvedValue({ isConfirmed: true })

    //         renderComponent()

    //         openModal()
    //         selectReason('Other')

    //         // Fill custom reason
    //         const customReasonTextarea = screen.getByPlaceholderText('Tell us more about your reason...')
    //         fireEvent.change(customReasonTextarea, { target: { value: 'Custom reason for deactivation' } })

    //         fillPassword()
    //         checkConfirmation()
    //         submitForm()

    //         await waitFor(() => {
    //             expect(Swal.fire).toHaveBeenCalled()
    //         })
    //     })
    // })

    // describe('Form interactions', () => {
    //     it('should show custom reason field when "Other" is selected', () => {
    //         renderComponent()

    //         openModal()
    //         selectReason('Other')

    //         expect(screen.getByPlaceholderText('Tell us more about your reason...')).toBeInTheDocument()
    //     })

    //     it('should toggle password visibility', () => {
    //         renderComponent()

    //         openModal()

    //         const passwordInput = screen.getByPlaceholderText('Enter your password')
            
    //         // Find the password toggle button by its position relative to the password input
    //         const passwordContainer = passwordInput.parentElement
    //         const toggleButton = passwordContainer.querySelector('button')
            
    //         // Initially should be password type
    //         expect(passwordInput).toHaveAttribute('type', 'password')

    //         // Click to show password
    //         fireEvent.click(toggleButton)
    //         expect(passwordInput).toHaveAttribute('type', 'text')

    //         // Click to hide password again
    //         fireEvent.click(toggleButton)
    //         expect(passwordInput).toHaveAttribute('type', 'password')
    //     })

    //     it('should close modal when cancel button is clicked', async () => {
    //         renderComponent()

    //         openModal()
            
    //         // Verify modal is open
    //         expect(screen.getByText('Why are you deactivating your account?')).toBeInTheDocument()

    //         const cancelButton = screen.getByText('Cancel')
    //         fireEvent.click(cancelButton)

    //         // Wait for the modal to close and check that modal content is no longer visible
    //         await waitFor(() => {
    //             expect(screen.queryByText('Why are you deactivating your account?')).not.toBeInTheDocument()
    //         }, { timeout: 1000 })
    //     })

    //     it('should close modal when X button is clicked', async () => {
    //         renderComponent()

    //         openModal()
            
    //         // Verify modal is open
    //         expect(screen.getByText('Why are you deactivating your account?')).toBeInTheDocument()

    //         // Find all buttons and filter for the X button in the modal header
    //         const buttons = screen.getAllByRole('button')
    //         const closeButton = buttons.find(button => {
    //             // Look for the button that contains an X icon or is in the header
    //             const svg = button.querySelector('svg')
    //             if (svg) {
    //                 const paths = svg.querySelectorAll('path')
    //                 // X icon typically has paths with "M18 6 6 18" and "m6 6 12 12"
    //                 return Array.from(paths).some(path => 
    //                     path.getAttribute('d')?.includes('18 6') || 
    //                     path.getAttribute('d')?.includes('6 6')
    //                 )
    //             }
    //             return false
    //         })

    //         expect(closeButton).toBeDefined()
    //         fireEvent.click(closeButton)

    //         // Wait for the modal to close and check that modal content is no longer visible
    //         await waitFor(() => {
    //             expect(screen.queryByText('Why are you deactivating your account?')).not.toBeInTheDocument()
    //         }, { timeout: 1000 })
    //     })
    // })
})