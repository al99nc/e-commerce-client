import axios from "axios";

const API_BASE_URL = "https://e-commerce-fastapi-app-production.up.railway.app";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    const newToken = response.headers["x-new-access-token"];
    if (newToken) {
      localStorage.setItem("token", newToken);
      console.log("🔄 Token refreshed automatically");
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Attempting token refresh...");
        const response = await axios.post(
          `${API_BASE_URL}/refresh-token/`,
          {},
          {
            withCredentials: true,
          }
        );

        const newToken = response.data.accessToken;
        localStorage.setItem("token", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        console.log("✅ Token refreshed, retrying request");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed, logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Functions - Updated to match FastAPI routes

// Home
export const fetchProducts = async () => {
  const response = await api.get("/");
  return response.data;
};

// Products
export const fetchProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const addProduct = async (productData) => {
  const response = await api.post("/create-product", productData);
  return response.data;
};

export const editProduct = async (id, productData) => {
  const response = await api.patch(`/update-product/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// User/Auth
export const signup = async (userData) => {
  const response = await api.post("/signup/", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/login/", userData);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/account/");
  return response.data;
};

export const refreshToken = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/refresh-token/`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/logout/");
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

// Cart
export const getCartItems = async () => {
  const response = await api.get("/cart");
  return response.data || [];
};

export const addToCart = async (productId, quantity) => {
  const response = await api.post(`/add-to-cart/${productId}`, null, {
    params: { quantity }
  });
  return response.data;
};

// Note: These functions were in your old API but not in your FastAPI routes
// You may need to implement them on the backend or remove them from frontend

export const deleteCartItem = async (itemId) => {
  // Not found in FastAPI routes - you may need to add this endpoint
  const response = await api.delete(`/cart-item/${itemId}`);
  return response.data;
};

export const checkout = async () => {
  // Not found in FastAPI routes - you may need to add this endpoint
  const response = await api.post("/checkout");
  return response.data;
};

export const becomeSeller = async (formData) => {
  // Not found in FastAPI routes - you may need to add this endpoint
  const response = await api.patch("/become-seller", formData);
  return response.data;
};

export const getSellerDashboard = async () => {
  // Not found in FastAPI routes - you may need to add this endpoint
  const response = await api.get("/seller-dashboard");
  return response.data;
};

export const getSellerProfile = async () => {
  // Not found in FastAPI routes - you may need to add this endpoint
  const response = await api.get("/users/seller-profile");
  return response.data;
};