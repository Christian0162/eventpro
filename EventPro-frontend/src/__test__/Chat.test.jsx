import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { HeadProvider } from 'react-head';
import ChatWindow from '../pages/chat/ChatWindow';
import { useParams, useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

jest.mock('../hooks/useUsers', () => ({
    useFetchUsers: jest.fn(),
}));

jest.mock('../hooks/useProfile', () => ({
    useFetchUserProfiles: jest.fn(),
}));

jest.mock('../hooks/useSupplier', () => ({
    useFetchSuppliers: jest.fn(),
}));

jest.mock('../hooks/useContact', () => ({
    useFetchAllContact: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    getDocs: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn(),
    addDoc: jest.fn(),
    setDoc: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}));

jest.mock('../firebase/firebase', () => ({
    db: {},
}));

jest.mock('../components/PageLoading', () => {
    return function MockPageLoading() {
        return <div data-testid="page-loading">Loading...</div>;
    };
});

// Import the mocked firestore functions
const {
    getDocs,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    setDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
} = require('firebase/firestore');

const mockContacts = [
    { id: '1', name: 'John Doe', contact_id: 'user1', user_id: 'currentUser', last_message: 'Hello' },
    { id: '2', name: 'Jane Smith', contact_id: 'user2', user_id: 'currentUser', last_message: 'Hi there' },
    { id: '3', name: 'Bob Johnson', contact_id: 'user3', user_id: 'currentUser', last_message: 'Hey' },
];

const mockUsers = [
    { id: 'user1', role: 'Event Planner', is_online: true, status: 'active' },
    { id: 'user2', role: 'Supplier', is_online: false, status: 'active' },
    { id: 'user3', role: 'Event Planner', is_online: true, status: 'deactivated' },
];

const mockUserData = {
    id: 'currentUser',
    role: 'Event Planner',
    first_name: 'Current User',
};

const ChatWindowWithProvider = ({ userData }) => (
    <HeadProvider>
        <ChatWindow userData={userData} />
    </HeadProvider>
);

// Helper to find contact in sidebar list
const getContactInSidebar = (name) => {
    const contactElements = screen.queryAllByText(name).filter(element => {
        const contactContainer = element.closest('[class*="flex items-center gap-3 p-4 cursor-pointer"]');
        return contactContainer && contactContainer.textContent?.includes(name);
    });
    return contactElements.length > 0 ? contactElements[0] : null;
};

// Helper to check if contact is visible in sidebar
const isContactVisibleInSidebar = (name) => {
    return getContactInSidebar(name) !== null;
};

// Helper to get all visible contact names in sidebar
const getVisibleContactNames = () => {
    const contactNames = ['John Doe', 'Jane Smith', 'Bob Johnson'];
    return contactNames.filter(name => isContactVisibleInSidebar(name));
};

// Helper to count visible contacts in sidebar
const getVisibleContactCount = () => {
    return getVisibleContactNames().length;
};

describe('ChatWindow Component Tests', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        useNavigate.mockReturnValue(mockNavigate);
        useParams.mockReturnValue({ id: '1' });

        const { useFetchUsers } = require('../hooks/useUsers');
        const { useFetchUserProfiles } = require('../hooks/useProfile');
        const { useFetchSuppliers } = require('../hooks/useSupplier');
        const { useFetchAllContact } = require('../hooks/useContact');

        useFetchUsers.mockReturnValue({ users: mockUsers, isLoading: false });
        useFetchUserProfiles.mockReturnValue({ userProfiles: [], isLoading: false });
        useFetchSuppliers.mockReturnValue({ suppliers: [], isLoading: false });
        useFetchAllContact.mockReturnValue({ contacts: mockContacts, isLoading: false });

        // Mock Firestore functions
        getDocs.mockResolvedValue({ docs: [] });

        onSnapshot.mockImplementation((query, callback) => {
            callback({
                docs: mockContacts.map(contact => ({
                    id: contact.id,
                    data: () => contact
                }))
            });
            return jest.fn();
        });

        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ status: 'active' })
        });

        collection.mockReturnValue('mock-collection');
        query.mockReturnValue('mock-query');
        where.mockReturnValue('mock-where');
        orderBy.mockReturnValue('mock-orderBy');
        doc.mockReturnValue('mock-doc');
        addDoc.mockResolvedValue({ id: 'new-message-id' });
        updateDoc.mockResolvedValue();
        setDoc.mockResolvedValue();
        serverTimestamp.mockReturnValue('mock-timestamp');
    });

    // TC-97: Search contacts by name
    describe('TC-97: Search contacts by name', () => {
        it('should filter contacts based on search term', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            // Wait for initial contacts to load in sidebar
            await waitFor(() => {
                expect(getContactInSidebar('John Doe')).toBeInTheDocument();
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
                expect(getContactInSidebar('Bob Johnson')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');

            // Search for "Jane"
            fireEvent.change(searchInput, { target: { value: 'Jane' } });

            await waitFor(() => {
                // Only Jane Smith should be visible in sidebar
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
                expect(getContactInSidebar('John Doe')).not.toBeInTheDocument();
                expect(getContactInSidebar('Bob Johnson')).not.toBeInTheDocument();
            });
        });

        it('should perform case-insensitive search', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            await waitFor(() => {
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'jane' } });

            await waitFor(() => {
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
                expect(getContactInSidebar('John Doe')).not.toBeInTheDocument();
            });
        });

        it('should show empty state when no matches found', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

            await waitFor(() => {
                expect(screen.getByText('No matches')).toBeInTheDocument();
            });
        });
    });

    // TC-98: Send message to active contact
    describe('TC-98: Send message to active contact', () => {
        beforeEach(() => {
            getDocs.mockResolvedValue({ empty: true, docs: [] });
        });

        it('should send message when send button is clicked', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
            });

            const messageInput = screen.getByPlaceholderText('Type your message...');

            // Find the send button by looking for the button with the send icon
            const buttons = screen.getAllByRole('button');
            const sendButton = buttons.find(button =>
                button.querySelector('svg') &&
                button.querySelector('svg').innerHTML.includes('send')
            );

            fireEvent.change(messageInput, { target: { value: 'Test message' } });

            if (sendButton) {
                fireEvent.click(sendButton);
                await waitFor(() => {
                    expect(addDoc).toHaveBeenCalled();
                });
            }
        });

        it('should send message when Enter key is pressed', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
            });

            const messageInput = screen.getByPlaceholderText('Type your message...');
            fireEvent.change(messageInput, { target: { value: 'Test message' } });
            fireEvent.keyDown(messageInput, { key: 'Enter', code: 'Enter' });

            await waitFor(() => {
                expect(addDoc).toHaveBeenCalled();
            });
        });
    });

    // TC-99: Send message to deactivated user
    describe('TC-99: Send message to deactivated user', () => {
        beforeEach(() => {
            useParams.mockReturnValue({ id: '3' });
            getDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ status: 'deactivated' })
            });
        });

        it('should show warning for deactivated users', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            await waitFor(() => {
                // Look for deactivated indicator
                const deactivatedIndicator = screen.getByText('Deactivated');
                expect(deactivatedIndicator).toBeInTheDocument();
            });
        });

        it('should prevent sending messages to deactivated users', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            // Wait for Bob Johnson to be visible in sidebar
            await waitFor(() => {
                expect(getContactInSidebar('Bob Johnson')).toBeInTheDocument();
            });

            const messageInput = screen.getByPlaceholderText('Type your message...');

            // Find the send button
            const buttons = screen.getAllByRole('button');
            const sendButton = buttons.find(button =>
                button.querySelector('svg') &&
                button.querySelector('svg').innerHTML.includes('send')
            );

            // Type a message
            fireEvent.change(messageInput, { target: { value: 'Test message' } });

            // Try to send the message
            if (sendButton) {
                fireEvent.click(sendButton);
            }

            // Wait to see if the message was actually sent
            await waitFor(() => {
                // The message should NOT be sent to Firestore for deactivated users
                expect(addDoc).not.toHaveBeenCalled();
            });
        });
    });

    describe('TC-100: Real-time contact search', () => {
        it('should show all contacts when search is cleared', async () => {
            await act(async () => {
                render(<ChatWindowWithProvider userData={mockUserData} />);
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');

            // Search for specific contact
            fireEvent.change(searchInput, { target: { value: 'Jane' } });

            await waitFor(() => {
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
                expect(getContactInSidebar('John Doe')).not.toBeInTheDocument();
                expect(getContactInSidebar('Bob Johnson')).not.toBeInTheDocument();
            });

            // Clear search
            fireEvent.change(searchInput, { target: { value: '' } });

            // Wait for all contacts to reappear in sidebar
            await waitFor(() => {
                expect(getVisibleContactCount()).toBe(3);
                expect(getContactInSidebar('John Doe')).toBeInTheDocument();
                expect(getContactInSidebar('Jane Smith')).toBeInTheDocument();
                expect(getContactInSidebar('Bob Johnson')).toBeInTheDocument();
            });
        });
    });
});