import api from "./AxiosClient";
import { Invoice } from "@/data/mockData";

export const getInvoices = async (clientId?: string): Promise<Invoice[]> => {
  const { data } = await api.get("/invoices", {
    params: clientId ? { clientId } : {},
  });
  return data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const { data } = await api.get(`/invoices/${id}`);
  return data;
};

export const createInvoice = async (
  payload: Partial<Invoice>,
): Promise<Invoice> => {
  const { data } = await api.post("/invoices", payload);
  return data;
};

export const updateInvoice = async (
  id: string,
  payload: Partial<Invoice>,
): Promise<Invoice> => {
  const { data } = await api.put(`/invoices/${id}`, payload);
  return data;
};

export const deleteInvoice = async (id: string) => {
  await api.delete(`/invoices/${id}`);
};
