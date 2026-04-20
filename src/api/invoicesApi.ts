import api from "./axiosClient";
import { Client } from "./clientsApi";

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export interface InvoiceLine {
  productId: string;
  name: string;
  description?: string;
  productType: "material" | "service";
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  items: InvoiceLine[];
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
  items: InvoiceLine[];
  notes?: string;
}

export const invoicesApi = {
  list: (p0: { clientId: string }) =>
    api.get<Invoice[]>("/company/invoices").then((r) => r.data),

  get: (id: string) =>
    api.get<Invoice>(`/company/invoices/${id}`).then((r) => r.data),

  create: (payload: InvoicePayload) =>
    api.post<Invoice>("/company/invoices", payload).then((r) => r.data),

  update: (id: string, payload: Partial<InvoicePayload>) =>
    api.put<Invoice>(`/company/invoices/${id}`, payload).then((r) => r.data),

  setStatus: (id: string, status: InvoiceStatus) =>
    api
      .put<Invoice>(`/company/invoices/${id}/status`, { status })
      .then((r) => r.data),
};
