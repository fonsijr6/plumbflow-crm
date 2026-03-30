import api from "./axiosClient";

export interface Product {
  _id: string;
  name: string;
  category?: string;
  unit?: string;
  price: number;
  stock: number;
  description?: string;
  createdAt: string;
}

export interface ProductPayload {
  name: string;
  category?: string;
  unit?: string;
  price: number;
  stock: number;
  description?: string;
}

export const productsApi = {
  list: () =>
    api.get<Product[]>("/company/products").then((r) => r.data),

  get: (id: string) =>
    api.get<Product>(`/company/products/${id}`).then((r) => r.data),

  create: (payload: ProductPayload) =>
    api.post<Product>("/company/products", payload).then((r) => r.data),

  update: (id: string, payload: Partial<ProductPayload>) =>
    api.put<Product>(`/company/products/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/products/${id}`),
};
