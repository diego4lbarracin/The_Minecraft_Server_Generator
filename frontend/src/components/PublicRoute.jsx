import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  if (user) {
    // Check if user is approved before redirecting
    if (profile && !profile.approved) {
      // Redirect unapproved users to pending approval page
      return <Navigate to="/pending-approval" replace />;
    }
    // Redirect approved users to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
