import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import ServerStatusPage from "./pages/ServerStatusPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const basename =
    import.meta.env.VITE_GITHUB_PAGES === "true"
      ? "/The_Minecraft_Server_Generator"
      : "";

  return (
    <Router basename={basename}>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* Public Routes with Header and Footer */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Header />
                <LandingPage />
                <Footer />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Header />
                <SignUpPage />
                <Footer />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Header />
                <LoginPage />
                <Footer />
              </PublicRoute>
            }
          />

          {/* Protected Routes (Dashboard without public header/footer) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Forgot Password Route */}
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <Header />
                <ForgotPasswordPage />
                <Footer />
              </PublicRoute>
            }
          />
          {/* Reset Password Route - NOT in PublicRoute because recovery session is active */}
          <Route
            path="/reset-password"
            element={
              <>
                <Header />
                <ResetPasswordPage />
                <Footer />
              </>
            }
          />
          {/* Server Status Page - Public (opened in new tab) */}
          <Route path="/server-status" element={<ServerStatusPage />} />
          {/* Pending Approval Route */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
