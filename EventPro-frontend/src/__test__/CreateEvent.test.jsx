// src/__test__/CreateEvent.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvent from '../pages/events/CreateEvent';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('../firebase/firebase', () => ({
    db: {}
}));

// Mock the useEvents hook with a variable we can control
let mockAddEvent = jest.fn();
let mockIsLoading = false;

jest.mock('../hooks/useEvents', () => ({
    useAddEvent: () => ({
        addEvent: mockAddEvent,
        isLoading: mockIsLoading
    })
}));

// Mock other dependencies
jest.mock('sweetalert2');

jest.mock('../components/LoadingOverlay', () => ({ isLoading, message }) =>
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null
);

jest.mock('../components/AddressAutoComplete', () => ({
    setLocation,
    setCoords,
    default_location,
    id,
    name,
    className
}) => (
    <input
        id={id}
        name={name}
        placeholder="Location"
        onChange={(e) => setLocation && setLocation(e.target.value)}
        data-testid="location-input"
        defaultValue={default_location}
    />
));

// Mock react-select with the ACTUAL test IDs from the rendered output
jest.mock('react-select', () => ({
    options = [],
    value,
    onChange,
    placeholder,
    id,
    name
}) => {
    // Use the actual test IDs that appear in the rendered HTML
    const testId = id || (name === 'event_type' ? 'event_type' : 'supplier_select');

    return (
        <select
            data-testid={testId}
            value={value?.value || ''}
            onChange={(e) => {
                const selectedOption = options.find(opt => opt.value === e.target.value);
                onChange && onChange(selectedOption);
            }}
        >
            <option value="">{placeholder || "Select..."}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
});

// Mock constants to provide actual options
jest.mock('../constants/categories', () => ({
    EventTypeOptions: [
        { value: 'wedding', label: 'Wedding Ceremony' },
        { value: 'birthday', label: 'Birthday Celebration' },
        { value: 'corporate', label: 'Corporate Event' }
    ],
    SupplierOptions: [
        { value: 'catering', label: 'Catering' },
        { value: 'photography', label: 'Photography' },
        { value: 'venue', label: 'Venue' }
    ]
}));

// Mock Lucide React icons - return actual button elements for the X icon
jest.mock('lucide-react', () => ({
    X: (props) => <button {...props} data-testid="x-icon">X</button>,
    Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
    Tag: () => <span data-testid="tag-icon">Tag</span>,
    Send: () => <span data-testid="send-icon">Send</span>,
}));

// Mock react-head
jest.mock('react-head', () => ({
    Title: () => <title>Create Event</title>
}));

// Mock react-router-dom Navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: ({ to, replace }) => {
        mockNavigate(to, { replace });
        return <div data-testid="navigate-component">Redirecting to {to}</div>;
    },
    Link: ({ to, children, ...props }) => (
        <a href={to} {...props}>{children}</a>
    )
}));

const mockUserData = {
    id: 'user123',
    verification_status: 'verified'
};

const mockUnverifiedUser = {
    id: 'user123',
    verification_status: 'pending'
};

const renderWithRouter = (userData = mockUserData) => {
    return render(
        <BrowserRouter>
            <CreateEvent userData={userData} />
        </BrowserRouter>
    );
};

// Helper function to find supplier tags (not including select options)
const findSupplierTags = () => {
    const allCateringElements = screen.queryAllByText('Catering');
    return allCateringElements.filter(element => {
        // Filter out elements that are inside select dropdowns (options)
        return !element.closest('select');
    });
};

