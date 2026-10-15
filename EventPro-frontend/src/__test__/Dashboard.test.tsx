import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import EventDashboard from "../pages/events/EventDashboard";
import SupplierDashboard from "../pages/suppliers/SupplierDashboard";
import { Navigate } from "react-router-dom";
import Loading from "../components/Loading";

// Mock sub-components
jest.mock("../pages/events/EventDashboard", () => jest.fn(() => <div data-testid="event-dashboard">Event Dashboard</div>));
jest.mock("../pages/suppliers/SupplierDashboard", () => jest.fn(() => <div data-testid="supplier-dashboard">Supplier Dashboard</div>));
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    Navigate: jest.fn(({ to }) => <div data-testid="navigate">{to}</div>)
}));
jest.mock("../components/Loading", () => jest.fn(() => <div data-testid="loading">Loading...</div>));

describe("Dashboard Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("TC-011: should navigate EventDashboard for Event Planner role", () => {
        const user = { uid: "1" };
        const userData = { role: "Event Planner" };

        render(<Dashboard user={user} userData={userData} />);
        expect(screen.getByTestId("event-dashboard")).toBeInTheDocument();
    });

    test("TC-012: should navigate SupplierDashboard for Supplier role", () => {
        const user = { uid: "2" };
        const userData = { role: "Supplier" };

        render(<Dashboard user={user} userData={userData} />);
        expect(screen.getByTestId("supplier-dashboard")).toBeInTheDocument();
    });

    test("TC-013: should navigate to admin dashboard for Admin role", () => {
        const user = { uid: "3" };
        const userData = { role: "Admin" };

        render(<Dashboard user={user} userData={userData} />);
        expect(screen.getByTestId("navigate")).toHaveTextContent("/admin/dashboard");
    });
});
