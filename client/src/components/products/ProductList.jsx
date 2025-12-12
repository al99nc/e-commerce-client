import { useNavigate } from "react-router-dom";

function ProductList({ products }) {
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + "...";
  };

  const calculateDiscountedPrice = (product) => {
    const price = parseFloat(product.price);
    const discountValue = parseFloat(product.discount_value) || 0;

    if (product.discount_type === "percent" && discountValue > 0) {
      return Math.max(0, price * (1 - discountValue / 100)).toFixed(2);
    } else if (product.discount_type === "amount" && discountValue > 0) {
      return Math.max(0, price - discountValue).toFixed(2);
    }
    return price.toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <article
          key={product.id}
          className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          {/* Image */}
          <div
            className="relative aspect-[4/3] bg-gray-100 cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <img
              src={
                `http://localhost:4000${product.picture}` || "/placeholder.png"
              }
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "/placeholder.png";
                e.target.onerror = null;
              }}
            />
            {product.discount_value > 0 && (
              <div className="absolute top-2 right-2">
                <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                  {product.discount_type === "percent"
                    ? `-${product.discount_value}%`
                    : `-$${product.discount_value}`}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => handleProductClick(product.id)}
            >
              {truncateText(product.title, 50)}
            </h3>

            {/* Price */}
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                ${calculateDiscountedPrice(product)}
              </span>
              {product.discount_value > 0 && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600">
              {truncateText(product.description, 100)}
            </p>

            {/* Stock Status */}
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  product.stock_quantity > 0 ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm ${
                  product.stock_quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stock_quantity > 0
                  ? `In Stock (${product.stock_quantity})`
                  : "Out of Stock"}
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleProductClick(product.id)}
              className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>View Details</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ProductList;
