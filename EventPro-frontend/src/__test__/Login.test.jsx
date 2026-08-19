import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/auth/Login";
import { MemoryRouter } from "react-router-dom";
import { HeadProvider } from "react-head";

// Mock firebase
jest.mock('../firebase/firebase', () => ({
    auth: {},
}));

// Mock the useAuthLogin hook
const mockLogin = jest.fn();
jest.mock("../hooks/useAuth", () => ({
    useAuthLogin: jest.fn(() => ({
        login: mockLogin,
        error: null,
        isLoading: false,
    })),
}));

// Mock Navigate
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
}));

describe("Login Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("TC-001: should not log in with empty fields", () => {
        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={null} />
                </HeadProvider>
            </MemoryRouter>
        );

        const button = screen.getByRole("button", { name: /login/i });
        fireEvent.click(button);

        expect(mockLogin).not.toHaveBeenCalled();
    });

    test("TC-002: should not log in with invalid email format", () => {
        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={null} />
                </HeadProvider>
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        const button = screen.getByRole("button", { name: /login/i });
        fireEvent.click(button);

        expect(mockLogin).not.toHaveBeenCalled();
    });

    test("TC-003: should log in with valid credentials", async () => {
        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={null} />
                </HeadProvider>
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const button = screen.getByRole("button", { name: /login/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith(
                expect.any(Object),
                "test@example.com",
                "password123"
            );
        });
    });

    test("shows error message if login fails", () => {
        require("../hooks/useAuth").useAuthLogin.mockReturnValue({
            login: mockLogin,
            error: "Invalid credentials",
            isLoading: false,
        });

        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={null} />
                </HeadProvider>
            </MemoryRouter>
        );

        expect(screen.getAllByText("Invalid credentials").length).toBe(2);
    });

    test("redirects if user is already logged in", () => {
        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={{ uid: "123" }} />
                </HeadProvider>
            </MemoryRouter>
        );

        expect(screen.getByTestId("navigate")).toHaveTextContent("/dashboard");
    });

    test("disables button when loading", () => {
        require("../hooks/useAuth").useAuthLogin.mockReturnValue({
            login: mockLogin,
            error: null,
            isLoading: true,
        });

        render(
            <MemoryRouter>
                <HeadProvider>
                    <Login user={null} />
                </HeadProvider>
            </MemoryRouter>
        );

        const button = screen.getByRole("button", { name: /logging in/i });
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/logging in/i);
    });

});
