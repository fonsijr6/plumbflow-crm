import api from "./axiosClient";

export interface AuditEntry {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details?: string;
  createdAt: string;
}

export const auditApi = {
  list: (params?: Record<string, string>) =>
    api.get<AuditEntry[]>("/company/audit", { params }).then((r) => r.data),
};
