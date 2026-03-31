import api from "./axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

export interface RefreshResponse {
  token: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/auth/login", payload).then((r) => r.data),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<RefreshResponse>("/auth/refresh").then((r) => r.data),

  me: () => api.get<LoginResponse["user"]>("/auth/me").then((r) => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", payload),
};
