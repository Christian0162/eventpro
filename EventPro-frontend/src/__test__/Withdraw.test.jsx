import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '../settings/Settings';

// Mock all dependencies at the top level
jest.mock('../hooks/usePayout', () => ({
    useCreatePayout: jest.fn(),
}));

jest.mock('../hooks/useTransaction', () => ({
    useFetchTransactionById: jest.fn(),
}));

jest.mock('../hooks/useProfile', () => ({
    useFetchUserProfileById: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    EmailAuthProvider: {
        credential: jest.fn(),
    },
    reauthenticateWithCredential: jest.fn(),
    updatePassword: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
    fire: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
    genSaltSync: jest.fn(() => 'mock-salt'),
    hashSync: jest.fn(() => 'mock-hashed-password'),
}));

jest.mock('lucide-react', () => ({
    Check: () => 'Check',
    User: () => 'User',
    Pencil: () => 'Pencil',
    Shield: () => 'Shield',
    Wallet: () => 'Wallet',
    Lock: () => 'Lock',
    PhilippinePeso: () => 'PhilippinePeso',
    UserRound: () => 'UserRound',
    CircleAlert: () => 'CircleAlert',
}));

jest.mock('../firebase/firebase', () => ({
    db: {},
}));

jest.mock('../components/DeactivateModal', () => () => <div>DeactivateModal</div>);
jest.mock('../components/EmailVerificationModal', () => () => <div>EmailVerificationModal</div>);
jest.mock('../components/UpdateModal', () => ({
    UpdateProfile: () => <div>UpdateProfile</div>,
}));
jest.mock('../components/LoadingOverlay', () => ({ isLoading, message }) =>
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null
);
jest.mock('../components/PageLoading', () => () => <div>PageLoading</div>);

jest.mock('../constants/categories', () => ({
    paymentMethods: [
        {
            name: 'GCash',
            method: 'GCASH',
            payment_method_logo: 'gcash-logo.png',
            type: 'E-Wallet',
            color: 'bg-green-500'
        }
    ],
}));

