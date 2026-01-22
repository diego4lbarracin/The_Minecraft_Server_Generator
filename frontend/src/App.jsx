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

function App() {
  return (
    <Router>
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

          {/* Pending Approval Route */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
