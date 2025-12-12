import React from "react";

// This file is just for this func that shows the product Card and this is helpful for styling and some other things
function ProductCard(props) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getDiscountPercentage = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-600", bgColor: "bg-red-50" };
    if (stock <= 5) return { text: `Only ${stock} left`, color: "text-orange-600", bgColor: "bg-orange-50" };
    return { text: `In Stock (${stock})`, color: "text-green-600", bgColor: "bg-green-50" };
  };

  const discountPercent = getDiscountPercentage(props.originalPrice, props.price);
  const stockStatus = getStockStatus(props.stock || 0);

  return (
    <div
      onClick={props.onClick}
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
    >
      {/* Discount Badge */}
      {discountPercent && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          -{discountPercent}%
        </div>
      )}

      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={props.img}
          alt={props.title}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
          {props.title}
        </h2>

        {/* Price Section */}
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(props.price)}
          </span>
          {props.originalPrice && props.originalPrice > props.price && (
            <span className="text-sm text-gray-500 line-through font-medium">
              {formatPrice(props.originalPrice)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {props.description}
        </p>

        {/* Stock Status */}
        <div className="flex items-center justify-between pt-2">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
            <div className={`w-2 h-2 rounded-full mr-1.5 ${stockStatus.color.replace('text-', 'bg-')}`}></div>
            {stockStatus.text}
          </div>
          
          {/* Add to Cart Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Handle add to cart logic here
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Bottom Hover Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
}

export default ProductCard;