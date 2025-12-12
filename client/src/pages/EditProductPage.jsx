import React, { useState, useEffect } from "react";
import { editProduct, fetchProductById } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

function EditProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    price: "",
    discount_type: "none",
    discount_value: "0",
    tags: "",
    stock_quantity: "",
  });
  const [picture, setPicture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetchProductById(id);
        if (res.success) {
          const product = res.product;
          setForm({
            title: product.title || "",
            summary: product.summary || "",
            description: product.description || "",
            price: product.price.toString() || "",
            discount_type: product.discount_type || "none",
            discount_value: product.discount_value?.toString() || "0",
            tags: product.tags?.join(", ") || "",
            stock_quantity: product.stock_quantity?.toString() || "0",
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append all form fields
      for (let key in form) {
        formData.append(key, form[key]);
      }

      // Only append picture if a new one was selected
      if (picture) {
        formData.append("picture", picture);
      }

      const res = await editProduct(id, formData);
      if (res.success) {
        toast.success("Product updated successfully!");
        navigate("/seller-dashboard");
      } else {
        toast.error(res.error || "Failed to update product");
      }
    } catch (err) {
      console.error("Edit product error:", err);

      // Handle validation errors
      if (err.response?.data?.details) {
        const errors = err.response.data.details;
        errors.forEach((error) => {
          toast.error(`${error.field}: ${error.message}`);
        });
      } else {
        toast.error(err.response?.data?.error || "Something went wrong");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            name="title"
            placeholder="Product title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <input
            name="summary"
            placeholder="Brief product summary"
            value={form.summary}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description *
          </label>
          <textarea
            name="description"
            placeholder="Detailed product description"
            value={form.description}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-32"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price *</label>
          <input
            type="number"
            step="0.01"
            name="price"
            placeholder="0.00"
            value={form.price}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Discount Type
          </label>
          <select
            name="discount_type"
            value={form.discount_type}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Discount</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Discount Value
          </label>
          <input
            type="number"
            step="0.01"
            name="discount_value"
            placeholder="0.00"
            value={form.discount_value}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            name="tags"
            placeholder="electronics, wireless, bluetooth"
            value={form.tags}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Stock Quantity *
          </label>
          <input
            type="number"
            name="stock_quantity"
            placeholder="0"
            value={form.stock_quantity}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Update Picture
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files[0])}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">
            Leave empty to keep current image
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
          >
            Update Product
          </button>
          <button
            type="button"
            onClick={() => navigate("/seller-dashboard")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProductPage;