import axios from "axios";

// src/api/client.js
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://codeconnect-cv6r.onrender.com";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export { BASE_URL };

// Attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;