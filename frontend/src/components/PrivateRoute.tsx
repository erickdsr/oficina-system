import { Navigate, useLocation } from "react-router-dom";
import LoadingState from "./common/LoadingState";
import { useAuth } from "../context/auth.context";
import { canManage, type AppRole } from "../utils/permissions";

interface PrivateRouteProps {
    children: React.ReactNode;
    allowedRoles?: AppRole[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
    const { isAuthenticated, isInitializing, user } = useAuth();
    const location = useLocation();

    if (isInitializing) {
        return <LoadingState />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && !canManage(user?.role, allowedRoles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PrivateRoute;
