import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import EventContract from '../pages/events/EventContract';

// Mock Firebase completely
jest.mock('../firebase/firebase', () => ({
    db: {},
}));

// Mock individual hook files with their exact paths
jest.mock('../hooks/useSupplier', () => ({
    useFetchSupplierById: jest.fn(),
    useFetchSupplierServices: jest.fn(),
}));

jest.mock('../hooks/useEvents', () => ({
    useFetchEvents: jest.fn(),
}));

jest.mock('../hooks/useApplication', () => ({
    useFetchAllApplication: jest.fn(),
}));

// Mock other dependencies
jest.mock('react-router-dom', () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    addDoc: jest.fn(),
    collection: jest.fn((db, collectionName) => `${collectionName}-ref`),
    doc: jest.fn((db, collectionName, id) => `${collectionName}-${id}-ref`),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
}));

// Fix SweetAlert2 mock to return a proper Promise
jest.mock('sweetalert2', () => ({
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false })),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
    Check: () => <span data-testid="check-icon">CheckIcon</span>,
}));

// Mock components
jest.mock('../components/PrimaryButton', () => ({ children, onClick, className }) => (
    <button onClick={onClick} className={className} data-testid="primary-button">
        {children}
    </button>
));

jest.mock('../components/PageLoading', () => () => <div data-testid="page-loading">Loading...</div>);
jest.mock('react-head', () => ({
    Title: () => <title>Contract</title>,
}));

// Mock constants
jest.mock('../constants/categories', () => ({
    termsOfCondition: {
        title: 'Terms and Conditions',
        description: 'Contract terms description',
        clauses: [
            {
                title: 'Clause 1',
                details: ['Detail 1.1', 'Detail 1.2'],
            },
        ],
    },
}));

// Import the mocked hooks from their individual files
import { useFetchSupplierById, useFetchSupplierServices } from '../hooks/useSupplier';
import { useFetchEvents } from '../hooks/useEvents';
import { useFetchAllApplication } from '../hooks/useApplication';

