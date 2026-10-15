import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPassword from "../pages/auth/ForgotPassword";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";
import { MemoryRouter } from "react-router-dom";
import { HeadProvider } from "react-head";

// Mock dependencies
const mockAuth = {};
jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(() => mockAuth),
    sendPasswordResetEmail: jest.fn(),
}));

jest.mock("@/components/ui/use-toast", () => ({ toast: jest.fn() }));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => jest.fn(),
}));

// Helper to render component
const renderForgotPassword = () =>
    render(
        <MemoryRouter>
            <HeadProvider>
                <ForgotPassword />
            </HeadProvider>
        </MemoryRouter>
    );

describe("ForgotPassword Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("TC-004: Submit valid email — Reset link sent (Performed as expected, Passed)", async () => {
        (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

        renderForgotPassword();

        const emailInput = screen.getByPlaceholderText("Email address");
        const submitButton = screen.getByRole("button", {
            name: /send reset email/i,
        });

        fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(sendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, "test@gmail.com");
        });

        expect(toast).toHaveBeenCalledWith({
            title: "Reset email sent",
            description: "Check your inbox for the link to reset your password.",
            variant: "success",
        });
    });

    test("TC-005: Unregistered email — Reset link send failed (Performed as expected, Passed)", async () => {
        (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce({ code: "auth/user-not-found" });

        renderForgotPassword();

        const emailInput = screen.getByPlaceholderText("Email address");
        const submitButton = screen.getByRole("button", {
            name: /send reset email/i,
        });

        fireEvent.change(emailInput, { target: { value: "unknown@example.com" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(
                screen.getByText("No account found with this email.")
            ).toBeInTheDocument();
        });
    });
});
