import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const { profile, signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  // Automatically redirect to dashboard if user becomes approved
  useEffect(() => {
    if (profile?.approved) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#012500" }}
    >
      <div className="card max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-yellow-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pending Approval
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully, but it requires admin
            approval before you can access the dashboard.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will receive an email notification once your account is
            approved. Please check back later or contact support if you have any
            questions.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="btn-secondary w-full"
          >
            {checking ? "Checking..." : "Check Approval Status"}
          </button>
          <button onClick={handleSignOut} className="btn-primary w-full">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
