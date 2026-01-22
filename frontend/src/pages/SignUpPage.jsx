import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomAlert from "../components/CustomAlert";
import { useAuth } from "../context/AuthContext";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormValid = () => {
    return (
      formData.email.trim() !== "" &&
      formData.password.length >= 8 &&
      formData.confirmPassword.length >= 8 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isFormValid()) {
      setLoading(true);
      try {
        const { data, error } = await signUp(formData.email, formData.password);

        if (error) {
          setError(error.message);
        } else {
          setAlertMessage(
            "Account created successfully! Your account is pending approval. You will receive an email notification once approved.",
          );
          setShowAlert(true);

          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to The Minecraft Server Generator
          </h2>
          <p className="text-gray-600">
            Create your free account and start building your server today!
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
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">
                (min. 8 characters)
              </span>
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            {formData.password && formData.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="btn-primary w-full text-lg py-3"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-minecraft-green hover:text-minecraft-darkGreen font-semibold"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>

      {showAlert && (
        <CustomAlert
          message={alertMessage}
          onClose={() => {
            setShowAlert(false);
            navigate("/login");
          }}
        />
      )}
    </div>
  );
};

export default SignUpPage;
