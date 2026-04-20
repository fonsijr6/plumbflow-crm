import api from "./axiosClient";

// ✅ Representa EXACTAMENTE el Stock del backend
export interface StockItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    type: "material";
    unit: string;
  };
  quantity: number;
  minStock: number;
  lastMovementNote?: string;
  lastMovementAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ Ajuste manual (delta)
export interface StockAdjustment {
  stockId: string;
  amount: number; // positivo o negativo
}

export const stockApi = {
  // ✅ Inventario completo
  list: () => api.get<StockItem[]>("/company/stock").then((r) => r.data),

  // ✅ Stock de un producto concreto
  getByProduct: (productId: string) =>
    api
      .get<StockItem>(`/company/stock/product/${productId}`)
      .then((r) => r.data),

  // ✅ Ajuste manual de stock (SOLO owner/admin)
  adjust: ({ stockId, amount }: StockAdjustment) =>
    api
      .put<StockItem>(`/company/stock/${stockId}/adjust`, { amount })
      .then((r) => r.data),
};
