/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./axiosClient";

export type ProductType = "material" | "service";

// ✅ Representa EXACTAMENTE el Product del backend
export interface Product {
  _id: string;
  name: string;
  type: ProductType;
  unit: string;
  unitPrice: number;
  taxRate: number;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

// ✅ Payload para crear / editar productos
export interface ProductPayload {
  name: string;
  type: ProductType;
  unit: string;
  unitPrice: number;
  taxRate?: number;
  description?: string;
  category?: string;
  initialStock?: number;
}

export const productsApi = {
  // ✅ Listar productos activos
  list: () => api.get<Product[]>("/company/products").then((r) => r.data),

  // ✅ Obtener producto por ID
  get: (id: string) =>
    api.get<Product>(`/company/products/${id}`).then((r) => r.data),

  // ✅ Crear producto
  create: (payload: ProductPayload) => {
    const body: any = { ...payload };

    // 🔥 Solo enviar stock inicial si es material
    if (body.type !== "material") {
      delete body.initialStock;
    }

    return api.post<Product>("/company/products", body).then((r) => r.data);
  },

  // ✅ Actualizar producto (NO cambia tipo)
  update: (id: string, payload: Partial<ProductPayload>) =>
    api.put<Product>(`/company/products/${id}`, payload).then((r) => r.data),

  // ✅ Eliminar producto
  delete: (id: string) =>
    api.delete<{ msg: string }>(`/company/products/${id}`).then((r) => r.data),
};