describe('EventContract Component - Process Contract', () => {
    const mockNavigate = jest.fn();
    const mockAddDoc = jest.fn();
    const mockUpdateDoc = jest.fn();

    const mockUserData = {
        id: 'user123',
        name: 'Test User',
    };

    const mockSupplier = {
        id: 'supplier123',
        supplier_name: 'Test Supplier',
    };

    const mockServices = [
        {
            id: 'service1',
            supplier_id: 'supplier123',
            service_plan: { label: 'Basic Plan' },
            service_price: 1000,
            service_inclusions: ['Inclusion 1', 'Inclusion 2'],
            service_payment_notice: { label: 'Payment notice' },
        },
        {
            id: 'service2',
            supplier_id: 'supplier123',
            service_plan: { label: 'Premium Plan' },
            service_price: 2000,
            service_inclusions: ['Inclusion 3', 'Inclusion 4'],
            service_payment_notice: { label: 'Payment notice' },
        },
    ];

    const mockEvents = [
        {
            id: 'event123',
            event_name: 'Test Event',
            user_id: 'user123',
        },
    ];

    const mockApplications = [
        {
            id: 'app123',
            event_id: 'event123',
            supplier_id: 'supplier123',
            status: 'Pending',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        useParams.mockReturnValue({
            eventId: 'event123',
            supplierId: 'supplier123',
        });

        useNavigate.mockReturnValue(mockNavigate);

        useFetchSupplierById.mockReturnValue({
            supplier: mockSupplier,
            isLoading: false,
        });

        useFetchSupplierServices.mockReturnValue({
            services: mockServices,
            isLoading: false,
        });

        useFetchEvents.mockReturnValue({
            events: mockEvents,
            isLoading: false,
        });

        useFetchAllApplication.mockReturnValue({
            applications: mockApplications,
        });

        addDoc.mockImplementation(mockAddDoc);
        updateDoc.mockImplementation(mockUpdateDoc);

        // Reset SweetAlert2 mock to return a resolved promise by default
        Swal.fire.mockImplementation(() => Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false }));
    });

    describe('TC-112: Planner approve supplier and send contract without selecting service plan', () => {
        it('should prevent proceeding without selecting a service plan and show error message', () => {
            render(<EventContract userData={mockUserData} />);

            // Verify we're on step 1 with service plans
            expect(screen.getByText('Test Supplier Service Plan')).toBeInTheDocument();
            expect(screen.getByText('Basic Plan')).toBeInTheDocument();
            expect(screen.getByText('Premium Plan')).toBeInTheDocument();

            // Try to proceed without selecting any service plan
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            // Should show error message
            expect(screen.getByText(/You must choose a service plan to proceed|Please select a service plan first/i)).toBeInTheDocument();

            // Should still show step 1 content prominently
            expect(screen.getByText('Test Supplier Service Plan')).toBeInTheDocument();

            // The "Proceed to Contract Details" button should still be visible (we're still on step 1)
            expect(screen.getByText('Proceed to Contract Details')).toBeInTheDocument();

            // Step 2 elements should not be functional - try to interact with them
            const sendOfferButton = screen.queryByText('Send Offer');
            if (sendOfferButton) {
                // Try to click the send offer button - it should not trigger any submission
                const originalAddDoc = mockAddDoc;
                fireEvent.click(sendOfferButton);
                // If we're still on step 1, the click shouldn't trigger contract creation
                expect(mockAddDoc).not.toHaveBeenCalled();
            }
        });

        it('should show visual error indication on service plan cards when trying to proceed without selection', () => {
            render(<EventContract userData={mockUserData} />);

            // Get service plan cards by their headings
            const basicPlanHeading = screen.getByText('Basic Plan');
            const premiumPlanHeading = screen.getByText('Premium Plan');

            const basicPlanCard = basicPlanHeading.closest('button');
            const premiumPlanCard = premiumPlanHeading.closest('button');

            // Initially, service cards should not have error styling
            expect(basicPlanCard?.className).not.toMatch(/border-red-300/);
            expect(premiumPlanCard?.className).not.toMatch(/border-red-300/);

            // Try to proceed without selection
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            // After error, service cards should have error styling (red border)
            // Check if either card has the error border class
            const hasErrorBorder = basicPlanCard?.className.includes('border-red-300') ||
                premiumPlanCard?.className.includes('border-red-300');
            expect(hasErrorBorder).toBe(true);
        });
    });

    describe('TC-113: Planner approve supplier and send contract', () => {
        beforeEach(() => {
            // Mock SweetAlert2 confirmation to return a proper Promise
            Swal.fire.mockImplementation(() => Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false }));
            mockAddDoc.mockResolvedValue({ id: 'contract123' });
        });

        it('should successfully proceed through contract creation flow when service plan is selected', async () => {
            render(<EventContract userData={mockUserData} />);

            // Step 1: Select a service plan by clicking the "Select Plan" button
            const selectPlanButtons = screen.getAllByText('Select Plan');
            fireEvent.click(selectPlanButtons[0]); // Select Basic Plan

            // Verify selection was made - check that the button text changed to "Selected"
            // Use getAllByText since there might be multiple elements with "Selected"
            const selectedElements = screen.getAllByText(/Selected/i);
            expect(selectedElements.length).toBeGreaterThan(0);

            // Proceed to step 2
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            // Should be on step 2 - Contract Details
            await waitFor(() => {
                expect(screen.getByText('Contract')).toBeInTheDocument();
            });

            // Verify step 2 content is now interactable
            expect(screen.getByText(/Selected Plan:/)).toBeInTheDocument();
            expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter any additional requirements or notes...')).toBeInTheDocument();
            expect(screen.getByText('Send Offer')).toBeInTheDocument();

            // Step 1 should no longer be the primary visible content
            // The "Proceed to Contract Details" button should not trigger step 1 behavior anymore
            const step1ProceedButton = screen.queryByText('Proceed to Contract Details');
            if (step1ProceedButton) {
                // Try to click it - it should not navigate us back to step 1
                const currentStep2Content = screen.getByText('Contract');
                fireEvent.click(step1ProceedButton);
                // We should still be on step 2
                expect(currentStep2Content).toBeInTheDocument();
            }
        });

        it('should successfully submit contract when all steps are completed', async () => {
            render(<EventContract userData={mockUserData} />);

            // Complete the entire flow
            // Step 1: Select service plan
            const selectPlanButtons = screen.getAllByText('Select Plan');
            fireEvent.click(selectPlanButtons[0]);

            // Step 1: Proceed to contract details
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            // Wait for step 2 to load
            await waitFor(() => {
                expect(screen.getByText('Contract')).toBeInTheDocument();
            });

            // Step 2: Submit contract
            const submitButton = screen.getByText('Send Offer');

            await act(async () => {
                fireEvent.click(submitButton);
            });

            // Should show SweetAlert confirmation
            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith({
                    title: 'Send Contract Offer?',
                    text: "You're about to send a contract offer to the selected supplier. This action confirms your proposed terms and initiates the agreement process.",
                    showConfirmButton: true,
                    confirmButtonText: 'Send Offer',
                    showCancelButton: true,
                });
            });

            // Should create contract in Firestore
            await waitFor(() => {
                expect(mockAddDoc).toHaveBeenCalledWith(collection(expect.anything(), 'contracts'), expect.objectContaining({
                    supplier_id: 'supplier123',
                    event_id: 'event123',
                    planner_id: 'user123',
                    service_plan: mockServices[0],
                    status: 'Pending'
                }));
            });

            // Should update application status
            await waitFor(() => {
                expect(mockUpdateDoc).toHaveBeenCalledWith(
                    doc(expect.anything(), 'applications', 'app123'),
                    {
                        status: 'Approved',
                        approve_at: 'mock-timestamp'
                    }
                );
            });

            // Should create notification
            await waitFor(() => {
                expect(mockAddDoc).toHaveBeenCalledWith(collection(expect.anything(), 'notifications'), expect.objectContaining({
                    message: `The event planner for "Test Event" applied for your service.`,
                    receiver_id: 'supplier123',
                    title: 'New service application received.'
                }));
            });

            // Should navigate back to event edit page
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/events/edit/event123');
            });
        });

        it('should handle contract submission with additional information', async () => {
            render(<EventContract userData={mockUserData} />);

            // Complete the flow with additional information
            const selectPlanButtons = screen.getAllByText('Select Plan');
            fireEvent.click(selectPlanButtons[0]);

            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            await waitFor(() => {
                expect(screen.getByText('Contract')).toBeInTheDocument();
            });

            // Add additional information
            const additionalInfoTextarea = screen.getByPlaceholderText('Enter any additional requirements or notes...');
            fireEvent.change(additionalInfoTextarea, {
                target: { value: 'Please arrive 30 minutes early for setup' }
            });

            // Submit contract
            const submitButton = screen.getByText('Send Offer');

            await act(async () => {
                fireEvent.click(submitButton);
            });

            // Should include additional information in contract
            await waitFor(() => {
                expect(mockAddDoc).toHaveBeenCalledWith(collection(expect.anything(), 'contracts'), expect.objectContaining({
                    additional_information: 'Please arrive 30 minutes early for setup'
                }));
            });
        });

        it('should show loading state during contract submission', async () => {
            // Delay the mock response to test loading state
            let resolvePromise;
            const promise = new Promise(resolve => {
                resolvePromise = resolve;
            });
            mockAddDoc.mockReturnValue(promise);

            render(<EventContract userData={mockUserData} />);

            // Complete the flow
            const selectPlanButtons = screen.getAllByText('Select Plan');
            fireEvent.click(selectPlanButtons[0]);
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            await waitFor(() => {
                expect(screen.getByText('Contract')).toBeInTheDocument();
            });

            // Submit contract
            const submitButton = screen.getByText('Send Offer');

            await act(async () => {
                fireEvent.click(submitButton);
            });

            // Should show loading state
            await waitFor(() => {
                expect(screen.getByText('Submitting..')).toBeInTheDocument();
            });

            // Button should be disabled during submission
            expect(submitButton).toBeDisabled();

            // Resolve the promise
            await act(async () => {
                resolvePromise({ id: 'contract123' });
            });
        });

        it('should handle contract submission cancellation', async () => {
            // Mock SweetAlert cancellation - return a rejected promise
            Swal.fire.mockImplementation(() => Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true }));

            render(<EventContract userData={mockUserData} />);

            // Complete the flow
            const selectPlanButtons = screen.getAllByText('Select Plan');
            fireEvent.click(selectPlanButtons[0]);
            const proceedButton = screen.getByText('Proceed to Contract Details');
            fireEvent.click(proceedButton);

            await waitFor(() => {
                expect(screen.getByText('Contract')).toBeInTheDocument();
            });

            // Submit contract but cancel
            const submitButton = screen.getByText('Send Offer');

            await act(async () => {
                fireEvent.click(submitButton);
            });

            // Should not create contract if cancelled
            await waitFor(() => {
                expect(mockAddDoc).not.toHaveBeenCalled();
            });

            // Should not navigate away
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    // describe('Edge Cases', () => {
    //     it('should auto-select service when only one service is available', () => {
    //         const singleService = [mockServices[0]];
    //         useFetchSupplierServices.mockReturnValue({
    //             services: singleService,
    //             isLoading: false,
    //         });

    //         render(<EventContract userData={mockUserData} />);

    //         // When only one service is available, it should be auto-selected
    //         const selectedElements = screen.getAllByText(/Selected/i);
    //         expect(selectedElements.length).toBeGreaterThan(0);

    //         // Should be able to proceed without manual selection
    //         const proceedButton = screen.getByText('Proceed to Contract Details');
    //         fireEvent.click(proceedButton);

    //         // Should proceed to step 2 without error
    //         expect(screen.getByText('Contract')).toBeInTheDocument();
    //     });

    //     it('should handle new application creation when no existing application exists', async () => {
    //         // Mock no existing application
    //         useFetchAllApplication.mockReturnValue({
    //             applications: [],
    //         });

    //         Swal.fire.mockImplementation(() => Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false }));
    //         mockAddDoc.mockResolvedValue({ id: 'contract123' });

    //         render(<EventContract userData={mockUserData} />);

    //         // Complete the flow
    //         const selectPlanButtons = screen.getAllByText('Select Plan');
    //         fireEvent.click(selectPlanButtons[0]);
    //         const proceedButton = screen.getByText('Proceed to Contract Details');
    //         fireEvent.click(proceedButton);

    //         await waitFor(() => {
    //             expect(screen.getByText('Contract')).toBeInTheDocument();
    //         });

    //         // Submit contract
    //         const submitButton = screen.getByText('Send Offer');

    //         await act(async () => {
    //             fireEvent.click(submitButton);
    //         });

    //         // Should create new application when none exists
    //         await waitFor(() => {
    //             expect(mockAddDoc).toHaveBeenCalledWith(collection(expect.anything(), 'applications'), {
    //                 supplier_id: 'supplier123',
    //                 event_id: 'event123',
    //                 applied_at: 'mock-timestamp',
    //                 status: 'Pending'
    //             });
    //         });
    //     });
    // });
});