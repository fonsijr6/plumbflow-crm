import api from "./axiosClient";
import { Client } from "./clientsApi";

export type QuoteStatus = "draft" | "accepted" | "rejected" | "converted";

export interface QuoteLine {
  productId: string;
  name: string;
  description?: string;
  productType: "material" | "service";
  unit: string;
  quantity: number;
  price: number;
  taxRate: number;
  total: number;
}

export interface Quote {
  _id: string;
  quoteNumber: string;
  clientId: string;
  client?: Client;
  items: QuoteLine[];
  status: QuoteStatus;
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotePayload {
  clientId: string;
  client?: Client;
  items: QuoteLine[];
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export const quotesApi = {
  list: () => api.get<Quote[]>("/company/quotes").then((r) => r.data),

  get: (id: string) =>
    api.get<Quote>(`/company/quotes/${id}`).then((r) => r.data),

  create: (payload: QuotePayload) =>
    api.post<Quote>("/company/quotes", payload).then((r) => r.data),

  update: (id: string, payload: Partial<QuotePayload>) =>
    api.put<Quote>(`/company/quotes/${id}`, payload).then((r) => r.data),

  setStatus: (id: string, status: QuoteStatus) =>
    api
      .put<Quote>(`/company/quotes/${id}/status`, { status })
      .then((r) => r.data),

  convert: (id: string) =>
    api.post(`/company/quotes/${id}/convert`).then((r) => r.data),
};
