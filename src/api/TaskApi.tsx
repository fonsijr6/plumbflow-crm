import api from "./AxiosClient";
import { Task } from "@/data/mockData";

export const getTasks = async (clientId?: string): Promise<Task[]> => {
  const { data } = await api.get("/tasks", {
    params: clientId ? { clientId } : {},
  });
  return data;
};

export const getTask = async (id: string): Promise<Task> => {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
};

export const createTask = async (payload: Partial<Task>): Promise<Task> => {
  const { data } = await api.post("/tasks", payload);
  return data;
};

export const updateTask = async (
  id: string,
  payload: Partial<Task>,
): Promise<Task> => {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id: string) => {
  await api.delete(`/tasks/${id}`);
};
