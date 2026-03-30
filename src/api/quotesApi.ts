import api from "./axiosClient";

export interface QuoteLine {
  description: string;
  quantity: number;
  price: number;
  iva: number;
}

export interface Quote {
  _id: string;
  number?: number;
  client?: { _id: string; name: string };
  clientId?: string;
  lines: QuoteLine[];
  status: "pending" | "accepted" | "rejected";
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotePayload {
  clientId: string;
  lines: QuoteLine[];
  notes?: string;
  status?: string;
}

export const quotesApi = {
  list: (params?: Record<string, string>) =>
    api.get<Quote[]>("/company/quotes", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Quote>(`/company/quotes/${id}`).then((r) => r.data),

  create: (payload: QuotePayload) =>
    api.post<Quote>("/company/quotes", payload).then((r) => r.data),

  update: (id: string, payload: Partial<QuotePayload>) =>
    api.put<Quote>(`/company/quotes/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/quotes/${id}`),
};
