import api from "./axiosClient";

export interface AuditEntry {
  _id: string;
  userId?: { _id: string; name: string; email: string } | null;
  module: string;
  action: string;
  entityLabel?: string;
  entityId?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export const auditApi = {
  list: (params?: Record<string, string>) =>
    api.get<AuditEntry[]>("/company/audit", { params }).then((r) => r.data),
};
