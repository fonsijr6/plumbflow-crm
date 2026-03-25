/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./AxiosClient";
import { Invoice } from "@/data/mockData";

// ✅ Normalizador universal para id
const normalizeInvoice = (inv: any): Invoice => ({
  ...inv,
  id: inv.id || inv._id, // garantiza que siempre exista id
});

// ✅ Obtener todas las facturas o las de un cliente
export const getInvoices = async (clientId?: string): Promise<Invoice[]> => {
  const url = clientId ? `/invoices/client/${clientId}` : "/invoices";

  const { data } = await api.get(url);

  // ✅ Normalizar lista
  return data.map((inv: any) => normalizeInvoice(inv));
};

// ✅ Obtener una factura por ID
export const getInvoice = async (id: string): Promise<Invoice> => {
  const { data } = await api.get(`/invoices/${id}`);

  // ✅ Normalizar una sola
  return normalizeInvoice(data);
};

// ✅ Crear factura
export const createInvoice = async (
  payload: Partial<Invoice>,
): Promise<Invoice> => {
  const { data } = await api.post("/invoices", payload);
  return normalizeInvoice(data);
};

// ✅ Actualizar factura
export const updateInvoice = async (
  id: string,
  payload: Partial<Invoice>,
): Promise<Invoice> => {
  const { data } = await api.put(`/invoices/${id}`, payload);
  return normalizeInvoice(data);
};

// ✅ Eliminar factura
export const deleteInvoice = async (id: string) => {
  await api.delete(`/invoices/${id}`);
};

// ✅ ✅ ✅ ENVIAR FACTURA POR EMAIL
export const sendInvoice = async (id: string): Promise<Invoice> => {
  const { data } = await api.post(`/invoices/${id}/send`);

  // ✅ Backend devolverá la factura actualizada (status: "sent")
  return normalizeInvoice(data.invoice);
};
