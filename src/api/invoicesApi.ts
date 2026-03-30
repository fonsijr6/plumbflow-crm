import api from "./axiosClient";

export interface InvoiceLine {
  description: string;
  quantity: number;
  price: number;
  iva: number;
}

export interface Invoice {
  _id: string;
  number?: number;
  client?: { _id: string; name: string };
  clientId?: string;
  lines: InvoiceLine[];
  status: "draft" | "sent" | "paid";
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayload {
  clientId: string;
  lines: InvoiceLine[];
  notes?: string;
  status?: string;
}

export const invoicesApi = {
  list: (params?: Record<string, string>) =>
    api.get<Invoice[]>("/company/invoices", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Invoice>(`/company/invoices/${id}`).then((r) => r.data),

  create: (payload: InvoicePayload) =>
    api.post<Invoice>("/company/invoices", payload).then((r) => r.data),

  update: (id: string, payload: Partial<InvoicePayload>) =>
    api.put<Invoice>(`/company/invoices/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/invoices/${id}`),
};
