import api from "./axiosClient";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  client?: { _id: string; name: string };
  clientId?: string;
  status: "pending" | "in_progress" | "completed";
  date?: string;
  address?: string;
  images?: string[];
  number?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  clientId?: string;
  status?: string;
  date?: string;
  address?: string;
}

export const tasksApi = {
  list: (params?: Record<string, string>) =>
    api.get<Task[]>("/company/tasks", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Task>(`/company/tasks/${id}`).then((r) => r.data),

  create: (payload: TaskPayload) =>
    api.post<Task>("/company/tasks", payload).then((r) => r.data),

  update: (id: string, payload: Partial<TaskPayload>) =>
    api.put<Task>(`/company/tasks/${id}`, payload).then((r) => r.data),

  uploadImages: (id: string, formData: FormData) =>
    api.post<Task>(`/company/tasks/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/company/tasks/${id}`),
};
