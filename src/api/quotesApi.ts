import api from "./axiosClient";

export type QuoteStatus = "draft" | "accepted" | "rejected" | "converted";

export interface QuoteLine {
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

export interface Quote {
  _id: string;
  number?: number;
  client?: { _id: string; name: string };
  clientId?: string;
  items: QuoteLine[];
  lines?: QuoteLine[]; // legacy
  status: QuoteStatus;
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotePayload {
  clientId: string;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
  status?: QuoteStatus;
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

  setStatus: (id: string, status: QuoteStatus) =>
    api.put<Quote>(`/company/quotes/${id}`, { status }).then((r) => r.data),

  convert: (id: string) =>
    api.post<{ invoiceId: string }>(`/company/quotes/${id}/convert`).then((r) => r.data),
};
