import React, { useState, useEffect } from "react";
import { fetchProductById, addToCart } from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetchProductById(id);
        if (res.success) {
          setProduct(res.product);
        } else {
          toast.error("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const calculateDiscountedPrice = () => {
    const price = parseFloat(product.price);
    const discountValue = parseFloat(product.discount_value) || 0;

    if (product.discount_type === "percent" && discountValue > 0) {
      return Math.max(0, price * (1 - discountValue / 100)).toFixed(2);
    } else if (product.discount_type === "amount" && discountValue > 0) {
      return Math.max(0, price - discountValue).toFixed(2);
    }
    return price.toFixed(2);
  };

  const hasDiscount =
    product?.discount_type !== "none" &&
    parseFloat(product?.discount_value) > 0;
  const isInStock = product?.stock_quantity > 0;
  const stockCount = parseInt(product?.stock_quantity) || 0;
  const maxQuantity = Math.min(stockCount, 10);
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setSelectedQuantity(value === "custom" ? "custom" : parseInt(value));
    setCustomQuantity("");
  };

  const handleCustomQuantityChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and empty string
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setCustomQuantity(value);
    }
  };

  const getFinalQuantity = () => {
    if (selectedQuantity === "custom") {
      const qty = parseInt(customQuantity) || 0;
      // Validate custom quantity is within allowed range
      return qty >= 11 && qty <= stockCount ? qty : 1;
    }
    return selectedQuantity;
  };

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to add items to cart");
        navigate("/login");
        return;
      }

      setAddingToCart(true);
      const finalQuantity = getFinalQuantity();

      if (finalQuantity < 1 || finalQuantity > stockCount) {
        toast.error(`Please select a quantity between 1 and ${stockCount}`);
        return;
      }

      const result = await addToCart(id, { quantity: finalQuantity });

      if (result.success) {
        toast.success("Added to cart!");
        navigate("/cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      if (err.message.includes("401")) {
        toast.error("Please log in to add items to cart");
        navigate("/login");
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl font-semibold text-gray-600">
          Loading product...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product not found
          </h2>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image */}
          <div className="flex flex-col">
            <div className="w-full aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={
                  product.picture
                    ? `http://localhost:4000${product.picture}`
                    : "/placeholder-image.png"
                }
                alt={product.title}
                className="w-full h-full object-center object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                }}
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {product.title}
            </h1>

            {/* Summary */}
            {product.summary && (
              <p className="mt-4 text-gray-500">{product.summary}</p>
            )}

            {/* Price */}
            <div className="mt-6">
              {hasDiscount && (
                <p className="text-sm line-through text-gray-500">
                  List Price: ${parseFloat(product.price).toFixed(2)}
                </p>
              )}
              <div className="flex items-center">
                <p className="text-3xl font-bold text-gray-900">
                  ${calculateDiscountedPrice()}
                </p>
                {hasDiscount && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Save{" "}
                    {product.discount_type === "percent"
                      ? `${product.discount_value}%`
                      : `$${product.discount_value}`}
                  </span>
                )}
              </div>
            </div>

            {/* Stock status */}
            <div className="mt-6">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                    isInStock ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <p
                  className={`ml-2 text-sm ${isInStock ? "text-green-600" : "text-red-600"}`}
                >
                  {isInStock
                    ? `In Stock (${product.stock_quantity} available)`
                    : "Out of Stock"}
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            {isInStock && (
              <div className="mt-6">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity
                </label>
                <div className="mt-1 flex space-x-4 items-center">
                  <select
                    id="quantity"
                    value={selectedQuantity}
                    onChange={handleQuantityChange}
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    {quantityOptions.map((qty) => (
                      <option key={qty} value={qty}>
                        {qty}
                      </option>
                    ))}
                    {stockCount > 10 && (
                      <option value="custom">Custom (11-{stockCount})</option>
                    )}
                  </select>

                  {selectedQuantity === "custom" && (
                    <div className="flex flex-col">
                      <input
                        type="number"
                        min="11"
                        max={stockCount}
                        value={customQuantity}
                        onChange={handleCustomQuantityChange}
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={`11-${stockCount}`}
                      />
                      {customQuantity &&
                        (parseInt(customQuantity) < 11 ||
                          parseInt(customQuantity) > stockCount) && (
                          <p className="text-xs text-red-500 mt-1">
                            Please enter a value between 11 and {stockCount}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to cart & Buy now buttons */}
            <div className="mt-8 space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={
                  !isInStock ||
                  addingToCart ||
                  (selectedQuantity === "custom" &&
                    (parseInt(customQuantity) < 11 ||
                      parseInt(customQuantity) > stockCount))
                }
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding to Cart...
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>

              <button
                onClick={() =>
                  navigate(`/buy-now/${id}?quantity=${getFinalQuantity()}`)
                }
                disabled={
                  !isInStock ||
                  (selectedQuantity === "custom" &&
                    (parseInt(customQuantity) < 11 ||
                      parseInt(customQuantity) > stockCount))
                }
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery info */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="space-y-2">
                <p className="flex items-center text-sm text-gray-600">
                  <svg
                    className="flex-shrink-0 mr-2 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  FREE delivery tomorrow
                </p>
                <p className="flex items-center text-sm text-gray-600">
                  <svg
                    className="flex-shrink-0 mr-2 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Free returns
                </p>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-sm font-medium text-gray-900">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product description */}
        <div className="mt-16 lg:mt-24 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Description
          </h2>
          <div className="prose prose-blue max-w-none">
            {product.description}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;