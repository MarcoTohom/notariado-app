import { apiClient } from "../../shared/api/client";
import type { AuditLogListResponse } from "./types";

export const auditService = {
  getAuditLogs: async (skip = 0, limit = 50, module?: string): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>("/audit", {
      params: { skip, limit, module },
    });
    return response.data;
  },
};
