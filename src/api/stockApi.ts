import api from "./axiosClient";

export interface StockItem {
  _id: string;
  productId?: string;
  product?: { _id: string; name: string; type?: "material" | "service"; unit?: string };
  quantity: number;
  minStock?: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  productId: string;
  quantity: number; // delta o valor según backend; aquí es ajuste manual
  reason?: string;
}

export const stockApi = {
  list: (params?: Record<string, string>) =>
    api.get<StockItem[]>("/company/stock", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<StockItem>(`/company/stock/${id}`).then((r) => r.data),

  // Ajuste manual (solo owner/admin). El backend gestiona la lógica.
  update: (id: string, payload: { quantity?: number; minStock?: number; location?: string; notes?: string }) =>
    api.put<StockItem>(`/company/stock/${id}`, payload).then((r) => r.data),

  adjust: (payload: StockAdjustment) =>
    api.post("/company/stock/adjust", payload),
};
