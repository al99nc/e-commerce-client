import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar } from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user"))
  );
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const token = localStorage.getItem("token");
  let decoded = null;
  try {
    decoded = token ? jwtDecode(token) : null;
  } catch (err) {
    console.error("Invalid token", err);
    decoded = null;
  }

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Only redirect to login if user is on a protected route and not authenticated
    if (!decoded && !isPublicRoute) {
      navigate("/login");
    }
  }, [decoded, navigate, isPublicRoute]);

  // Helper function to check if user can access a route
  const canAccessRoute = (route) => {
    if (publicRoutes.includes(route)) return true;
    return decoded && decoded.role;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              ECOMMERCE
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-8">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Home
                </Link>
              </li>
              {/* Only show Cart if user is authenticated */}
              {decoded && (
                <li>
                  <Link
                    to="/cart"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cart
                  </Link>
                </li>
              )}
              {/* Only show Sell links if user is authenticated */}
              {decoded && (
                <li>
                  {decoded?.role === "SELLER" ? (
                    <Link
                      to="/seller-dashboard"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Sell
                    </Link>
                  ) : (
                    <Link
                      to="/sell"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Sell
                    </Link>
                  )}
                </li>
              )}
            </ul>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/account" className="flex items-center space-x-2 group">
                <Avatar
                  name={user?.name}
                  src={user?.avatar}
                  size="sm"
                  className="ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {user.name}
                </span>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Heroicon menu icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Hidden by default */}
      <div className="hidden md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Home
          </Link>
          {/* Only show protected routes in mobile menu if user is authenticated */}
          {decoded && (
            <>
              <Link
                to="/cart"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Cart
              </Link>
              <Link
                to="/sell"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Sell
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;