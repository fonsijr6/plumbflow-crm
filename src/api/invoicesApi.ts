import api from "./axiosClient";

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export interface InvoiceLine {
  productId: string;
  name?: string;
  unit?: string;
  unitPrice: number;
  taxRate: number;
  productType?: "material" | "service";
  quantity: number;
  // legacy compat
  description?: string;
  price?: number;
  iva?: number;
}

export interface Invoice {
  _id: string;
  number?: number;
  client?: { _id: string; name: string };
  clientId?: string;
  items: InvoiceLine[];
  lines?: InvoiceLine[]; // legacy
  status: InvoiceStatus;
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayload {
  clientId: string;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
  status?: InvoiceStatus;
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

  setStatus: (id: string, status: InvoiceStatus) =>
    api.put<Invoice>(`/company/invoices/${id}`, { status }).then((r) => r.data),
};