describe('CreateEvent Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mock values before each test
        mockAddEvent = jest.fn();
        mockIsLoading = false;

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('TC-026: Render CreateEvent form', () => {
        it('should render all input fields correctly', () => {
            renderWithRouter();

            expect(screen.getByText('Create Events')).toBeInTheDocument();
            expect(screen.getByText('Add the details for your new event')).toBeInTheDocument();

            expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
            expect(screen.getByTestId('location-input')).toBeInTheDocument();
            expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
            expect(screen.getByTestId('start_time')).toBeInTheDocument();
            expect(screen.getByTestId('end_time')).toBeInTheDocument();
            expect(screen.getByText('Event Type', { selector: 'label' })).toBeInTheDocument();
            expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
            expect(screen.getByText(/specify the supplier you are looking for/i)).toBeInTheDocument();
            expect(screen.getByText('Add Category')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Create Event')).toBeInTheDocument();
        });
    });

    describe('TC-027: Add valid supplier tag', () => {
        it('should add valid supplier tag when clicking "Add Category"', async () => {
            renderWithRouter();

            // Find the supplier select by its CORRECT test ID
            const supplierSelect = screen.getByTestId('supplier_select');
            fireEvent.change(supplierSelect, { target: { value: 'catering' } });

            // The button should now be enabled
            const addButton = screen.getByText('Add Category');
            expect(addButton).not.toBeDisabled();

            fireEvent.click(addButton);

            // Look for the tag using our helper function
            await waitFor(() => {
                const tags = findSupplierTags();
                expect(tags).toHaveLength(1);
                expect(tags[0]).toBeInTheDocument();
            });
        });
    });

    describe('TC-028: Prevent duplicate supplier tags', () => {
        it('should prevent duplicate supplier tags', async () => {
            renderWithRouter();

            const supplierSelect = screen.getByTestId('supplier_select');

            // Add first tag
            fireEvent.change(supplierSelect, { target: { value: 'catering' } });
            fireEvent.click(screen.getByText('Add Category'));

            // Wait for first tag to appear
            await waitFor(() => {
                const tags = findSupplierTags();
                expect(tags).toHaveLength(1);
            });

            // Try to add same tag again
            fireEvent.change(supplierSelect, { target: { value: 'catering' } });
            fireEvent.click(screen.getByText('Add Category'));

            // Should only have one instance of the tag (not the select option)
            await waitFor(() => {
                const tags = findSupplierTags();
                expect(tags).toHaveLength(1);
            });
        });
    });

    describe('TC-029: Remove a supplier tag', () => {
        it('should remove a supplier tag when clicking the remove button', async () => {
            renderWithRouter();

            const supplierSelect = screen.getByTestId('supplier_select');

            // Add a tag first
            fireEvent.change(supplierSelect, { target: { value: 'catering' } });
            fireEvent.click(screen.getByText('Add Category'));

            // Wait for tag to appear
            await waitFor(() => {
                const tags = findSupplierTags();
                expect(tags).toHaveLength(1);
            });

            // Find the tag element that contains "Catering" text
            const tagElement = findSupplierTags()[0];

            // Find the closest parent that contains both the text and the remove button
            // This should be the tag container that has the button as a child
            const tagContainer = tagElement.closest('span');
            expect(tagContainer).toBeInTheDocument();

            // Find the remove button within the tag container
            const removeButton = tagContainer.querySelector('button');
            expect(removeButton).toBeInTheDocument();

            fireEvent.click(removeButton);

            // Verify tag was removed
            await waitFor(() => {
                const tags = findSupplierTags();
                expect(tags).toHaveLength(0);
            });
        });
    });

    describe('TC-030: Prevent submit if date is in the past', () => {
        it('should prevent submit if date is in the past', async () => {
            renderWithRouter();

            // Fill required fields
            fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: 'Test Event' } });
            fireEvent.change(screen.getByTestId('location-input'), { target: { value: 'Test Location' } });

            // Set past date
            const dateInput = screen.getByLabelText(/date/i);
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const pastDateString = pastDate.toISOString().split('T')[0];
            fireEvent.change(dateInput, { target: { value: pastDateString } });

            // Set valid times
            fireEvent.change(screen.getByTestId('start_time'), { target: { value: '10:00' } });
            fireEvent.change(screen.getByTestId('end_time'), { target: { value: '11:00' } });

            // Set other required fields using CORRECT test ID
            const eventTypeSelect = screen.getByTestId('event_type');
            fireEvent.change(eventTypeSelect, { target: { value: 'wedding' } });
            fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: '50000' } });
            fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test description' } });

            // Submit form
            const submitButton = screen.getByText('Create Event');
            fireEvent.click(submitButton);

            // Check if SweetAlert was called with warning
            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith({
                    icon: "warning",
                    title: "Invalid Event Date",
                    text: "The event date and time have already passed. Please select a future date and time.",
                    confirmButtonColor: "#3085d6",
                });
            });

            expect(mockAddEvent).not.toHaveBeenCalled();
        });
    });

    describe('TC-031: Prevent submit if end time <= start time', () => {
        it('should prevent submit if end time <= start time', async () => {
            renderWithRouter();

            // Fill all required fields
            fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: 'Test Event' } });
            fireEvent.change(screen.getByTestId('location-input'), { target: { value: 'Test Location' } });

            // Set future date
            const dateInput = screen.getByLabelText(/date/i);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const futureDateString = futureDate.toISOString().split('T')[0];
            fireEvent.change(dateInput, { target: { value: futureDateString } });

            // Set event type using CORRECT test ID
            const eventTypeSelect = screen.getByTestId('event_type');
            fireEvent.change(eventTypeSelect, { target: { value: 'wedding' } });

            // Set budget
            fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: '50000' } });

            // Set description
            fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test description' } });

            // Set invalid times (end before start)
            fireEvent.change(screen.getByTestId('start_time'), { target: { value: '11:00' } });
            fireEvent.change(screen.getByTestId('end_time'), { target: { value: '10:00' } });

            // Submit form
            const submitButton = screen.getByText('Create Event');
            fireEvent.click(submitButton);

            // Wait for and check if SweetAlert was called with error
            await waitFor(() => {
                expect(Swal.fire).toHaveBeenCalledWith({
                    icon: "error",
                    title: "Invalid Event Time",
                    text: "The end time must be after the start time.",
                    confirmButtonColor: "#d33",
                });
            });

            // Ensure addEvent was NOT called due to validation
            expect(mockAddEvent).not.toHaveBeenCalled();
        });
    });

    describe('TC-032: Submit valid event', () => {
        it('should submit valid event with all required fields', async () => {
            renderWithRouter();

            // Fill all required fields correctly
            fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: 'Wedding Celebration' } });
            fireEvent.change(screen.getByTestId('location-input'), { target: { value: 'Test Venue' } });

            // Set future date
            const dateInput = screen.getByLabelText(/date/i);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const futureDateString = futureDate.toISOString().split('T')[0];
            fireEvent.change(dateInput, { target: { value: futureDateString } });

            // Set valid times
            fireEvent.change(screen.getByTestId('start_time'), { target: { value: '14:00' } });
            fireEvent.change(screen.getByTestId('end_time'), { target: { value: '22:00' } });

            // Set event type using CORRECT test ID
            const eventTypeSelect = screen.getByTestId('event_type');
            fireEvent.change(eventTypeSelect, { target: { value: 'wedding' } });

            // Set budget
            fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: '50000' } });

            // Set description
            fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A beautiful wedding celebration' } });

            // Submit form
            const submitButton = screen.getByText('Create Event');
            fireEvent.click(submitButton);

            // Verify addEvent was called with correct data
            await waitFor(() => {
                expect(mockAddEvent).toHaveBeenCalledWith('user123', expect.objectContaining({
                    event_name: 'Wedding Celebration',
                    event_location: 'Test Venue',
                    event_budget: '50000',
                    event_description: 'A beautiful wedding celebration'
                }));
            });
        });
    });

    describe('TC-033: Redirect unverified user', () => {
        it('should redirect unverified user', () => {
            renderWithRouter(mockUnverifiedUser);
            expect(screen.getByTestId('navigate-component')).toBeInTheDocument();
        });

        it('should render form for verified user', () => {
            renderWithRouter(mockUserData);
            expect(screen.getByText('Create Events')).toBeInTheDocument();
        });
    });

    describe('TC-034: Loading overlay', () => {
        it('should show LoadingOverlay when isLoading is true', () => {
            mockIsLoading = true;
            renderWithRouter();

            expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
        });

        it('should not show LoadingOverlay when isLoading is false', () => {
            mockIsLoading = false;
            renderWithRouter();

            expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
        });
    });

    describe('TC-035: Form input updates state', () => {
        it('should update React state when typing in inputs', () => {
            renderWithRouter();

            const eventNameInput = screen.getByLabelText(/event name/i);
            fireEvent.change(eventNameInput, { target: { value: 'Test Event' } });
            expect(eventNameInput).toHaveValue('Test Event');

            const descriptionInput = screen.getByLabelText(/description/i);
            fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
            expect(descriptionInput).toHaveValue('Test description');

            const budgetInput = screen.getByLabelText(/budget/i);
            fireEvent.change(budgetInput, { target: { value: '25500' } });
            expect(budgetInput).toHaveValue(25500);
        });
    });

    describe('TC-036: Event time preview', () => {
        it('should handle time input changes correctly', () => {
            renderWithRouter();

            // Set start and end times
            fireEvent.change(screen.getByTestId('start_time'), { target: { value: '14:00' } });
            fireEvent.change(screen.getByTestId('end_time'), { target: { value: '18:00' } });

            // Verify the time inputs reflect the changes
            expect(screen.getByTestId('start_time')).toHaveValue('14:00');
            expect(screen.getByTestId('end_time')).toHaveValue('18:00');

            // Check if there's any time-related display in the form
            // This could be a label, placeholder, or any element that shows time
            const timeLabel = screen.getByText(/event time/i);
            expect(timeLabel).toBeInTheDocument();
        });

        it('should maintain time state across form interactions', () => {
            renderWithRouter();

            // Set times
            fireEvent.change(screen.getByTestId('start_time'), { target: { value: '14:00' } });
            fireEvent.change(screen.getByTestId('end_time'), { target: { value: '18:00' } });

            // Interact with other form elements
            fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: 'Test Event' } });

            // Times should persist
            expect(screen.getByTestId('start_time')).toHaveValue('14:00');
            expect(screen.getByTestId('end_time')).toHaveValue('18:00');
        });
    });
});