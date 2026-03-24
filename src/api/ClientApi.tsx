import api from "./AxiosClient";
import { Client } from "@/data/mockData";

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get("/clients");
  return data;
};

export const getClient = async (id: string): Promise<Client> => {
  const { data } = await api.get(`/clients/${id}`);
  return data;
};

export const createClient = async (
  payload: Partial<Client>,
): Promise<Client> => {
  const { data } = await api.post("/clients", payload);
  return data;
};

export const updateClient = async (
  id: string,
  payload: Partial<Client>,
): Promise<Client> => {
  const { data } = await api.put(`/clients/${id}`, payload);
  return data;
};

export const deleteClient = async (id: string) => {
  await api.delete(`/clients/${id}`);
};
