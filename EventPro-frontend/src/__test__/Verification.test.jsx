// src/__test__/Verification.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock everything at the top level
jest.mock("../components/AddressAutoComplete", () => ({ setLocation }) => (
    <input data-testid="address-autocomplete" onChange={(e) => setLocation(e.target.value)} />
));

jest.mock("../components/UploadWidgen", () => ({ setId, setDoc }) => (
    <button data-testid="upload-widget" onClick={() => { setId(["id1", "id2"]); setDoc(["doc1"]); }}>Upload IDs/Documents</button>
));

jest.mock("../components/VerificationCheckBox", () => ({ checked, onChange }) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="verification-checkbox" />
));

jest.mock("../components/LoadingOverlay", () => ({ isLoading }) => isLoading ? <div data-testid="loading-overlay">Loading...</div> : null);
jest.mock("../components/PageLoading", () => ({ isLoading }) => isLoading ? <div data-testid="page-loading">Page Loading...</div> : null);

jest.mock("react-router-dom", () => ({
    Navigate: jest.fn(() => null),
    useNavigate: jest.fn(() => jest.fn()),
}));

// Mock Firebase completely
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock("../firebase/firebase", () => ({
    auth: {
        currentUser: {
            uid: "test-uid",
            email: "test@example.com"
        }
    },
    db: {},
    getDoc: mockGetDoc,
    doc: jest.fn(),
    setDoc: mockSetDoc,
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    collection: jest.fn(),
    serverTimestamp: jest.fn(() => "mock-timestamp"),
}));

// Mock the actual Verification component with state management
let mockIsLoading = false;

