import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRrefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// ✅ REQUEST
api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// ✅ RESPONSE
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    // ❌ Nunca intentar refresh en login o refresh
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // ✅ Si access token expiró
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) return reject(error);
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh");
        const newToken = res.data.token;

        setAccessToken(newToken);
        isRefreshing = false;
        onRrefreshed(newToken);

        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        onRrefreshed(null);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
