import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This sends httpOnly cookies automatically
});

// Add request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    // ✅ FIXED: Use "token" instead of "accessToken" to match your components
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
    // Check if backend sent a new token in header
    const newToken = response.headers["x-new-access-token"];
    if (newToken) {
      // ✅ FIXED: Store as "token" to match your components
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
          `${API_BASE_URL}/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        );

        // ✅ FIXED: Backend sends "accessToken", not "token"
        const newToken = response.data.accessToken;
        // ✅ FIXED: Store as "token" to match your components
        localStorage.setItem("token", newToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        console.log("✅ Token refreshed, retrying request");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed, logging out");
        // ✅ FIXED: Remove "token" instead of "accessToken"
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Functions
export const fetchProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post("/signup", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/login", userData);
  return response.data;
};

export const becomeSeller = async (formData) => {
  const response = await api.patch("/become-seller", formData);
  return response.data;
};

export const getSellerDashboard = async () => {
  const response = await api.get("/seller-dashboard");
  return response.data;
};

export const addProduct = async (formData) => {
  const response = await api.post("/add-product", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/delete-product/${id}`);
  return response.data;
};

export const editProduct = async (id, formData) => {
  const response = await api.patch(`/edit-product/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const addToCart = async (id, jsonBody) => {
  const response = await api.post(`/add-to-cart/${id}`, jsonBody);
  return response.data;
};

export const deleteCartItem = async (itemId) => {
  const response = await api.delete(`/cart-item/${itemId}`);
  return response.data;
};

export const getCartItems = async () => {
  const response = await api.get("/cart");
  return response.data.items || [];
};

export const checkout = async () => {
  const response = await api.post("/checkout");
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/account");
  return response.data;
};

export const getSellerProfile = async () => {
  const response = await api.get("/users/seller-profile");
  return response.data;
};

export const refreshToken = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/refresh-token`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // ✅ FIXED: Remove "token" instead of "accessToken"
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};