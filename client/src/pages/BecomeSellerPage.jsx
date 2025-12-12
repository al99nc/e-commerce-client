import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { becomeSeller } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

function BecomeSellerPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    tax_id: "",
    business_address: "",
    business_phone: "",
    business_email: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(true); // 👈 To wait for auth check

  const token = localStorage.getItem("token");

  useEffect(() => {
    let decoded = null;

    try {
      if (token) {
        decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (decoded.role === "SELLER") {
          navigate("/seller-dashboard");
          return;
        }

        // If logged in and not a seller → show form
        setIsRedirecting(false);
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const response = await becomeSeller(formData);

    // Handle SUCCESS
    toast.success("Successfully applied to become a seller!");
    localStorage.setItem("token", response.data.token);

    setTimeout(() => {
      navigate("/seller-dashboard");
    }, 2000);
  } catch (error) {
    if (error.response?.status === 400) {
      const errorData = error.response.data;

      if (errorData.details) {
        // Handle validation errors - show each field error
        errorData.details.forEach((err) => {
          toast.error(`${err.path[0]}: ${err.message}`);
        });
        setError("Please fix the validation errors above");
      } else {
        // Handle other 400 errors (like business already exists)
        toast.error(errorData.error);
        setError(errorData.error);
      }
    } else if (error.response?.status === 401) {
      // Token expired or invalid
      toast.error("Please log in again");
      localStorage.removeItem("token");
      navigate("/login");
    } else if (error.response?.status === 403) {
      // Already a seller or permission denied
      toast.error("You already have seller status or access denied");
      setError("Access denied");
    } else {
      // Handle system errors (500, network issues, etc.)
      toast.error("Something went wrong. Please try again.");
      setError("Something went wrong. Please try again.");
    }
  } finally {
    // ALWAYS reset loading state
    setIsLoading(false);
  }
};
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Toaster />

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Apply to Become a Seller</h1>
        <p className="text-gray-600">
          Fill out the form below to apply for seller status on our platform.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Name *
          </label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business name"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Type
          </label>
          <select
            name="business_type"
            value={formData.business_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Business Type</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
            <option value="COMPANY">Company</option>
          </select>
        </div>

        {/* Tax ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Tax ID</label>
          <input
            type="text"
            name="tax_id"
            value={formData.tax_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your tax ID (optional)"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Address
          </label>
          <textarea
            name="business_address"
            value={formData.business_address}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business address"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Phone
          </label>
          <input
            type="tel"
            name="business_phone"
            value={formData.business_phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business phone"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Email
          </label>
          <input
            type="email"
            name="business_email"
            value={formData.business_email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business email"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/sell")}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BecomeSellerPage;
