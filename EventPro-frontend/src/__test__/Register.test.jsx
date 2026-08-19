import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HeadProvider } from "react-head";
import Register from "../pages/auth/Register";

// Mock firebase
jest.mock('../firebase/firebase', () => ({
    auth: {},
}));

// Mock the useAuthRegister hook
const mockRegister = jest.fn();
jest.mock("../hooks/useAuth", () => ({
    useAuthRegister: jest.fn(() => ({
        register: mockRegister,
        error: null,
        isLoading: false,
    })),
}));

// Mock Navigate
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
}));

describe("Register Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // describe("TC-006: should fail if account type is unselected", () => {
    //     test("displays error when no role is selected", () => {
    //         render(
    //             <MemoryRouter>
    //                 <HeadProvider>
    //                     <Register user={null} />
    //                 </HeadProvider>
    //             </MemoryRouter>
    //         );

    //         const continueButton = screen.getByRole("button", { name: /continue/i });
    //         fireEvent.click(continueButton);

    //         expect(screen.getByText(/you must choose a role to proceed/i)).toBeInTheDocument();
    //     });
    // });

    // describe("TC-007: should proceed to Create Account when role is selected", () => {
    //     test("navigates to step 2 when role is selected", () => {
    //         render(
    //             <MemoryRouter>
    //                 <HeadProvider>
    //                     <Register user={null} />
    //                 </HeadProvider>
    //             </MemoryRouter>
    //         );

    //         fireEvent.click(screen.getByText(/event planner/i).closest("button"));
    //         fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    //         expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    //         expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    //         expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    //         expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    //     });
    // });

    // describe("TC-008: should not register with invalid email format", () => {
    //     test("shows email format error", () => {
    //         render(
    //             <MemoryRouter>
    //                 <HeadProvider>
    //                     <Register user={null} />
    //                 </HeadProvider>
    //             </MemoryRouter>
    //         );

    //         // Move to step 2
    //         fireEvent.click(screen.getByText(/event planner/i).closest("button"));
    //         fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    //         fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    //         fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form"));

    //         expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    //     });
    // });

    // describe("TC-009: should not register if password field is empty", () => {
    //     test("shows password error if empty", () => {
    //         render(
    //             <MemoryRouter>
    //                 <HeadProvider>
    //                     <Register user={null} />
    //                 </HeadProvider>
    //             </MemoryRouter>
    //         );

    //         // Move to step 2
    //         fireEvent.click(screen.getByText(/event planner/i).closest("button"));
    //         fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    //         fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
    //         fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
    //         fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });

    //         fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form"));

    //         expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    //     });
    // });

    describe("TC-010: should not register if password field is empty", () => {
        test("register with all valid credentials", async () => {
            render(
                <MemoryRouter>
                    <HeadProvider>
                        <Register user={null} />
                    </HeadProvider>
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText(/event planner/i).closest("button"));
            fireEvent.click(screen.getByRole("button", { name: /continue/i }));

            fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
            fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
            fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

            fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form"));

            await waitFor(() => {
                expect(mockRegister).toHaveBeenCalledWith(
                    expect.any(Object),
                    "test@example.com",
                    "password123",
                    { first_name: "John", last_name: "Doe", role: "Event Planner" }
                );
            });
        });
    })
});


