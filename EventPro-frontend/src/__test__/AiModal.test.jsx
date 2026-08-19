import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIModal from '../components/AIModal';

// Mock everything that might cause issues
jest.mock('../firebase/firebase', () => ({
    db: {}
}));

// Mock Firebase with more detailed implementation
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();

jest.mock('firebase/firestore', () => ({
    collection: (...args) => mockCollection(...args),
    getDocs: (...args) => mockGetDocs(...args),
    query: (...args) => mockQuery(...args),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
}));

// Mock hooks
jest.mock('../hooks/useReviews', () => ({
    useFetchReviews: jest.fn(() => ({ reviews: [] }))
}));

// Mock dependencies
jest.mock('compromise', () => () => ({
    numbers: () => ({ out: () => [] })
}));

// Mock Fuse.js properly
const mockFuseSearch = jest.fn();
jest.mock('fuse.js', () => {
    return jest.fn().mockImplementation(() => ({
        search: mockFuseSearch
    }));
});

// Simple mocks for UI components
jest.mock('lucide-react', () => ({
    Bot: () => 'Bot',
    X: () => 'X',
    Search: () => 'Search',
}));

jest.mock('@headlessui/react', () => ({
    Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogPanel: ({ children }) => <div>{children}</div>,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>
}));

global.fetch = jest.fn();

describe('AI Modal - TC-137: Supplier Recommendations', () => {
    const mockAiResponse = jest.fn();
    const mockAiShops = jest.fn();

    const mockShops = [
        {
            id: '1',
            supplier_name: 'Wedding Florist Pro',
            supplier_type: { label: 'Florist' },
            supplier_expertise: ['Wedding Flowers'],
            avg_rating: 4.8
        },
        {
            id: '2',
            supplier_name: 'Corporate Catering Co',
            supplier_type: { label: 'Caterer' },
            supplier_expertise: ['Corporate Events'],
            avg_rating: 4.5
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        const { useFetchReviews } = require('../hooks/useReviews');
        useFetchReviews.mockReturnValue({ reviews: [] });

        // Mock Firebase to return shops
        mockCollection.mockReturnValue('shops');
        mockQuery.mockReturnValue('query');
        mockGetDocs.mockResolvedValue({
            docs: mockShops.map(shop => ({
                id: shop.id,
                data: () => shop
            }))
        });

        // Mock Fuse.js to return results
        mockFuseSearch.mockReturnValue(
            mockShops.map(shop => ({ item: shop, score: 0.1 }))
        );

        // Mock successful AI response
        fetch.mockResolvedValue({
            json: () => Promise.resolve({
                recommendations: 'Wedding Florist Pro, Corporate Catering Co'
            })
        });
    });

    test('TC-137: Should suggest suppliers based on event type', async () => {
        render(<AIModal ai_response={mockAiResponse} ai_shops={mockAiShops} />);

        // Open the modal
        const openButton = screen.getByText(/ai search/i);
        fireEvent.click(openButton);

        // Wait for modal to open and verify
        await waitFor(() => {
            expect(screen.getByTestId('dialog')).toBeInTheDocument();
        });

        // Find input and enter search term
        const searchInput = screen.getByPlaceholderText(/example/i);
        fireEvent.change(searchInput, { target: { value: 'wedding florist' } });

        // Click search button
        const searchButton = screen.getByText(/search with ai/i);
        fireEvent.click(searchButton);

        // Wait for and verify the API call
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "https://eventpro-backend-python.onrender.com/api/v1/recommend",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );
        });

        // Verify the response was handled
        await waitFor(() => {
            expect(mockAiResponse).toHaveBeenCalledWith('Wedding Florist Pro, Corporate Catering Co');
        });
    });

    // test('Should handle empty prompt error', async () => {
    //     render(<AIModal ai_response={mockAiResponse} ai_shops={mockAiShops} />);

    //     // Open modal
    //     fireEvent.click(screen.getByText(/ai search/i));

    //     // Click search without entering anything
    //     fireEvent.click(screen.getByText(/search with ai/i));

    //     // Verify error message
    //     await waitFor(() => {
    //         expect(screen.getByText('Please describe what you are looking for.')).toBeInTheDocument();
    //     });
    // });

    // test('Should show loading state', async () => {
    //     // Mock delayed fetch
    //     let resolveFetch;
    //     const fetchPromise = new Promise(resolve => {
    //         resolveFetch = () => resolve({
    //             json: () => Promise.resolve({ recommendations: 'Test' })
    //         });
    //     });
    //     fetch.mockImplementationOnce(() => fetchPromise);

    //     render(<AIModal ai_response={mockAiResponse} ai_shops={mockAiShops} />);

    //     // Open modal and search
    //     fireEvent.click(screen.getByText(/ai search/i));
    //     fireEvent.change(screen.getByPlaceholderText(/example/i), {
    //         target: { value: 'test' }
    //     });
    //     fireEvent.click(screen.getByText(/search with ai/i));

    //     // Verify loading state
    //     await waitFor(() => {
    //         expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    //     });

    //     // Resolve and verify loading ends
    //     resolveFetch();
    //     await waitFor(() => {
    //         expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    //     });
    // });
});