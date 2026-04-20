import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers?.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// ✅ RESPONSE INTERCEPTOR (REFRESH TOKEN)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/auth/refresh");
        const newToken = res.data.token;

        setAccessToken(newToken);

        originalRequest.headers?.set("Authorization", `Bearer ${newToken}`);

        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
