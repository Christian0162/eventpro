import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock the absolute minimum
jest.mock('../firebase/firebase', () => ({}))
jest.mock('../hooks/useSupplier', () => ({
    useFetchSuppliers: jest.fn(() => ({ suppliers: [], isLoading: false })),
    useFetchSupplierServices: jest.fn(() => ({ services: [], isLoading: false })),
    useFetchReviews: jest.fn(() => ({ reviews: [], isLoading: false }))
}))
jest.mock('../hooks/useReviews', () => ({
    useFetchReviews: jest.fn(() => ({ reviews: [], isLoading: false }))
}))

// Mock all components as simple divs
jest.mock('../components/ShopBackgroundModal', () => ({ ShopBackgroundModal: () => <div /> }))
jest.mock('../components/SupplierPanels', () => () => <div />)
jest.mock('../components/PageLoading', () => () => <div data-testid="loading">Loading</div>)
jest.mock('../components/UpdateModal', () => ({ SupplierDetails: () => <div /> }))
jest.mock('../pages/suppliers/SupplierRegistration', () => () => <div data-testid="registration">Registration</div>)
jest.mock('react-head', () => ({ Title: () => null }))
jest.mock('lucide-react', () => ({
    MapPin: () => null, CircleCheckBig: () => null, Star: () => null, Edit3: () => null, X: () => null
}))
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: ({ to }) => <div data-testid="navigate">Going to {to}</div>
}))

// Import after mocks
import SupplierShop from '../pages/suppliers/SupplierShop'

const { useFetchSuppliers, useFetchSupplierServices, useFetchReviews } = require('../hooks/useSupplier')

const mockUserData = {
    id: '123',
    role: 'Supplier',
    verification_status: 'verified'
}

const MockWrapper = ({ userData = mockUserData }) => (
    <BrowserRouter>
        <SupplierShop userData={userData} />
    </BrowserRouter>
)

describe('SupplierShop Component - Basic Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('TC-84: Should render shop page for supplier', async () => {
        useFetchSuppliers.mockReturnValue({
            suppliers: [{ id: '123', supplier_name: 'Test Shop' }],
            isLoading: false
        })
        useFetchSupplierServices.mockReturnValue({
            services: [{ supplier_id: '123' }],
            isLoading: false
        })

        render(<MockWrapper />)

        await waitFor(() => {
            expect(screen.getByText('Your Shop')).toBeInTheDocument()
        })
    })

    test('TC-85: Should redirect non-supplier users', () => {
        const customerUser = { ...mockUserData, role: 'Customer' }

        render(<MockWrapper userData={customerUser} />)

        expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })

    test('TC-86: Should show registration when no shop', async () => {
        useFetchSuppliers.mockReturnValue({
            suppliers: [],
            isLoading: false
        })

        render(<MockWrapper />)

        await waitFor(() => {
            expect(screen.getByTestId('registration')).toBeInTheDocument()
        })
    })

    test('TC-87: Should show loading state', () => {
        useFetchSuppliers.mockReturnValue({ suppliers: [], isLoading: true })
        useFetchSupplierServices.mockReturnValue({ services: [], isLoading: true })

        render(<MockWrapper />)

        expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
})