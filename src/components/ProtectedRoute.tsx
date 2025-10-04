import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If user is authenticated, allow access.
  if (user) {
    return <Outlet />;
  }

  // If user is not authenticated, redirect to the login page.
  // Pass the current location so we can redirect back after login.
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;