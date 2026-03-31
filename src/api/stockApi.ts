import api from "./axiosClient";

export interface StockItem {
  _id: string;
  productId?: string;
  product?: { _id: string; name: string };
  quantity: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockPayload {
  productId: string;
  quantity: number;
  location?: string;
  notes?: string;
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
  reason?: string;
}

export const stockApi = {
  list: (params?: Record<string, string>) =>
    api.get<StockItem[]>("/company/stock", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<StockItem>(`/company/stock/${id}`).then((r) => r.data),

  create: (payload: StockPayload) =>
    api.post<StockItem>("/company/stock", payload).then((r) => r.data),

  update: (id: string, payload: Partial<StockPayload>) =>
    api.put<StockItem>(`/company/stock/${id}`, payload).then((r) => r.data),

  adjust: (payload: StockAdjustment) =>
    api.post("/company/stock/adjust", payload),

  delete: (id: string) =>
    api.delete(`/company/stock/${id}`),
};
