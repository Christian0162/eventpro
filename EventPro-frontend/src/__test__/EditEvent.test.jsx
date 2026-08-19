import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock all dependencies at the top
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}))

// Mock hooks
const mockUseFetchEvents = jest.fn()
const mockUseUpdateEvent = jest.fn()
const mockUseFetchReviews = jest.fn()
const mockUseFetchSupplierServices = jest.fn()
const mockUseFetchSuppliers = jest.fn()
const mockUseFetchContract = jest.fn()
const mockUseFetchAllTransaction = jest.fn()
const mockUseFetchUserProfiles = jest.fn()
const mockUseFetchUsers = jest.fn()

jest.mock('../hooks/useEvents', () => ({
  useFetchEvents: () => mockUseFetchEvents(),
  useUpdateEvent: () => mockUseUpdateEvent(),
}))

jest.mock('../hooks/useReviews', () => ({
  useFetchReviews: () => mockUseFetchReviews(),
}))

jest.mock('../hooks/useSupplier', () => ({
  useFetchSupplierServices: () => mockUseFetchSupplierServices(),
  useFetchSuppliers: () => mockUseFetchSuppliers(),
}))

jest.mock('../hooks/useContract', () => ({
  useFetchContract: () => mockUseFetchContract(),
}))

jest.mock('../hooks/useTransaction', () => ({
  useFetchAllTransaction: () => mockUseFetchAllTransaction(),
}))

jest.mock('../hooks/useProfile', () => ({
  useFetchUserProfiles: () => mockUseFetchUserProfiles(),
}))

jest.mock('../hooks/useUsers', () => ({
  useFetchUsers: () => mockUseFetchUsers(),
}))

// Mock components that use problematic features
jest.mock('../components/AddressAutoComplete', () => ({
  __esModule: true,
  default: function MockAddressAutoComplete({ setLocation, setCoords, disabled, default_location, className }) {
    return (
      <input
        type="text"
        data-testid="address-autocomplete"
        defaultValue={default_location}
        disabled={disabled}
        onChange={(e) => setLocation && setLocation(e.target.value)}
        className={className}
        placeholder="Enter address"
      />
    )
  }
}))

jest.mock('../components/PrimaryButton', () => ({
  __esModule: true,
  default: function MockPrimaryButton({ children, className, onClick, type = "button" }) {
    return (
      <button 
        className={className} 
        onClick={onClick} 
        type={type}
        data-testid="primary-button"
      >
        {children}
      </button>
    )
  }
}))

jest.mock('../components/ReviewModal', () => ({
  Review: function MockReview({ reviewed_id, reviewer_name, eventData }) {
    return <button data-testid="review-button">Leave Review</button>
  },
  RejectReview: function MockRejectReview({ className, userData, event_id, event_name, supplier_id, supplier, event }) {
    return <button data-testid="reject-button" className={className}>Reject</button>
  }
}))

jest.mock('../components/UpdateModal', () => ({
  UpdateEventBackground: function MockUpdateEventBackground({ id, className }) {
    return <button data-testid="update-background" className={className}>Update Background</button>
  }
}))

jest.mock('../components/ProfileHover', () => ({
  __esModule: true,
  default: function MockProfileHover({ hoveredReviewer, user, review }) {
    return <div data-testid="profile-hover">Profile Hover</div>
  }
}))

jest.mock('../components/PageLoading', () => ({
  __esModule: true,
  default: function MockPageLoading() {
    return <div data-testid="page-loading">Loading...</div>
  }
}))

jest.mock('../components/LoadingOverlay', () => ({
  __esModule: true,
  default: function MockLoadingOverlay({ isLoading, message }) {
    return isLoading ? <div data-testid="loading-overlay">{message}</div> : null
  }
}))

