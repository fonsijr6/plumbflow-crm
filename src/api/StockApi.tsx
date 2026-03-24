import api from "./AxiosClient";
import { StockItem } from "@/data/mockData";

export const getStock = async (): Promise<StockItem[]> => {
  const { data } = await api.get("/stock");
  return data;
};

export const getStockItem = async (id: string): Promise<StockItem> => {
  const { data } = await api.get(`/stock/${id}`);
  return data;
};

export const createStockItem = async (
  payload: Partial<StockItem>,
): Promise<StockItem> => {
  const { data } = await api.post("/stock", payload);
  return data;
};

export const updateStockItem = async (
  id: string,
  payload: Partial<StockItem>,
): Promise<StockItem> => {
  const { data } = await api.put(`/stock/${id}`, payload);
  return data;
};

export const deleteStockItem = async (id: string) => {
  await api.delete(`/stock/${id}`);
};
