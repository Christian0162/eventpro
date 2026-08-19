import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import Profile from '../profile/Profile';

// Mock Firebase configuration
jest.mock('../firebase/firebase', () => ({
    db: {
        // Mock database object
    }
}));

// Mock Firebase firestore functions
const mockDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    doc: (...args) => mockDoc(...args),
    onSnapshot: (...args) => mockOnSnapshot(...args),
    updateDoc: (...args) => mockUpdateDoc(...args),
}));

// Mock hooks
const mockUseFetchUserProfileById = jest.fn();
const mockUseFetchUserProfiles = jest.fn();
const mockUseFetchReviews = jest.fn();
const mockUseFetchUsers = jest.fn();

jest.mock('../hooks/useProfile', () => ({
    useFetchUserProfileById: () => mockUseFetchUserProfileById(),
    useFetchUserProfiles: () => mockUseFetchUserProfiles(),
}));

jest.mock('../hooks/useReviews', () => ({
    useFetchReviews: () => mockUseFetchReviews(),
}));

jest.mock('../hooks/useUsers', () => ({
    useFetchUsers: () => mockUseFetchUsers(),
}));

// Mock components
jest.mock('../components/ProfileHover', () => () => <div>ProfileHover</div>);
jest.mock('../components/PageLoading', () => () => <div>Loading...</div>);

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
    Star: ({ className }) => <div data-testid="star" className={className}>Star</div>,
    BadgeCheck: ({ className }) => <div data-testid="badge-check" className={className}>BadgeCheck</div>,
    Badge: ({ className }) => <div data-testid="badge" className={className}>Badge</div>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

// Mock react-head
jest.mock('react-head', () => ({
    Title: () => <title>Profile</title>,
}));

describe('Profile Page - Edit Description', () => {
    const mockUserData = {
        id: 'user123',
        first_name: 'John',
        email_address: 'john@example.com',
        role: 'Event Planner',
        verification_status: 'verified'
    };

    const mockUserProfile = {
        contact_number: '1234567890',
        description: 'Initial description',
        profile_pic: null
    };

    const mockDocRef = {
        // Mock document reference
        id: 'user123'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        mockUseFetchUserProfileById.mockReturnValue({ userProfile: mockUserProfile });
        mockUseFetchUserProfiles.mockReturnValue({ userProfiles: [], isLoading: false });
        mockUseFetchReviews.mockReturnValue({ reviews: [] });
        mockUseFetchUsers.mockReturnValue({ users: [], isLoading: false });

        // Mock doc to return a document reference
        mockDoc.mockReturnValue(mockDocRef);
        mockUpdateDoc.mockResolvedValue(); // Default to resolved promise
    });

    // TC-136: Edit description with empty description
    test('TC-136: Should save empty description successfully', async () => {
        render(<Profile userData={mockUserData} />);

        // Find and click the Edit button
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        // Find the textarea and clear it
        const descriptionTextarea = screen.getByPlaceholderText('Write a brief description of what you do.');
        fireEvent.change(descriptionTextarea, { target: { value: '' } });

        // Find and click the Save button
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Wait for the update to complete
        await waitFor(() => {
            expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
                description: ''
            });
        });

        // Verify that editing mode is closed
        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.queryByText('Save')).not.toBeInTheDocument();
        });
    });

    // TC-137: Edit description with new description
    test('TC-137: Should save new description successfully', async () => {
        const newDescription = 'This is my new description for testing purposes.';

        render(<Profile userData={mockUserData} />);

        // Find and click the Edit button
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        // Find the textarea and enter new description
        const descriptionTextarea = screen.getByPlaceholderText('Write a brief description of what you do.');
        fireEvent.change(descriptionTextarea, { target: { value: newDescription } });

        // Find and click the Save button
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Wait for the update to complete and verify the call
        await waitFor(() => {
            expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
                description: newDescription
            });
        });

        // Verify that editing mode is closed and Edit button is visible again
        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.queryByText('Save')).not.toBeInTheDocument();
        });
    });

    // test('Should show loading state when saving description', async () => {
    //     // Mock a delayed update to test loading state
    //     let resolveUpdate;
    //     const updatePromise = new Promise(resolve => {
    //         resolveUpdate = resolve;
    //     });
    //     mockUpdateDoc.mockReturnValueOnce(updatePromise);

    //     render(<Profile userData={mockUserData} />);

    //     // Enter edit mode and make changes
    //     const editButton = screen.getByText('Edit');
    //     fireEvent.click(editButton);

    //     const descriptionTextarea = screen.getByPlaceholderText('Write a brief description of what you do.');
    //     fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });

    //     // Click save
    //     const saveButton = screen.getByText('Save');
    //     fireEvent.click(saveButton);

    //     // Verify loading state is shown (spinner)
    //     await waitFor(() => {
    //         const spinner = document.querySelector('.animate-spin');
    //         expect(spinner).toBeInTheDocument();
    //     });

    //     // Resolve the update
    //     await act(async () => {
    //         resolveUpdate();
    //     });

    //     // Verify loading state is removed
    //     await waitFor(() => {
    //         const spinner = document.querySelector('.animate-spin');
    //         expect(spinner).not.toBeInTheDocument();
    //     });
    // });

    // test('Should cancel editing when Cancel button is clicked', () => {
    //     render(<Profile userData={mockUserData} />);

    //     // Enter edit mode
    //     const editButton = screen.getByText('Edit');
    //     fireEvent.click(editButton);

    //     // Verify Cancel button is shown and click it
    //     const cancelButton = screen.getByText('Cancel');
    //     expect(cancelButton).toBeInTheDocument();

    //     fireEvent.click(cancelButton);

    //     // Verify we're back to edit mode with Edit button
    //     expect(screen.getByText('Edit')).toBeInTheDocument();
    //     expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    // });

    // test('Should handle description update error', async () => {
    //     // Mock a rejected update
    //     mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

    //     const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    //     render(<Profile userData={mockUserData} />);

    //     // Enter edit mode and make changes
    //     const editButton = screen.getByText('Edit');
    //     fireEvent.click(editButton);

    //     const descriptionTextarea = screen.getByPlaceholderText('Write a brief description of what you do.');
    //     fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });

    //     // Click save
    //     const saveButton = screen.getByText('Save');
    //     fireEvent.click(saveButton);

    //     // Wait for the error to be handled
    //     await waitFor(() => {
    //         expect(consoleSpy).toHaveBeenCalled();
    //     });

    //     // Clean up
    //     consoleSpy.mockRestore();
    // });
});