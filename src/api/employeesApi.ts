import api from "./axiosClient";

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, Record<string, boolean>>;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const employeesApi = {
  list: () =>
    api.get<Employee[]>("/company/users").then((r) => r.data),

  create: (payload: CreateEmployeePayload) =>
    api.post<Employee>("/company/users", payload).then((r) => r.data),

  update: (id: string, payload: Partial<{ name: string; email: string; role: string }>) =>
    api.put<Employee>(`/company/users/${id}`, payload).then((r) => r.data),

  resetPassword: (id: string, payload: { newPassword: string }) =>
    api.put(`/company/users/${id}/reset-password`, payload),

  updatePermissions: (id: string, permissions: Record<string, Record<string, boolean>>) =>
    api.put(`/company/users/${id}/permissions`, { permissions }),

  delete: (id: string) =>
    api.delete(`/company/users/${id}`),
};
