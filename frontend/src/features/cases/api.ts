import { apiClient } from "../../shared/api/client";
import type {
  CaseListResponse,
  Case,
  CaseCreate,
  CaseUpdate,
  AddPartyRequest,
  CaseParty,
} from "./types";

export const caseService = {
  getCases: async (
    skip = 0,
    limit = 20,
    search?: string,
    caseType?: string,
    caseStatus?: string
  ): Promise<CaseListResponse> => {
    const response = await apiClient.get<CaseListResponse>("/cases", {
      params: {
        skip,
        limit,
        search: search || undefined,
        case_type: caseType || undefined,
        status: caseStatus || undefined,
      },
    });
    return response.data;
  },
  getCase: async (id: string): Promise<Case> => {
    const response = await apiClient.get<Case>(`/cases/${id}`);
    return response.data;
  },
  createCase: async (payload: CaseCreate): Promise<Case> => {
    const response = await apiClient.post<Case>("/cases", payload);
    return response.data;
  },
  updateCase: async (id: string, payload: CaseUpdate): Promise<Case> => {
    const response = await apiClient.put<Case>(`/cases/${id}`, payload);
    return response.data;
  },
  cancelCase: async (id: string): Promise<Case> => {
    const response = await apiClient.delete<Case>(`/cases/${id}`);
    return response.data;
  },
  addParty: async (caseId: string, payload: AddPartyRequest): Promise<CaseParty> => {
    const response = await apiClient.post<CaseParty>(`/cases/${caseId}/parties`, payload);
    return response.data;
  },
  removeParty: async (caseId: string, partyId: string): Promise<void> => {
    await apiClient.delete(`/cases/${caseId}/parties/${partyId}`);
  },
};
