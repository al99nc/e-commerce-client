import React, { useState, useEffect } from "react";
import { fetchProducts } from "../../services/api";
import ProductList from "./ProductList";
import toast from "react-hot-toast";

function ProductDetails() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'price-low', 'price-high'

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();

        // Sort products based on selection
        const sortedProducts = sortProducts(data, sortBy);
        setProducts(sortedProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [sortBy]);

  const sortProducts = (products, sortType) => {
    const productsCopy = [...products];
    switch (sortType) {
      case "price-low":
        return productsCopy.sort((a, b) => a.price - b.price);
      case "price-high":
        return productsCopy.sort((a, b) => b.price - a.price);
      case "newest":
      default:
        return productsCopy.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Our Products
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({products.length} items)
            </span>
          </h1>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4">
            <label htmlFor="sort" className="text-sm font-medium text-gray-800">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🛍️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Check back later for new products!
              </p>
            </div>
          ) : (
            <ProductList products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
