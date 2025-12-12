// Filename - App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SellPage from "./pages/SellPage";
import BecomeSellerPage from "./pages/BecomeSellerPage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import AccountPage from "./pages/AccountPage";
function App() {
  return (
    <>
      <BrowserRouter>
        <Header /> {/* This makes header appear on ALL pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/become-seller" element={<BecomeSellerPage />} />
          <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
          <Route path="/add-product" element={<AddProductPage />} />
          <Route path="/delete-product/:id" element={<SellerDashboardPage />} />
          <Route path="/edit-product/:id" element={<EditProductPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/add-to-cart/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