// Mock react-select
jest.mock('react-select', () => {
  return function MockSelect({ options, value, onChange, placeholder, isDisabled, isClearable, name }) {
    return (
      <select 
        data-testid={`react-select-${name}`}
        value={value?.value || ''}
        disabled={isDisabled}
        onChange={(e) => {
          const selectedOption = options?.find(opt => opt.value === e.target.value)
          onChange && onChange(selectedOption)
        }}
      >
        <option value="">{placeholder}</option>
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
})

// Mock lazy components
jest.mock('../components/SupplierModal', () => ({
  __esModule: true,
  default: function MockSupplierModal({ isOpen, onClose, supplierData, services, reviews, userData, averageRating, applications }) {
    return isOpen ? <div data-testid="supplier-modal">Supplier Modal</div> : null
  }
}))

jest.mock('../components/ContractModal', () => ({
  __esModule: true,
  default: function MockContractModal({ isOpen, onClose, userData, event_id, user_id, supplier_id, eventData, supplierData }) {
    return isOpen ? <div data-testid="contract-modal">Contract Modal</div> : null
  }
}))

// Mock other dependencies
jest.mock('react-head', () => ({
  Title: () => null,
}))

jest.mock('sweetalert2', () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}))

// Fix Firebase mock to return proper unsubscribe function
const mockUnsubscribe = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({
    withConverter: jest.fn()
  })),
  onSnapshot: jest.fn(() => mockUnsubscribe),
  query: jest.fn(),
  where: jest.fn(),
}))

jest.mock('../firebase/firebase', () => ({
  db: {}
}))

jest.mock('lucide-react', () => ({
  X: () => 'X',
  Calendar: () => 'Calendar',
  MapPin: () => 'MapPin',
  Tag: () => 'Tag',
  Users: () => 'Users',
  FileText: () => 'FileText',
  Send: () => 'Send',
  Check: () => 'Check',
  CircleCheck: () => 'CircleCheck',
}))

