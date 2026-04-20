import api from "./axiosClient";

export type UserRole = "owner" | "admin" | "worker" | "viewer";
export type Permissions = Record<string, Record<string, boolean>>;

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permissions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  role?: UserRole;
}

export const employeesApi = {
  // ✅ Listar empleados de la empresa
  list: () => api.get<Employee[]>("/company/users").then((r) => r.data),

  // ✅ Crear empleado
  create: (payload: CreateEmployeePayload) =>
    api.post<Employee>("/company/users", payload).then((r) => r.data),

  // ✅ Actualizar datos básicos
  update: (id: string, payload: UpdateEmployeePayload) =>
    api.put<Employee>(`/company/users/${id}`, payload).then((r) => r.data),

  // ✅ Resetear contraseña
  resetPassword: (id: string, payload: { newPassword: string }) =>
    api.put(`/company/users/${id}/reset-password`, payload),

  // ✅ Actualizar permisos (solo owner)
  updatePermissions: (id: string, permissions: Permissions) =>
    api
      .put<Employee>(`/company/users/${id}/permissions`, { permissions })
      .then((r) => r.data),

  // ✅ Borrar usuario (SOLO owner, DELETE real)
  delete: (id: string) => api.delete(`/company/users/${id}`),
};
