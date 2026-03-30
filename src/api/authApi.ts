import api from "./axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    mustChangePassword?: boolean;
    permissions: Record<string, Record<string, boolean>>;
  };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  me: () => api.get<AuthResponse["user"]>("/auth/me").then((r) => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", payload),
};