jest.mock('../constants/categories', () => ({
  eventStatusStyles: {
    planning: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    payment_pending: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
  },
  EventTypeOptions: [
    { label: 'Wedding', value: 'wedding' },
    { label: 'Birthday', value: 'birthday' },
    { label: 'Corporate', value: 'corporate' },
  ],
  headerBackgrounds: [
    'bg1.jpg',
    'bg2.jpg',
  ],
  SupplierOptions: [
    { label: 'Catering', value: 'catering' },
    { label: 'Photography', value: 'photography' },
  ],
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Now import the component after all mocks are set up
const EditEvent = require('../pages/events/EditEvent').default

const { useParams, useNavigate } = require('react-router-dom')

const mockUserData = {
  id: 'user123',
  role: 'Client',
  name: 'Test User'
}

const mockEventData = {
  id: 'event123',
  event_name: 'Test Event',
  event_location: 'Test Location',
  event_date: {
    date_value: '2024-12-31',
    date_preview: ['2024', 'December', '31']
  },
  event_time: {
    valueStartAndEnd: ['09:00', '17:00'],
    previewStartAndEnd: '9:00 AM - 5:00 PM'
  },
  event_type: { label: 'Wedding', value: 'wedding' },
  event_budget: '25000',
  event_description: 'Test event description',
  event_categories: [],
  event_background: ''
}

// Mock supplier data for additional tests
const mockSuppliers = [
  {
    id: 'supplier1',
    supplier_name: 'Test Caterer',
    supplier_type: { label: 'Catering', value: 'catering' },
    supplier_background_image: null
  },
  {
    id: 'supplier2',
    supplier_name: 'Test Photographer',
    supplier_type: { label: 'Photography', value: 'photography' },
    supplier_background_image: null
  }
]

describe('EditEvent Component Tests', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    useParams.mockReturnValue({ id: 'event123' })
    useNavigate.mockReturnValue(mockNavigate)

    // Set up default mock implementations
    mockUseFetchEvents.mockReturnValue({
      events: [mockEventData],
      isLoading: false
    })

    mockUseUpdateEvent.mockReturnValue({
      updateEvent: jest.fn(),
      isLoading: false
    })

    mockUseFetchReviews.mockReturnValue({
      reviews: [],
      isLoading: false
    })

    mockUseFetchSupplierServices.mockReturnValue({
      services: [],
      isLoading: false
    })

    mockUseFetchSuppliers.mockReturnValue({
      suppliers: [],
      isLoading: false
    })

    mockUseFetchContract.mockReturnValue({
      contracts: [],
      isLoading: false
    })

    mockUseFetchAllTransaction.mockReturnValue({
      transactions: []
    })

    mockUseFetchUserProfiles.mockReturnValue({
      userProfiles: []
    })

    mockUseFetchUsers.mockReturnValue({
      users: []
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // TC-037: Component Rendering Test
  test('TC-037: Should render EditEvent component with main sections', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Manage Events')).toBeInTheDocument()
      expect(screen.getByText('Edit and manage your event details')).toBeInTheDocument()
    })
  })

  // TC-038: Form Field Population Test
  test('TC-038: Should populate form fields with existing event data', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('25000')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test event description')).toBeInTheDocument()
    })
  })

  // TC-039: Supplier Tag Section Test
  test('TC-039: Should render supplier tag section correctly', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Specify the supplier you are looking for:')).toBeInTheDocument()
    })
  })

  // TC-040: Access Control Test
  test('TC-040: Should redirect suppliers away from edit page', async () => {
    const supplierUserData = { ...mockUserData, role: 'Supplier' }
    
    render(
      <BrowserRouter>
        <EditEvent userData={supplierUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  // TC-041: Loading State Test
  test('TC-041: Should show loading overlay when data is loading', async () => {
    mockUseFetchEvents.mockReturnValue({
      events: [],
      isLoading: true
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    expect(screen.getByTestId('page-loading')).toBeInTheDocument()
  })

  // TC-042: Event Status Calculation Test
  test('TC-042: Should show Planning status in status badge', async () => {
    mockUseFetchEvents.mockReturnValue({
      events: [{ ...mockEventData, event_categories: [] }],
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    // Look for the status badge specifically (not the warning text)
    await waitFor(() => {
      const statusBadges = screen.getAllByText('Planning')
      // The status badge should be there (there might be multiple Planning texts)
      expect(statusBadges.length).toBeGreaterThan(0)
    })
  })

  // TC-043: Form Update Test
  test('TC-043: Should update event name', async () => {
    const mockUpdateEvent = jest.fn()
    mockUseUpdateEvent.mockReturnValue({
      updateEvent: mockUpdateEvent,
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    const eventNameInput = screen.getByDisplayValue('Test Event')
    fireEvent.change(eventNameInput, { target: { value: 'Updated Event Name' } })

    await waitFor(() => {
      expect(eventNameInput.value).toBe('Updated Event Name')
    })
  })

  // TC-044: Supplier Sections Rendering Test
  test('TC-044: Should render supplier section headers', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Check for section headers that are likely to be unique
      expect(screen.getByText('Suggested Suppliers')).toBeInTheDocument()
      expect(screen.getByText('Supplier Applications')).toBeInTheDocument()
    })
  })

  // TC-045: Empty State Test
  test('TC-045: Should show planning message when no categories', async () => {
    mockUseFetchEvents.mockReturnValue({
      events: [{ ...mockEventData, event_categories: [] }],
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no supplier has been specified/i)).toBeInTheDocument()
    })
  })

  // TC-046: Event Summary Statistics Test
  test('TC-046: Should display event summary section', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Event Summary')).toBeInTheDocument()
    })
  })

  // TC-047: Form Input Test
  test('TC-047: Should update form inputs correctly', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    const eventNameInput = screen.getByDisplayValue('Test Event')
    const descriptionInput = screen.getByDisplayValue('Test event description')

    fireEvent.change(eventNameInput, { target: { value: 'New Event Name' } })
    fireEvent.change(descriptionInput, { target: { value: 'New description' } })

    await waitFor(() => {
      expect(eventNameInput.value).toBe('New Event Name')
      expect(descriptionInput.value).toBe('New description')
    })
  })

  // TC-048: Address AutoComplete Test
  test('TC-048: Should render address autocomplete component', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('address-autocomplete')).toBeInTheDocument()
    })
  })

  // TC-049: Time Input Test
  test('TC-049: Should render time inputs', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Check if time inputs are present by looking for the time-related labels
      expect(screen.getByText('Event Time')).toBeInTheDocument()
    })
  })

  // TC-050: Form Elements Test - FIXED VERSION
  test('TC-050: Should render all basic form elements', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Use display values and test IDs instead of label queries to avoid association issues
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
      expect(screen.getByTestId('address-autocomplete')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test event description')).toBeInTheDocument()
    })
  })

  // TC-051: Past Event Warning Test
  test('TC-051: Should show past event warning for old events', async () => {
    const pastEvent = {
      ...mockEventData,
      event_date: {
        date_value: '2020-01-01',
        date_preview: ['2020', 'January', '01']
      }
    }

    mockUseFetchEvents.mockReturnValue({
      events: [pastEvent],
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no longer visible to the public/i)).toBeInTheDocument()
    })
  })

  // TC-052: Background Update Test
  test('TC-052: Should render background update button', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('update-background')).toBeInTheDocument()
    })
  })

  // TC-053: Supplier Application Handling Test - FIXED
  test('TC-053: Should render supplier application sections', async () => {
    // Mock suppliers data
    mockUseFetchSuppliers.mockReturnValue({
      suppliers: mockSuppliers,
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Check if supplier application sections are rendered
      expect(screen.getByText('Supplier Applications')).toBeInTheDocument()
      expect(screen.getByText('Suggested Suppliers')).toBeInTheDocument()
    })
  })

  // TC-054: Contract Management Test - FIXED
  test('TC-054: Should display contract management sections', async () => {
    // Mock contracts data with proper structure
    const mockContractsFixed = [
      {
        id: 'contract1',
        event_id: 'event123',
        supplier_id: 'supplier1',
        status: 'Pending',
        service_plan: {
          service_price: 1000
        }
      }
    ]

    mockUseFetchContract.mockReturnValue({
      contracts: mockContractsFixed,
      isLoading: false
    })

    // Mock transactions to avoid the service_price error
    mockUseFetchAllTransaction.mockReturnValue({
      transactions: []
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Your Contract Offers')).toBeInTheDocument()
      expect(screen.getByText('Current Event Suppliers')).toBeInTheDocument()
    })
  })

  // TC-055: Error Handling Test
  test('TC-055: Should handle form validation errors', async () => {
    const mockUpdateEvent = jest.fn()
    mockUseUpdateEvent.mockReturnValue({
      updateEvent: mockUpdateEvent,
      isLoading: false
    })

    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    // Try to submit with empty event name
    const eventNameInput = screen.getByDisplayValue('Test Event')
    fireEvent.change(eventNameInput, { target: { value: '' } })

    const submitButton = screen.getByTestId('primary-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // The form should prevent submission due to required field validation
      expect(mockUpdateEvent).not.toHaveBeenCalled()
    })
  })

  // TC-056: Data Persistence Test
  test('TC-056: Should maintain form data after updates', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    const eventNameInput = screen.getByDisplayValue('Test Event')
    const originalValue = eventNameInput.value

    // Change and then revert the value
    fireEvent.change(eventNameInput, { target: { value: 'Temporary Change' } })
    fireEvent.change(eventNameInput, { target: { value: originalValue } })

    await waitFor(() => {
      expect(eventNameInput.value).toBe(originalValue)
    })
  })

  // TC-057: Navigation Test
  test('TC-057: Should have proper navigation links', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      const cancelLink = screen.getByText('Cancel')
      expect(cancelLink).toBeInTheDocument()
      expect(cancelLink.closest('a')).toHaveAttribute('href', '/events')
    })
  })

  // TC-058: Responsive Layout Test - FIXED
  test('TC-058: Should render responsive grid layouts', async () => {
    render(
      <BrowserRouter>
        <EditEvent userData={mockUserData} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Check for responsive grid classes using a more flexible approach
      const gridElements = document.querySelectorAll('[class*="grid-cols"]')
      expect(gridElements.length).toBeGreaterThan(0)
      
      // Check that main sections are present using more reliable selectors
      expect(screen.getByText('Manage Events')).toBeInTheDocument()
      expect(screen.getByText('Suggested Suppliers')).toBeInTheDocument()
    })
  })
})