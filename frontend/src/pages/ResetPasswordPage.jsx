import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import CustomAlert from "../components/CustomAlert";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // detectSessionInUrl: true in supabaseClient will parse the recovery token
    // from the URL hash and fire the PASSWORD_RECOVERY event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
      }
    });

    // Also check for an existing session in case the event already fired
    // before this component mounted (e.g. on a page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid = () =>
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isFormValid()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        setError(error.message);
      } else {
        setShowAlert(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = async () => {
    setShowAlert(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="card max-w-md w-full text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-minecraft-green mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      {showAlert && (
        <CustomAlert
          message="Your password has been updated successfully! Please log in with your new password."
          onClose={handleAlertClose}
        />
      )}

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
            {formData.password.length > 0 && formData.password.length < 8 && (
              <p className="mt-1 text-xs text-red-500">
                Password must be at least 8 characters.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
            {formData.confirmPassword.length > 0 &&
              formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  Passwords do not match.
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="btn-primary w-full text-lg py-3"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
