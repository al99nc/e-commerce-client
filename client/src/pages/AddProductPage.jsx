import React, { useState } from "react";
import { addProduct } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function AddProductPage() {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (optional - adjust limit as needed)
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setPicture(file);
      console.log("File selected:", file.name, file.size, "bytes");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!picture) {
      toast.error("Please select an image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Add all form fields
      for (let key in form) {
        formData.append(key, form[key]);
      }

      // Add the picture
      formData.append("picture", picture);

      // Debug: Log what we're sending
      console.log("Sending FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const res = await addProduct(formData);

      if (res.success) {
        toast.success("Product added successfully!");
        navigate("/seller-dashboard");
      } else {
        toast.error(res.error || "Failed to add product");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="summary"
          placeholder="Summary"
          value={form.summary}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="discount_type"
          value={form.discount_type}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="none">None</option>
          <option value="percent">Percent</option>
          <option value="amount">Amount</option>
        </select>

        <input
          type="number"
          name="discount_value"
          placeholder="Discount Value"
          value={form.discount_value}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          name="tags"
          placeholder="Tags (comma-separated)"
          value={form.tags}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="stock_quantity"
          placeholder="Stock Quantity"
          value={form.stock_quantity}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
            required
          />
          {picture && (
            <p className="text-sm text-green-600">
              Selected: {picture.name} ({(picture.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AddProductPage;