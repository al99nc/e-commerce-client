import React from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function SellPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  let decoded = null;

  try {
    if (token) {
      decoded = jwtDecode(token);
    }
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem("token");
    decoded = null;
  }

  // Not logged in state
  if (!decoded) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <div className="mb-6 text-6xl">👋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Seller Center
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access the seller dashboard or apply to become a
              seller
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Customer state
  if (decoded.role === "CUSTOMER") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full px-6 py-12 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <div className="mb-6 text-6xl">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Start Your Selling Journey
            </h2>
            <p className="text-gray-600 mb-8">
              Join our community of successful sellers and turn your passion
              into profit. Apply now to start selling on our platform!
            </p>
            <div className="space-y-4">
              <Link
                to="/become-seller"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Apply to Become a Seller
              </Link>
              <p className="text-sm text-gray-500">
                Already applied? Contact support for application status.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Seller state - redirect to dashboard
  if (decoded.role === "SELLER") {
    navigate("/seller-dashboard");
    return null;
  }

  // Invalid role state
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg text-center">
        <div className="mb-6 text-6xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Something's not right
        </h2>
        <p className="text-gray-600 mb-8">
          We couldn't verify your account type. Please contact support for
          assistance.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default SellPage;