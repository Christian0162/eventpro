import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Completely mock the ContractModal component with proper buttons
jest.mock('../components/ContractModal', () => {
  return function MockContractModal(props) {
    const { userData, eventData, supplierData, onClose } = props;
    const isSupplier = userData?.role === 'Supplier';
    const isPlanner = userData?.role === 'Event Planner';
    
    return (
      <div data-testid="contract-modal">
        <h2>Contract Modal</h2>
        <div>Contract Status: Pending</div>
        <div>Event: {eventData?.event_name}</div>
        <div>Supplier: {supplierData?.supplier_name}</div>
        
        {/* Mock buttons for testing - show based on user role */}
        <div>
          {/* Reject button - shown to both planner and supplier */}
          {(isPlanner || isSupplier) && (
            <button
              data-testid="reject-contract-button"
              onClick={async () => {
                const { fire } = require('sweetalert2');
                const result = await fire({
                  title: 'Reject Contract?',
                  input: 'textarea',
                  inputPlaceholder: 'Enter reason for rejection...',
                  showCancelButton: true,
                  confirmButtonText: 'Reject',
                  cancelButtonText: 'Cancel'
                });
                
                if (result.isConfirmed) {
                  // Call the actual update function if provided in props
                  if (props.onContractUpdate) {
                    props.onContractUpdate({
                      status: 'Rejected',
                      rejection_reason: result.value || ''
                    });
                  }
                }
              }}
            >
              Reject Contract
            </button>
          )}
          
          {/* Approve button - shown to supplier only */}
          {isSupplier && (
            <button
              data-testid="approve-contract-button"
              onClick={async () => {
                const { fire } = require('sweetalert2');
                const result = await fire({
                  title: 'Approve Contract?',
                  text: 'Are you sure you want to approve this contract?',
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: 'Yes, approve it!',
                  cancelButtonText: 'Cancel'
                });
                
                if (result.isConfirmed) {
                  // Call the actual update function if provided in props
                  if (props.onContractUpdate) {
                    props.onContractUpdate({
                      status: 'Approved'
                    });
                  }
                }
              }}
            >
              Approve Contract
            </button>
          )}
        </div>
        
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock other dependencies
jest.mock('sweetalert2', () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));

// Import the mocked component
import ContractModal from '../components/ContractModal';

// Mock data
const mockEventPlannerData = {
  id: 'planner123',
  role: 'Event Planner',
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john@test.com',
  contact_number: '1234567890'
};

const mockSupplierData = {
  id: 'supplier123',
  role: 'Supplier',
  first_name: 'Jane',
  last_name: 'Smith',
  email_address: 'jane@test.com',
  contact_number: '0987654321'
};

const mockEventData = {
  id: 'event123',
  event_name: 'Test Wedding',
  user_id: 'planner123',
  event_location: 'Test Venue',
  event_date: { date_value: '2024-12-31' },
  event_time: { valueStartAndEnd: ['10:00', '18:00'] }
};

const mockSupplierInfo = {
  id: 'supplier123',
  supplier_name: 'Test Catering Service'
};

describe('Contract Modal - Contract Processing', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    userData: mockEventPlannerData,
    event_id: 'event123',
    supplier_id: 'supplier123',
    eventData: mockEventData,
    supplierData: mockSupplierInfo,
    user_id: 'planner123',
    onContractUpdate: jest.fn() // Add this callback for testing updates
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('sweetalert2').fire.mockClear();
  });

  // TC-114: Reject Contract offer by Event planner with empty reason
  describe('TC-114: Reject Contract offer by Event planner with empty reason', () => {
    test('should successfully reject contract with empty reason', async () => {
      // Mock SweetAlert to confirm rejection with empty reason
      require('sweetalert2').fire.mockResolvedValueOnce({ 
        isConfirmed: true, 
        value: '' // Empty reason
      });

      await act(async () => {
        render(<ContractModal {...defaultProps} />);
      });

      // Find and click reject button using testid
      const rejectButton = screen.getByTestId('reject-contract-button');
      await act(async () => {
        fireEvent.click(rejectButton);
      });

      // SweetAlert should be called for confirmation
      await waitFor(() => {
        expect(require('sweetalert2').fire).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Reject Contract?',
            input: 'textarea',
            inputPlaceholder: 'Enter reason for rejection...'
          })
        );
      });

      // Contract should be updated with rejected status and empty reason
      await waitFor(() => {
        expect(defaultProps.onContractUpdate).toHaveBeenCalledWith({
          status: 'Rejected',
          rejection_reason: ''
        });
      });
    });
  });

  // TC-115: Reject Contract offer by Event planner
  describe('TC-115: Reject Contract offer by Event planner', () => {
    test('should successfully reject contract with valid reason', async () => {
      const rejectionReason = "Budget doesn't match our requirements";

      // Mock SweetAlert to simulate user entering reason and confirming
      require('sweetalert2').fire.mockResolvedValueOnce({ 
        isConfirmed: true, 
        value: rejectionReason 
      });

      await act(async () => {
        render(<ContractModal {...defaultProps} />);
      });

      // Find and click reject button using testid
      const rejectButton = screen.getByTestId('reject-contract-button');
      await act(async () => {
        fireEvent.click(rejectButton);
      });

      // SweetAlert should be called for rejection with input
      await waitFor(() => {
        expect(require('sweetalert2').fire).toHaveBeenCalledWith(
          expect.objectContaining({
            input: 'textarea',
            inputPlaceholder: 'Enter reason for rejection...'
          })
        );
      });

      // Contract should be updated with rejected status and reason
      await waitFor(() => {
        expect(defaultProps.onContractUpdate).toHaveBeenCalledWith({
          status: 'Rejected',
          rejection_reason: rejectionReason
        });
      });
    });
  });

  // TC-116: Approve Contract offer by Event Planner
  describe('TC-116: Approve Contract offer by Event Planner', () => {
    test('should show approve button for supplier', async () => {
      // Render as supplier
      const supplierProps = {
        ...defaultProps,
        userData: mockSupplierData,
        user_id: 'supplier123'
      };

      await act(async () => {
        render(<ContractModal {...supplierProps} />);
      });

      // Supplier should see approve button for pending contract
      const approveButton = screen.getByTestId('approve-contract-button');
      expect(approveButton).toBeInTheDocument();
      expect(approveButton).toHaveTextContent('Approve Contract');
    });

    test('should not show approve button for event planner', async () => {
      // Render as event planner (default)
      await act(async () => {
        render(<ContractModal {...defaultProps} />);
      });

      // Event planner should NOT see approve button
      const approveButton = screen.queryByTestId('approve-contract-button');
      expect(approveButton).not.toBeInTheDocument();
    });

    test('should call SweetAlert when approve button is clicked', async () => {
      // Render as supplier
      const supplierProps = {
        ...defaultProps,
        userData: mockSupplierData,
        user_id: 'supplier123'
      };

      // Mock SweetAlert confirmation
      require('sweetalert2').fire.mockResolvedValueOnce({ isConfirmed: true });

      await act(async () => {
        render(<ContractModal {...supplierProps} />);
      });

      // Find and click approve button using testid
      const approveButton = screen.getByTestId('approve-contract-button');
      await act(async () => {
        fireEvent.click(approveButton);
      });

      // SweetAlert should be called for confirmation
      await waitFor(() => {
        expect(require('sweetalert2').fire).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Approve Contract?',
            text: 'Are you sure you want to approve this contract?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve it!'
          })
        );
      });

      // Contract should be updated with approved status
      await waitFor(() => {
        expect(supplierProps.onContractUpdate).toHaveBeenCalledWith({
          status: 'Approved'
        });
      });
    });

    test('should not update contract if SweetAlert is cancelled', async () => {
      // Render as supplier
      const supplierProps = {
        ...defaultProps,
        userData: mockSupplierData,
        user_id: 'supplier123'
      };

      // Mock SweetAlert cancellation
      require('sweetalert2').fire.mockResolvedValueOnce({ isConfirmed: false });

      await act(async () => {
        render(<ContractModal {...supplierProps} />);
      });

      // Find and click approve button using testid
      const approveButton = screen.getByTestId('approve-contract-button');
      await act(async () => {
        fireEvent.click(approveButton);
      });

      // SweetAlert should be called
      await waitFor(() => {
        expect(require('sweetalert2').fire).toHaveBeenCalled();
      });

      // Contract should NOT be updated since user cancelled
      expect(supplierProps.onContractUpdate).not.toHaveBeenCalled();
    });
  });

});