// Mock react-head
jest.mock('react-head', () => ({
    Title: () => null,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const mockUserData = {
    id: 'user123',
    first_name: 'John',
    last_name: 'Doe',
    email_address: 'john@example.com',
    role: 'Supplier',
    balance: 1000.00
};

const mockUser = {
    email: 'john@example.com'
};

const mockUserProfile = {
    contact_number: '09123456789',
    profile_pic: null
};

const mockTransactions = [
    {
        type: 'CREDIT',
        amount: 500,
        created_at: { toDate: () => new Date() }
    }
];

describe('Settings Component - Withdrawal Functionality', () => {
    const mockUseCreatePayout = jest.requireMock('../hooks/usePayout').useCreatePayout;
    const mockUseFetchTransactionById = jest.requireMock('../hooks/useTransaction').useFetchTransactionById;
    const mockUseFetchUserProfileById = jest.requireMock('../hooks/useProfile').useFetchUserProfileById;

    beforeEach(() => {
        mockUseCreatePayout.mockReturnValue({
            createPayout: jest.fn(),
            isLoading: false
        });

        mockUseFetchTransactionById.mockReturnValue({
            transactions: mockTransactions,
            isLoading: false
        });

        mockUseFetchUserProfileById.mockReturnValue({
            userProfile: mockUserProfile,
            isLoading: false
        });

        // Clear scrollIntoView mock
        Element.prototype.scrollIntoView.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Helper to click withdrawal tab
    const clickWithdrawalTab = () => {
        // Find the button that contains "Balance & Withdrawal" text
        const buttons = screen.getAllByRole('button');
        const withdrawalButton = buttons.find(button =>
            button.textContent.includes('Balance & Withdrawal')
        );
        if (withdrawalButton) {
            fireEvent.click(withdrawalButton);
        } else {
            throw new Error('Withdrawal tab button not found');
        }
    };

    // Helper to find text with flexible matching
    const findText = (text) => {
        return screen.getByText((content, element) => {
            // Check if the element's text content includes the target text
            const hasText = element => element.textContent.includes(text);
            const elementHasText = hasText(element);
            const childrenDontHaveText = Array.from(element?.children || []).every(
                child => !hasText(child)
            );
            return elementHasText && childrenDontHaveText;
        });
    };

    // TC-01: Successful withdrawal request
    test('TC-099: Should successfully process withdrawal with valid data', async () => {
        const mockCreatePayout = jest.fn();
        mockUseCreatePayout.mockReturnValue({
            createPayout: mockCreatePayout,
            isLoading: false
        });

        render(<Settings userData={mockUserData} user={mockUser} />);

        // Switch to withdrawal tab using helper
        clickWithdrawalTab();

        // Wait for withdrawal content to load
        await waitFor(() => {
            expect(screen.getByText('Available Balance')).toBeInTheDocument();
        });

        // Enter withdrawal amount
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '500' } });

        // Select payment method
        const gcashMethod = screen.getByText((content, element) => {
            return element.textContent === 'GCash';
        });
        fireEvent.click(gcashMethod);

        // Fill account details
        const accountNameInput = screen.getByPlaceholderText('Account Holder Name');
        const accountNumberInput = screen.getByPlaceholderText('Account Number');

        fireEvent.change(accountNameInput, { target: { value: 'John Doe' } });
        fireEvent.change(accountNumberInput, { target: { value: '09123456789' } });

        // Submit withdrawal request
        const withdrawButton = screen.getByText('Request Withdrawal');
        fireEvent.click(withdrawButton);

        await waitFor(() => {
            expect(mockCreatePayout).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 500,
                    account_holder_name: 'John Doe',
                    account_number: '09123456789',
                    channel_code: 'PH_GCASH'
                }),
                mockUserData
            );
        });
    });

    // TC-02: Insufficient balance validation
    test('TC-100: Should show error when withdrawal amount exceeds balance', async () => {
        const userDataWithLowBalance = { ...mockUserData, balance: 100 };

        render(<Settings userData={userDataWithLowBalance} user={mockUser} />);

        clickWithdrawalTab();

        // Wait for withdrawal content
        await waitFor(() => {
            expect(screen.getByText('Available Balance')).toBeInTheDocument();
        });

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '500' } });

        const withdrawButton = screen.getByText('Request Withdrawal');
        fireEvent.click(withdrawButton);

        // Use the flexible text finder for error messages
        await waitFor(() => {
            expect(findText('Withdrawal amount cannot exceed your available balance')).toBeInTheDocument();
        });
    });

    // TC-03: Payment method validation
    test('TC-101: Should show error when no payment method selected', async () => {
        render(<Settings userData={mockUserData} user={mockUser} />);

        clickWithdrawalTab();

        // Wait for withdrawal content
        await waitFor(() => {
            expect(screen.getByText('Available Balance')).toBeInTheDocument();
        });

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '500' } });

        const withdrawButton = screen.getByText('Request Withdrawal');
        fireEvent.click(withdrawButton);

        // Use the flexible text finder for error messages
        await waitFor(() => {
            expect(findText('Select Payment Method')).toBeInTheDocument();
        });
    });

    // TC-04: Account number validation
    test('TC-102: Should validate account number format and length', async () => {
        render(<Settings userData={mockUserData} user={mockUser} />);

        clickWithdrawalTab();

        // Wait for withdrawal content
        await waitFor(() => {
            expect(screen.getByText('Available Balance')).toBeInTheDocument();
        });

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '500' } });

        const gcashMethod = screen.getByText((content, element) => {
            return element.textContent === 'GCash';
        });
        fireEvent.click(gcashMethod);

        const accountNumberInput = screen.getByPlaceholderText('Account Number');
        fireEvent.change(accountNumberInput, { target: { value: '123' } }); // Invalid length

        const withdrawButton = screen.getByText('Request Withdrawal');
        fireEvent.click(withdrawButton);

        // Use the flexible text finder for error messages
        await waitFor(() => {
            expect(findText('Account number must be 11 digits')).toBeInTheDocument();
        });
    });

    // TC-05: Loading state during payout
    test('TC-103: Should show loading state during payout processing', async () => {
        mockUseCreatePayout.mockReturnValue({
            createPayout: jest.fn(),
            isLoading: true
        });

        render(<Settings userData={mockUserData} user={mockUser} />);

        clickWithdrawalTab();

        // Wait for withdrawal content
        await waitFor(() => {
            expect(screen.getByText('Available Balance')).toBeInTheDocument();
        });

        // Check for loading overlay using testid - match the exact message from your component
        expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('loading-overlay')).toHaveTextContent("Do not refresh until it’s done...");
    });

    // TC-06: Empty withdrawal amount validation
    // test('TC-06: Should show error when withdrawal amount is empty or zero', async () => {
    //     render(<Settings userData={mockUserData} user={mockUser} />);

    //     clickWithdrawalTab();

    //     // Wait for withdrawal content
    //     await waitFor(() => {
    //         expect(screen.getByText('Available Balance')).toBeInTheDocument();
    //     });

    //     const gcashMethod = screen.getByText((content, element) => {
    //         return element.textContent === 'GCash';
    //     });
    //     fireEvent.click(gcashMethod);

    //     const accountNameInput = screen.getByPlaceholderText('Account Holder Name');
    //     const accountNumberInput = screen.getByPlaceholderText('Account Number');

    //     fireEvent.change(accountNameInput, { target: { value: 'John Doe' } });
    //     fireEvent.change(accountNumberInput, { target: { value: '09123456789' } });

    //     const withdrawButton = screen.getByText('Request Withdrawal');
    //     fireEvent.click(withdrawButton);

    //     // Use the flexible text finder for error messages
    //     await waitFor(() => {
    //         expect(findText('Please enter a valid withdrawal amount')).toBeInTheDocument();
    //     });
    // });

    // // TC-07: Zero balance validation
    // test('TC-07: Should show error when user has zero balance', async () => {
    //     const userDataWithZeroBalance = { ...mockUserData, balance: 0 };

    //     render(<Settings userData={userDataWithZeroBalance} user={mockUser} />);

    //     clickWithdrawalTab();

    //     // Wait for withdrawal content
    //     await waitFor(() => {
    //         expect(screen.getByText('Available Balance')).toBeInTheDocument();
    //     });

    //     const amountInput = screen.getByPlaceholderText('0.00');
    //     fireEvent.change(amountInput, { target: { value: '100' } });

    //     const withdrawButton = screen.getByText('Request Withdrawal');
    //     fireEvent.click(withdrawButton);

    //     // Use the flexible text finder for error messages
    //     await waitFor(() => {
    //         expect(findText('You have no available balance to withdraw')).toBeInTheDocument();
    //     });
    // });

    // // TC-08: Should handle scrollIntoView errors gracefully
    // test('TC-08: Should handle ref errors without crashing', async () => {
    //     // Temporarily break scrollIntoView to test error handling
    //     const originalScrollIntoView = Element.prototype.scrollIntoView;
    //     Element.prototype.scrollIntoView = jest.fn(() => {
    //         throw new Error('Scroll error');
    //     });

    //     render(<Settings userData={mockUserData} user={mockUser} />);

    //     clickWithdrawalTab();

    //     // Wait for withdrawal content
    //     await waitFor(() => {
    //         expect(screen.getByText('Available Balance')).toBeInTheDocument();
    //     });

    //     const amountInput = screen.getByPlaceholderText('0.00');
    //     fireEvent.change(amountInput, { target: { value: '500' } });

    //     const withdrawButton = screen.getByText('Request Withdrawal');

    //     // This should not crash even if scrollIntoView fails
    //     expect(() => {
    //         fireEvent.click(withdrawButton);
    //     }).not.toThrow();

    //     // Restore original function
    //     Element.prototype.scrollIntoView = originalScrollIntoView;
    // });
});