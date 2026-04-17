import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001";


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Assuming Bearer token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor to handle unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear local storage on auth failure to prevent infinite error loops
      // but only if we were actually trying to use a token
      if (localStorage.getItem("token")) {
        console.warn("Session expired or unauthorized. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Optional: window.location.href = "/login"; 
        // Better to let the app handle it via state if possible, but redirect is safest for now
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
