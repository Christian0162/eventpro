import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ServiceModal from '../components/ServiceModal'

// Mock dependencies
jest.mock('sweetalert2', () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true }))
}))

// Create a mock that can be reset for each test
const mockUseFetchSupplierServices = jest.fn()
jest.mock('../hooks/useSupplier', () => ({
  useFetchSupplierServices: () => mockUseFetchSupplierServices()
}))

// Simple Firebase mock
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn()
}))

jest.mock('../firebase/firebase', () => ({
  db: {}
}))

const mockUserData = { id: 'user123' }
const mockSupplierData = { id: 'user123' }

describe('ServiceModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default state (no services) before each test
    mockUseFetchSupplierServices.mockReturnValue({
      services: []
    })
  })

  // TC-95: Service Modal Button Rendering
  test('TC-95: Should render service button when user is supplier', () => {
    render(<ServiceModal userData={mockUserData} supplierData={mockSupplierData} />)
    expect(screen.getByRole('button', { name: /make a service/i })).toBeInTheDocument()
  })

  // TC-96: Service Limit Validation
  test('TC-96: Should disable button when service limit reached', () => {
    // Set up the limit scenario for this specific test
    mockUseFetchSupplierServices.mockReturnValue({
      services: [
        { supplier_id: 'user123', service_plan: { value: 'basic' } },
        { supplier_id: 'user123', service_plan: { value: 'premium' } }
      ]
    })

    render(<ServiceModal userData={mockUserData} supplierData={mockSupplierData} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Service Limit Reached')
  })

  // TC-97: Test modal opens
  test('TC-97: Should open modal when button is clicked', async () => {
    render(<ServiceModal userData={mockUserData} supplierData={mockSupplierData} />)

    // Open modal - the button should be enabled and say "Make a Service"
    const button = screen.getByRole('button', { name: /make a service/i })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)

    // Check if modal content appears using a more specific selector
    await waitFor(() => {
      // Use the unique description text instead of the duplicate heading/label
      expect(screen.getByText(/designed to make things easier/i)).toBeInTheDocument()
    })
  })

  // TC-98: Test inclusion adding
  test('TC-98: Should add and display inclusions', async () => {
    render(<ServiceModal userData={mockUserData} supplierData={mockSupplierData} />)

    // Open modal - the button should be enabled
    const openButton = screen.getByRole('button', { name: /make a service/i })
    expect(openButton).not.toBeDisabled()
    fireEvent.click(openButton)

    // Wait for modal using a unique element
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter inclusion/i)).toBeInTheDocument()
    })

    // Add inclusion
    const inclusionInput = screen.getByPlaceholderText(/enter inclusion/i)
    fireEvent.change(inclusionInput, { target: { value: 'Test Service' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    // Check inclusion was added
    await waitFor(() => {
      expect(screen.getByText(/Test Service/)).toBeInTheDocument()
    })
  })
})