import React, { useState, useEffect } from "react";
import { getSellerDashboard } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { deleteProduct } from "../services/api";
import { useNavigate } from "react-router-dom";
function SellerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ MOVE IT HERE
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getSellerDashboard();
      console.log(response);

      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error(response.error || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">Failed to load dashboard</div>
      </div>
    );
  }

  const { seller, stats, recentOrders } = dashboardData;
  const HandleDelete = async (id) => {
    try {
      const res = await deleteProduct(id); // ← calling your API function to delete the product
      console.log("Deleted:", res); // ← just logging to see if it worked
      navigate("/seller-dashboard"); // ← boom! Redirecting back to the dashboard after delete
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete product:", err); // ← handles errors gracefully
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {seller.user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalProducts}
              </p>
            </div>
            <div className="text-blue-500 text-3xl">📦</div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalSales}
              </p>
            </div>
            <div className="text-green-500 text-3xl">💰</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalOrders}
              </p>
            </div>
            <div className="text-purple-500 text-3xl">🛍️</div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.rating} ⭐ ({stats.ratingCount})
              </p>
            </div>
            <div className="text-yellow-500 text-3xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md mb-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
        </div>

        <div className="p-6">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent orders</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((orderLine) => (
                <div
                  key={orderLine.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {orderLine.product.picture ? (
                          <img
                            src={
                              orderLine.product.picture
                                ? `http://localhost:4000${orderLine.product.picture}`
                                : "/placeholder.png"
                            }
                            alt={orderLine.product.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-500">📦</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {orderLine.product.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Customer: {orderLine.order.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {orderLine.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        $
                        {(
                          orderLine.quantity *
                          parseInt(orderLine.product.price || 0)
                        ).toFixed(2)}{" "}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(
                          orderLine.order.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your Products Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Your Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardData.products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded shadow-md">
            <img
              src={
                `http://localhost:4000${product.picture}` || "/placeholder.png"
              }
              alt={product.title}
              className="h-40 w-full object-cover rounded"
            />
            <h3 className="text-lg font-semibold mt-2">{product.title}</h3>
            <p className="text-gray-600">${product.price}</p>
            <button
              className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              onClick={() =>
                (window.location.href = `/edit-product/${product.id}`)
              }
            >
              Update
            </button>
            <button
              className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              onClick={() => HandleDelete(product.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}

      <button
        className="fixed bottom-8 right-8 bg-blue-600 text-white text-3xl rounded-full w-14 h-14 flex items-center  justify-center shadow-lg hover:bg-blue-700 transition-all"
        onClick={() => (window.location.href = "/add-product")}
      >
        +
      </button>
    </div>
  );
}

export default SellerDashboard;
