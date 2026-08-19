import EventDashboard from "./events/EventDashboard"
import SupplierDashboard from "./suppliers/SupplierDashboard"
import { Navigate } from "react-router-dom";
import Loading from "../components/Loading";

export default function Dashboard({ user, userData }) {

    if (!user || !userData) {
        return <Loading />
    }
    
    else {
        switch (userData.role) {
            case 'Supplier':
                return <SupplierDashboard user={user} userData={userData} />;
            case 'Event Planner':
                return <EventDashboard user={user} userData={userData} />
            case 'Admin':
                return <Navigate to={'/admin/dashboard'} replace />
        }
    }
}