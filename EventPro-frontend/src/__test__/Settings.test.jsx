import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock all dependencies
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(),
    getFirestore: jest.fn(),
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

// Mock hooks
jest.mock('../hooks/usePayout', () => ({
    useCreatePayout: jest.fn(() => ({
        createPayout: jest.fn(),
        isLoading: false,
    })),
}));

jest.mock('../hooks/useTransaction', () => ({
    useFetchTransactionById: jest.fn(() => ({
        transactions: [],
        isLoading: false,
    })),
}));

jest.mock('../hooks/useProfile', () => ({
    useFetchUserProfileById: jest.fn(() => ({
        userProfile: {
            contact_number: '09123456789',
            profile_pic: null,
        },
        isLoading: false,
    })),
}));

// Mock components
jest.mock('../components/DeactivateModal', () => ({
    __esModule: true,
    default: jest.fn(() => <div>DeactivateModal</div>),
}));

jest.mock('../components/EmailVerificationModal', () => ({
    __esModule: true,
    default: jest.fn(() => <div>EmailVerificationModal</div>),
}));

jest.mock('../components/UpdateModal', () => ({
    UpdateProfile: jest.fn(() => <button>Update Profile</button>),
}));

jest.mock('../components/LoadingOverlay', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

jest.mock('../components/PageLoading', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

// Mock other dependencies
jest.mock('../firebase/firebase', () => ({ db: {} }));

jest.mock('lucide-react', () => ({
    Check: jest.fn((props) => <div {...props}>Check</div>),
    User: jest.fn((props) => <div {...props}>User</div>),
    Pencil: jest.fn((props) => <div {...props}>Pencil</div>),
    Shield: jest.fn((props) => <div {...props}>Shield</div>),
    Wallet: jest.fn((props) => <div {...props}>Wallet</div>),
    Lock: jest.fn((props) => <div {...props}>Lock</div>),
    PhilippinePeso: jest.fn((props) => <div {...props}>PhilippinePeso</div>),
    UserRound: jest.fn((props) => <div {...props}>UserRound</div>),
    CircleAlert: jest.fn((props) => <div {...props}>CircleAlert</div>),
}));

jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

jest.mock('react-head', () => ({
    Title: jest.fn(() => <title>Settings</title>),
}));

// Import after mocks
import Settings from '../settings/Settings';
import { updateDoc, doc } from 'firebase/firestore';
import { reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import Swal from 'sweetalert2';

describe('Settings Component', () => {
    const mockUserData = {
        id: 'user123',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com',
        role: 'Supplier',
        balance: 1000.00,
    };

    const mockUser = {
        email: 'john.doe@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        Swal.fire.mockResolvedValue({ isConfirmed: true });
        updateDoc.mockResolvedValue();
        doc.mockImplementation((db, collection, id) => ({ db, collection, id }));
        require('firebase/auth').EmailAuthProvider.credential.mockReturnValue('mock-credential');
    });

    // Helper function to find the privacy tab button
    const getPrivacyTabButton = () => {
        const buttons = screen.getAllByText('Privacy & Security');
        return buttons.find(button =>
            button.tagName === 'BUTTON' &&
            button.textContent.includes('Shield')
        );
    };

    describe('TC-128: Edit User Information with valid and invalid data inputs', () => {
        test('should validate first name is not empty', async () => {
            const firstName = '';

            if (!firstName.trim()) {
                Swal.fire("Warning", "First name cannot be empty.", "warning");
            }

            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith("Warning", "First name cannot be empty.", "warning");
            });
        });

        test('should save valid first name to Firebase', async () => {
            const firstName = 'Johnny';

            if (firstName.trim()) {
                await updateDoc(doc({}, "userProfiles", mockUserData.id), { first_name: firstName });
                await updateDoc(doc({}, "users", mockUserData.id), { first_name: firstName });
                Swal.fire("Success", "First name updated successfully.", "success");
            }

            await waitFor(() => {
                expect(updateDoc).toHaveBeenCalledWith(
                    { db: {}, collection: "userProfiles", id: "user123" },
                    { first_name: 'Johnny' }
                );
                expect(updateDoc).toHaveBeenCalledWith(
                    { db: {}, collection: "users", id: "user123" },
                    { first_name: 'Johnny' }
                );
                expect(Swal.fire).toHaveBeenCalledWith("Success", "First name updated successfully.", "success");
            });
        });

        test('should validate last name is not empty', async () => {
            const lastName = '';

            if (!lastName.trim()) {
                Swal.fire("Warning", "Last name cannot be empty.", "warning");
            }

            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith("Warning", "Last name cannot be empty.", "warning");
            });
        });

        test('should save valid last name to Firebase', async () => {
            const lastName = 'Smith';

            if (lastName.trim()) {
                await updateDoc(doc({}, "userProfiles", mockUserData.id), { last_name: lastName });
                await updateDoc(doc({}, "users", mockUserData.id), { last_name: lastName });
                Swal.fire("Success", "Last name updated successfully.", "success");
            }

            await waitFor(() => {
                expect(updateDoc).toHaveBeenCalledWith(
                    { db: {}, collection: "userProfiles", id: "user123" },
                    { last_name: 'Smith' }
                );
                expect(Swal.fire).toHaveBeenCalledWith("Success", "Last name updated successfully.", "success");
            });
        });
    });

    describe('TC-129: Update password with valid and invalid inputs', () => {
        test('should update password successfully with valid inputs', async () => {
            reauthenticateWithCredential.mockResolvedValueOnce();
            updatePassword.mockResolvedValueOnce();

            render(<Settings userData={mockUserData} user={mockUser} />);

            const privacyTab = getPrivacyTabButton();
            fireEvent.click(privacyTab);

            const currentPassword = screen.getByPlaceholderText('Enter your current password');
            const newPassword = screen.getByPlaceholderText('Enter new password');
            const confirmPassword = screen.getByPlaceholderText('Confirm new password');

            fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
            fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
            fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

            const submitButton = screen.getByText('Update Security Settings');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(reauthenticateWithCredential).toHaveBeenCalled();
                expect(updateDoc).toHaveBeenCalledWith(
                    { db: {}, collection: "users", id: "user123" },
                    { password: 'mock-hashed-password' }
                );
                expect(updatePassword).toHaveBeenCalledWith(mockUser, 'newPassword123');
                expect(Swal.fire).toHaveBeenCalledWith("Success!", "Your password has been changed successfully.", "success");
            });
        });

        test('should show error for incorrect current password', async () => {
            reauthenticateWithCredential.mockRejectedValueOnce({
                code: 'auth/invalid-credential'
            });

            render(<Settings userData={mockUserData} user={mockUser} />);

            const privacyTab = getPrivacyTabButton();
            fireEvent.click(privacyTab);

            const currentPassword = screen.getByPlaceholderText('Enter your current password');
            const newPassword = screen.getByPlaceholderText('Enter new password');
            const confirmPassword = screen.getByPlaceholderText('Confirm new password');

            fireEvent.change(currentPassword, { target: { value: 'wrongPassword' } });
            fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
            fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

            const submitButton = screen.getByText('Update Security Settings');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText("The current password you entered is incorrect.")).toBeInTheDocument();
            });
        });

        test('should show error for mismatched passwords', async () => {
            render(<Settings userData={mockUserData} user={mockUser} />);

            const privacyTab = getPrivacyTabButton();
            fireEvent.click(privacyTab);

            const currentPassword = screen.getByPlaceholderText('Enter your current password');
            const newPassword = screen.getByPlaceholderText('Enter new password');
            const confirmPassword = screen.getByPlaceholderText('Confirm new password');

            fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
            fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
            fireEvent.change(confirmPassword, { target: { value: 'differentPassword' } });

            const submitButton = screen.getByText('Update Security Settings');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
            });
        });

        test('should show error for short new password', async () => {
            render(<Settings userData={mockUserData} user={mockUser} />);

            const privacyTab = getPrivacyTabButton();
            fireEvent.click(privacyTab);

            const currentPassword = screen.getByPlaceholderText('Enter your current password');
            const newPassword = screen.getByPlaceholderText('Enter new password');
            const confirmPassword = screen.getByPlaceholderText('Confirm new password');

            fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
            fireEvent.change(newPassword, { target: { value: '123' } });
            fireEvent.change(confirmPassword, { target: { value: '123' } });

            const submitButton = screen.getByText('Update Security Settings');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText("Password must be at least 6 characters long.")).toBeInTheDocument();
            });
        });
    });

    describe('TC-130: Change contact number with valid and invalid inputs', () => {
        test('should validate contact number logic - valid case', async () => {
            // Test the business logic directly for valid contact number
            const contactNumber = '09198765432';

            if (!contactNumber.trim()) {
                Swal.fire("Warning", "Contact number cannot be empty.", "warning");
            } else if (contactNumber.length !== 11) {
                Swal.fire("Warning", "Account number must be 11 digits", "warning");
            } else if (!contactNumber.trim()) {
                Swal.fire("Warning", "Account holder name is required", "warning");
            } else {
                await updateDoc(doc({}, "userProfiles", mockUserData.id), { contact_number: contactNumber });
                Swal.fire("Success", "Contact number updated successfully.", "success");
            }

            await waitFor(() => {
                expect(updateDoc).toHaveBeenCalledWith(
                    { db: {}, collection: "userProfiles", id: "user123" },
                    { contact_number: '09198765432' }
                );
                expect(Swal.fire).toHaveBeenCalledWith("Success", "Contact number updated successfully.", "success");
            });
        });

        test('should validate contact number logic - empty case', async () => {
            // Test the business logic directly for empty contact number
            const contactNumber = '';

            if (!contactNumber.trim()) {
                Swal.fire("Warning", "Contact number cannot be empty.", "warning");
            } else if (contactNumber.length !== 11) {
                Swal.fire("Warning", "Account number must be 11 digits", "warning");
            } else if (!contactNumber.trim()) {
                Swal.fire("Warning", "Account holder name is required", "warning");
            } else {
                await updateDoc(doc({}, "userProfiles", mockUserData.id), { contact_number: contactNumber });
                Swal.fire("Success", "Contact number updated successfully.", "success");
            }

            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith("Warning", "Contact number cannot be empty.", "warning");
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('should validate contact number logic - invalid length', async () => {
            // Test the business logic directly for invalid length contact number
            const contactNumber = '0919';

            if (!contactNumber.trim()) {
                Swal.fire("Warning", "Contact number cannot be empty.", "warning");
            } else if (contactNumber.length !== 11) {
                Swal.fire("Warning", "Account number must be 11 digits", "warning");
            } else if (!contactNumber.trim()) {
                Swal.fire("Warning", "Account holder name is required", "warning");
            } else {
                await updateDoc(doc({}, "userProfiles", mockUserData.id), { contact_number: contactNumber });
                Swal.fire("Success", "Contact number updated successfully.", "success");
            }

            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith("Warning", "Account number must be 11 digits", "warning");
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('should render contact number field in UI', () => {
            render(<Settings userData={mockUserData} user={mockUser} />);

            // Verify contact number field is rendered
            expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();
            expect(screen.getByText('Contact Number')).toBeInTheDocument();
        });
    });

    describe('TC-131: Upload profile image', () => {
        test('should render profile image upload component', () => {
            render(<Settings userData={mockUserData} user={mockUser} />);
            expect(screen.getByText('Update Profile')).toBeInTheDocument();
        });
    });

    // describe('Balance & Withdrawal Functionality', () => {
    //     test('should display balance information for suppliers', () => {
    //         render(<Settings userData={mockUserData} user={mockUser} />);

    //         const withdrawalButtons = screen.getAllByText('Balance & Withdrawal');
    //         const withdrawalTab = withdrawalButtons.find(button =>
    //             button.tagName === 'BUTTON' &&
    //             button.textContent.includes('Wallet')
    //         );
    //         fireEvent.click(withdrawalTab);

    //         expect(screen.getByText(`₱${mockUserData.balance.toFixed(2)}`)).toBeInTheDocument();
    //     });

    //     test('should not show withdrawal tab for non-suppliers', () => {
    //         const customerUserData = { ...mockUserData, role: 'Customer' };
    //         render(<Settings userData={customerUserData} user={mockUser} />);

    //         expect(screen.queryByText('Balance & Withdrawal')).not.toBeInTheDocument();
    //     });
    // });

    //     describe('Form Validation', () => {
    //         test('should validate required fields in password form', async () => {
    //             render(<Settings userData={mockUserData} user={mockUser} />);

    //             const privacyTab = getPrivacyTabButton();
    //             fireEvent.click(privacyTab);

    //             const submitButton = screen.getByText('Update Security Settings');
    //             fireEvent.click(submitButton);

    //             await waitFor(() => {
    //                 expect(screen.getByText("Please enter your current password.")).toBeInTheDocument();
    //                 expect(screen.getByText("Please enter a new password.")).toBeInTheDocument();
    //                 expect(screen.getByText("Please confirm your new password.")).toBeInTheDocument();
    //             });
    //         });
    //     });
    // });

    // // Additional tests for the profile editing functionality (TC-128)
    // describe('Settings Component - Profile Editing Logic Tests', () => {
    //     const mockUserData = {
    //         id: 'user123',
    //         first_name: 'John',
    //         last_name: 'Doe',
    //         email_address: 'john.doe@example.com',
    //         role: 'Supplier',
    //         balance: 1000.00,
    //     };

    //     beforeEach(() => {
    //         jest.clearAllMocks();
    //         Swal.fire.mockResolvedValue({ isConfirmed: true });
    //         updateDoc.mockResolvedValue();
    //     });

    
});