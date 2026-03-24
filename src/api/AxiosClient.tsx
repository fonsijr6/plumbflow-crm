import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true, // necesario porque usas refreshToken en cookie
});

// ✅ Interceptor para meter el JWT en todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export default api;
