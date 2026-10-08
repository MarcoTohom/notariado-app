import { apiClient } from "../../shared/api/client";
import type { DocumentDetail, DocumentListResponse } from "./types";

export const documentService = {
  generate: async (
    caseId: string,
    templateVersionId?: string,
    notes?: string
  ): Promise<DocumentDetail> => {
    const response = await apiClient.post<DocumentDetail>("/documents/generate", {
      case_id: caseId,
      template_version_id: templateVersionId || undefined,
      notes: notes || undefined,
    });
    return response.data;
  },
  getDocuments: async (
    skip = 0,
    limit = 20,
    caseId?: string
  ): Promise<DocumentListResponse> => {
    const response = await apiClient.get<DocumentListResponse>("/documents", {
      params: { skip, limit, case_id: caseId || undefined },
    });
    return response.data;
  },
  getDocument: async (id: string): Promise<DocumentDetail> => {
    const response = await apiClient.get<DocumentDetail>(`/documents/${id}`);
    return response.data;
  },
};
