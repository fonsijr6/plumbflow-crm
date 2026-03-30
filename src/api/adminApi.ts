import api from "./axiosClient";

export interface Company {
  _id: string;
  name: string;
  nif?: string;
  address?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string };
  employeeCount?: number;
  createdAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  nif?: string;
  address?: string;
  email?: string;
  phone?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export const adminApi = {
  listCompanies: () =>
    api.get<Company[]>("/admin/companies").then((r) => r.data),

  getCompany: (id: string) =>
    api.get<Company>(`/admin/companies/${id}`).then((r) => r.data),

  createCompany: (payload: CreateCompanyPayload) =>
    api.post<Company>("/admin/companies", payload).then((r) => r.data),

  updateCompany: (id: string, payload: Partial<CreateCompanyPayload>) =>
    api.put<Company>(`/admin/companies/${id}`, payload).then((r) => r.data),

  deactivateCompany: (id: string) =>
    api.put(`/admin/companies/${id}/deactivate`),

  activateCompany: (id: string) =>
    api.put(`/admin/companies/${id}/activate`),
};
