import api from "./axiosClient";

export interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  notes?: string;
  isActive: boolean;
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
  // ✅ Listar clientes (puedes filtrar activos en el backend o frontend)
  list: () => api.get<Client[]>("/company/clients").then((r) => r.data),

  // ✅ Obtener cliente por ID
  get: (id: string) =>
    api.get<Client>(`/company/clients/${id}`).then((r) => r.data),

  // ✅ Crear cliente
  create: (payload: ClientPayload) =>
    api.post<Client>("/company/clients", payload).then((r) => r.data),

  // ✅ Actualizar cliente
  update: (id: string, payload: Partial<ClientPayload>) =>
    api.put<Client>(`/company/clients/${id}`, payload).then((r) => r.data),

  // ✅ Eliminar cliente (DELETE real, solo owner – usar SIEMPRE con modal)
  delete: (id: string) => api.delete(`/company/clients/${id}`),
};
