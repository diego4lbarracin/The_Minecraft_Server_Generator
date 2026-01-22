import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Check if profile is approved
  if (profile && !profile.approved) {
    // Redirect to pending approval page if not approved
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

export default ProtectedRoute;
