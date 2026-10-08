import { apiClient } from "../../shared/api/client";
import type { ValidationRun, ValidationRunListResponse, RuleCatalogItem } from "./types";

export const validationService = {
  runValidation: async (
    caseId: string,
    templateVersionId: string,
    values?: Record<string, unknown>
  ): Promise<ValidationRun> => {
    const response = await apiClient.post<ValidationRun>("/validations/run", {
      case_id: caseId,
      template_version_id: templateVersionId,
      ...(values ? { values } : {}),
    });
    return response.data;
  },
  getCaseRuns: async (caseId: string, skip = 0, limit = 20): Promise<ValidationRunListResponse> => {
    const response = await apiClient.get<ValidationRunListResponse>(`/validations/cases/${caseId}`, {
      params: { skip, limit },
    });
    return response.data;
  },
  getLatestRun: async (caseId: string): Promise<ValidationRun | null> => {
    const response = await apiClient.get<ValidationRun | null>(`/validations/cases/${caseId}/latest`);
    return response.data;
  },
  getCatalog: async (): Promise<RuleCatalogItem[]> => {
    const response = await apiClient.get<RuleCatalogItem[]>("/validations/catalog");
    return response.data;
  },
};
