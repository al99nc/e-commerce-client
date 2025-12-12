import React, { useState, useEffect } from "react";
import { getUserProfile } from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function AccountPage() {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const res = await getUserProfile();
        setUser(res.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const logout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {user ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.name}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Profile Information
              </h2>

              <div className="space-y-4">
                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">
                      Full Name
                    </p>
                    <p className="mt-1 text-gray-900">{user.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-gray-900">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  {user.address && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Address
                      </p>
                      <p className="mt-1 text-gray-900">{user.address}</p>
                    </div>
                  )}
                </div>

                {/* Account Actions */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={() => navigate("/edit-profile")}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">
              Please log in to view your profile
            </h2>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
