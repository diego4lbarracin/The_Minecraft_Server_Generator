import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-minecraft-headerBrown shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title/Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white hover:text-gray-200 transition-colors">
              The Minecraft Server Generator
            </h1>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <button className="btn-primary">Log In</button>
            </Link>
            <Link to="/signup">
              <button className="btn-secondary">Sign Up</button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
