import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If user is authenticated and is an admin, allow access.
  if (user && role === 'admin') {
    return <Outlet />;
  }

  // If user is authenticated but not an admin, redirect to home.
  if (user) {
    return <Navigate to="/" />;
  }

  // If user is not authenticated, redirect to the admin login page.
  return <Navigate to="/admin" />;
};

export default AdminRoute;