import api from "./axiosClient";

export type ProductType = "material" | "service";

export interface Product {
  _id: string;
  name: string;
  type: ProductType;
  category?: string;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  isActive?: boolean;
  // legacy/derived fields some endpoints may still expose
  price?: number;
  stock?: number;
  description?: string;
  createdAt: string;
}

export interface ProductPayload {
  name: string;
  type: ProductType;
  category?: string;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  initialStock?: number;
  description?: string;
}

export const productsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Product[]>("/company/products", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Product>(`/company/products/${id}`).then((r) => r.data),

  create: (payload: ProductPayload) => {
    // Solo enviar initialStock si es material
    const body: any = { ...payload };
    if (body.type !== "material") delete body.initialStock;
    return api.post<Product>("/company/products", body).then((r) => r.data);
  },

  update: (id: string, payload: Partial<ProductPayload>) =>
    api.put<Product>(`/company/products/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/products/${id}`),
};
