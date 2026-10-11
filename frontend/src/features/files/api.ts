import { apiClient } from "../../shared/api/client";
import type { FileInventoryResponse, FilePreviewResponse } from "./types";

export const fileService = {
  getInventory: async (
    kind?: string,
    statusFilter?: string,
    skip = 0,
    limit = 100,
  ): Promise<FileInventoryResponse> => {
    const response = await apiClient.get<FileInventoryResponse>("/files/inventory", {
      params: { kind: kind || undefined, status: statusFilter || undefined, skip, limit },
    });
    return response.data;
  },
  getPreview: async (kind: string, recordId: string): Promise<FilePreviewResponse> => {
    const response = await apiClient.get<FilePreviewResponse>(`/files/preview/${kind}/${recordId}`);
    return response.data;
  },
};
