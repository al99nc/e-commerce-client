import React from "react";
import ProductDetails from "../components/products/ProductDetails";
import Footer from "../layout/Footer";
import axios from "axios";
import { refreshToken, logoutUser } from "../services/api";
import { jwtDecode } from "jwt-decode";

function HomePage() {
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const now = Date.now();
      const expiry = decoded.exp * 1000;

      console.log("🔍 Token Debug:");
      console.log("Current time:", new Date(now).toISOString());
      console.log("Token expires:", new Date(expiry).toISOString());
      console.log("Is expired:", expiry < now);

      return expiry < now;
    } catch (error) {
      console.error("❌ Token decode error:", error);
      return true;
    }
  };

  React.useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        console.log("🚀 Interceptor triggered for:", config.url);

        let token = localStorage.getItem("accessToken");
        console.log("🔑 Current token:", token ? "exists" : "missing");

        if (token && isTokenExpired(token)) {
          console.log("🔄 Token expired, attempting refresh...");

          try {
            const response = await refreshToken();
            console.log("✅ Refresh response:", response);

            const newToken = response.accessToken;
            if (newToken) {
              localStorage.setItem("accessToken", newToken);
              token = newToken;
              console.log("✅ New token saved");
            } else {
              console.error("❌ No accessToken in refresh response");
            }
          } catch (err) {
            console.error("❌ Token refresh failed:", err);
            console.log("🚪 Logging out user...");
            logoutUser();
            return Promise.reject(err);
          }
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔐 Authorization header set");
        } else {
          console.log("⚠️ No token available for authorization");
        }

        return config;
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  return (
    <div>
      <ProductDetails />
      <Footer />
    </div>
  );
}

export default HomePage;