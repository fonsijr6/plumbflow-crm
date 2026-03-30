import api from "./axiosClient";

export interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  notes?: string;
}

export const clientsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Client[]>("/company/clients", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Client>(`/company/clients/${id}`).then((r) => r.data),

  create: (payload: ClientPayload) =>
    api.post<Client>("/company/clients", payload).then((r) => r.data),

  update: (id: string, payload: Partial<ClientPayload>) =>
    api.put<Client>(`/company/clients/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/clients/${id}`),
};
