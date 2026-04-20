import api from "./axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export type UserRole = "owner" | "admin" | "worker" | "viewer";
export type Permissions = Record<string, Record<string, boolean>>;

// ✅ Usuario autenticado (contrato real con backend)
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  permissions: Permissions;
  mustChangePassword?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ Login devuelve token + usuario
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ✅ Refresh devuelve solo token (usado por interceptor)
export interface RefreshResponse {
  token: string;
}

export const authApi = {
  // ✅ Login
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/auth/login", payload).then((r) => r.data),

  // ✅ Logout
  logout: () => api.post("/auth/logout"),

  // ⚠️ Normalmente NO hace falta llamarlo a mano
  // El interceptor de axios ya refresca automáticamente
  refresh: () => api.post<RefreshResponse>("/auth/refresh").then((r) => r.data),

  // ✅ Usuario autenticado actual
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),

  // ✅ Cambiar contraseña
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", payload),
};
