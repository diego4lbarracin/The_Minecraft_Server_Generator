import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import CustomAlert from "../components/CustomAlert";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const isFormValid = () => email.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
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

  const handleAlertClose = () => {
    setShowAlert(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      {showAlert && (
        <CustomAlert
          message="Password reset email sent! Check your inbox and follow the link to reset your password."
          onClose={handleAlertClose}
        />
      )}

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Your Password?
          </h2>
          <p className="text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="btn-primary w-full text-lg py-3"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-minecraft-green hover:text-minecraft-darkGreen font-semibold"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
