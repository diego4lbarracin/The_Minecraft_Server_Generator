import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-minecraft-headerBrown shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title/Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
            title="Return to landing page"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white hover:text-gray-200 hover:scale-110 transition-all duration-200">
              The Minecraft Server Generator
            </h1>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-white text-sm hidden md:inline">
                  {user.email}
                </span>
                <Link to="/dashboard">
                  <button className="btn-secondary">Dashboard</button>
                </Link>
                <button onClick={handleSignOut} className="btn-primary">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="btn-primary">Log In</button>
                </Link>
                <Link to="/signup">
                  <button className="btn-secondary">Sign Up</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