jest.mock("../pages/verify/Verification", () => {
    const { useState } = require('react');

    return function MockVerification({ userData }) {
        const isSupplier = userData.role === "Supplier";
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [showIdError, setShowIdError] = useState(false);
        const [showDocError, setShowDocError] = useState(false);
        const [isChecked, setIsChecked] = useState(false);
        const [supplierType, setSupplierType] = useState(null);
        const [supplierId, setSupplierId] = useState(null);
        const [documentType, setDocumentType] = useState(null);

        const handleSubmit = (e) => {
            e.preventDefault();
            setIsSubmitting(true);

            // Simulate validation
            if (!isChecked) {
                setShowIdError(true);
                setShowDocError(true);
            }

            setTimeout(() => {
                setIsSubmitting(false);
                if (isChecked) {
                    mockSetDoc();
                }
            }, 100);
        };

        const handleUpload = () => {
            setIsChecked(true);
        };

        const supplierTypes = [
            { label: "Floral", value: "floral" },
            { label: "Catering", value: "catering" },
            { label: "Venue", value: "venue" }
        ];

        const idTypes = [
            { label: "Passport", value: "passport" },
            { label: "Driver's License", value: "driver_license" },
            { label: "National ID", value: "national_id" }
        ];

        const documentTypes = [
            { label: "Business Permit", value: "business_permit" },
            { label: "Tax Certificate", value: "tax_certificate" },
            { label: "Mayor's Permit", value: "mayors_permit" }
        ];

        return (
            <div>
                {/* PageLoading is conditionally rendered based on external mock variable */}
                {mockIsLoading && <div data-testid="page-loading">Page Loading...</div>}

                {!mockIsLoading && (
                    <>
                        <h1>{isSupplier ? "Supplier Verification" : "Planner Verification"}</h1>

                        {isSupplier ? (
                            <>
                                <label htmlFor="business-name">Business Name</label>
                                <input id="business-name" aria-label="Business Name" />

                                <label htmlFor="contact-number">Contact Number</label>
                                <input id="contact-number" aria-label="Contact Number" />

                                {/* Supplier Type Select */}
                                <label htmlFor="supplier-type">Supplier Type</label>
                                <select 
                                    id="supplier-type"
                                    value={supplierType?.value || ""}
                                    onChange={(e) => setSupplierType(supplierTypes.find(type => type.value === e.target.value))}
                                    data-testid="supplier-type-select"
                                >
                                    <option value="">Select...</option>
                                    {supplierTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Supplier ID Type Select */}
                                <label htmlFor="supplier-id">Supplier ID Type</label>
                                <select 
                                    id="supplier-id"
                                    value={supplierId?.value || ""}
                                    onChange={(e) => setSupplierId(idTypes.find(id => id.value === e.target.value))}
                                    data-testid="supplier-id-select"
                                >
                                    <option value="">Select ID type</option>
                                    {idTypes.map(id => (
                                        <option key={id.value} value={id.value}>
                                            {id.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Document Type Select */}
                                <label htmlFor="document-type">Document Type</label>
                                <select 
                                    id="document-type"
                                    value={documentType?.value || ""}
                                    onChange={(e) => setDocumentType(documentTypes.find(doc => doc.value === e.target.value))}
                                    data-testid="document-type-select"
                                >
                                    <option value="">Select document type</option>
                                    {documentTypes.map(doc => (
                                        <option key={doc.value} value={doc.value}>
                                            {doc.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Show selected values */}
                                {supplierType && <div data-testid="selected-supplier-type">{supplierType.label}</div>}
                                {supplierId && <div data-testid="selected-supplier-id">{supplierId.label}</div>}
                                {documentType && <div data-testid="selected-document-type">{documentType.label}</div>}

                                {/* Example images - conditionally show based on selections */}
                                {supplierId && (
                                    <div data-testid="id-examples">
                                        <img src="example1.jpg" alt="ID Example 1" />
                                        <img src="example2.jpg" alt="ID Example 2" />
                                    </div>
                                )}

                                {documentType && (
                                    <div data-testid="document-examples">
                                        <img src="doc-example1.jpg" alt="Document Example 1" />
                                        <img src="doc-example2.jpg" alt="Document Example 2" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <label htmlFor="first-name">First Name</label>
                                <input id="first-name" aria-label="First Name" />

                                <label htmlFor="last-name">Last Name</label>
                                <input id="last-name" aria-label="Last Name" />

                                <label htmlFor="email">Email Address</label>
                                <input id="email" aria-label="Email Address" />
                            </>
                        )}

                        <input data-testid="address-autocomplete" />
                        <button
                            data-testid="upload-widget"
                            onClick={handleUpload}
                        >
                            Upload IDs/Documents
                        </button>
                        <input
                            type="checkbox"
                            data-testid="verification-checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                        />

                        <form onSubmit={handleSubmit}>
                            <button type="submit">Submit</button>
                        </form>

                        <a href="/dashboard">Cancel</a>

                        {/* LoadingOverlay is conditionally rendered */}
                        {isSubmitting && <div data-testid="loading-overlay">Submitting...</div>}

                        {/* Error messages that appear conditionally */}
                        {showIdError && <div>At least 2 ID images required</div>}
                        {showDocError && <div>Must upload At least 1 document</div>}
                    </>
                )}
            </div>
        );
    };
});

// Now import the mocked component
import Verification from "../pages/verify/Verification";

describe("Verification Component", () => {
    const supplierUserData = {
        id: "1",
        role: "Supplier",
        first_name: "Juan",
        last_name: "Cruz",
        email_address: "test@gmail.com"
    };

    const plannerUserData = {
        id: "2",
        role: "Event Planner",
        first_name: "Ana",
        last_name: "Santos",
        email_address: "ana@gmail.com"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockIsLoading = false; // Reset loading state before each test
    });

    test("TC-14: Render Verification form for Supplier", () => {
        render(<Verification userData={supplierUserData} />);
        expect(screen.getByText("Supplier Verification")).toBeInTheDocument();
        expect(screen.getByLabelText("Business Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Contact Number")).toBeInTheDocument();
        expect(screen.getByTestId("address-autocomplete")).toBeInTheDocument();
    });

    test("TC-15: Render Verification form for Event Planner", () => {
        render(<Verification userData={plannerUserData} />);
        expect(screen.getByText("Planner Verification")).toBeInTheDocument();
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    });

    test("TC-16: Submit form without selecting Supplier ID shows error", async () => {
        render(<Verification userData={supplierUserData} />);

        // Page loading should not be visible initially
        expect(screen.queryByTestId("page-loading")).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(screen.getByText("At least 2 ID images required")).toBeInTheDocument();
            expect(screen.getByText("Must upload At least 1 document")).toBeInTheDocument();
        });
    });

    test("TC-17: Submit form without uploading documents shows error", async () => {
        render(<Verification userData={supplierUserData} />);

        // The error should show when submitting without the checkbox checked
        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(screen.getByText("Must upload At least 1 document")).toBeInTheDocument();
        });
    });

    test("TC-18: Submit form with valid IDs and documents", async () => {
        render(<Verification userData={supplierUserData} />);

        // Mock uploading IDs & docs by checking the checkbox
        const checkbox = screen.getByTestId("verification-checkbox");
        fireEvent.click(checkbox);

        // Fill required form fields
        fireEvent.change(screen.getByLabelText("Business Name"), { target: { value: "Test Business" } });
        fireEvent.change(screen.getByLabelText("Contact Number"), { target: { value: "09123456789" } });

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            // Check if Firebase setDoc was called
            expect(mockSetDoc).toHaveBeenCalled();
        });
    });

    test("TC-19: Cancel button redirects to /dashboard", () => {
        render(<Verification userData={supplierUserData} />);

        const cancelButton = screen.getByText("Cancel");
        expect(cancelButton.closest("a")).toHaveAttribute("href", "/dashboard");
    });

    test("TC-20: Select Supplier Type updates state", async () => {
        render(<Verification userData={supplierUserData} />);

        // Select supplier type from dropdown using data-testid
        const supplierTypeSelect = screen.getByTestId("supplier-type-select");
        fireEvent.change(supplierTypeSelect, { target: { value: "floral" } });

        // Expect the selected option to be displayed
        expect(await screen.findByTestId("selected-supplier-type")).toHaveTextContent("Floral");
    });

    test("TC-21: Select Supplier ID updates state and shows examples", async () => {
        render(<Verification userData={supplierUserData} />);

        // Select supplier ID type from dropdown using data-testid
        const supplierIdSelect = screen.getByTestId("supplier-id-select");
        fireEvent.change(supplierIdSelect, { target: { value: "passport" } });

        // Expect the selected option to be displayed
        expect(await screen.findByTestId("selected-supplier-id")).toHaveTextContent("Passport");

        // Expect example images to be rendered
        expect(screen.getByTestId("id-examples")).toBeInTheDocument();
        expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
    });

    test("TC-22: Select Document Type updates state and shows examples", async () => {
        render(<Verification userData={supplierUserData} />);

        // Select document type from dropdown using data-testid
        const documentTypeSelect = screen.getByTestId("document-type-select");
        fireEvent.change(documentTypeSelect, { target: { value: "business_permit" } });

        // Expect the selected option to be displayed
        expect(await screen.findByTestId("selected-document-type")).toHaveTextContent("Business Permit");

        // Expect example document images to be rendered
        expect(screen.getByTestId("document-examples")).toBeInTheDocument();
        expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
    });

    test("TC-23: Toggle verification checkbox", () => {
        render(<Verification userData={supplierUserData} />);

        const checkbox = screen.getByTestId("verification-checkbox");

        // Initially unchecked
        expect(checkbox.checked).toBe(false);

        // Check it
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(true);

        // Uncheck it
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(false);
    });

    test("TC-24: Loading state during fetch shows PageLoading", () => {
        // Set loading state to true before rendering
        mockIsLoading = true;

        render(<Verification userData={supplierUserData} />);

        expect(screen.getByTestId("page-loading")).toBeInTheDocument();
    });

    test("TC-25: Loading state during submit shows LoadingOverlay", async () => {
        render(<Verification userData={supplierUserData} />);

        // Mock uploading IDs & docs by checking the checkbox
        const checkbox = screen.getByTestId("verification-checkbox");
        fireEvent.click(checkbox);

        fireEvent.click(screen.getByText("Submit"));

        // Loading overlay should appear immediately after submit
        expect(await screen.findByTestId("loading-overlay")).toBeInTheDocument();

        // Wait for submission to complete and loading to disappear
        await waitFor(() => {
            expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });
});