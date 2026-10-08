import { apiClient } from "../../shared/api/client";
import type {
  ClientListResponse,
  Client,
  ClientCreate,
  ClientUpdate,
  LegalEntityListResponse,
  LegalEntity,
  LegalEntityCreate,
} from "./types";

export const clientService = {
  getClients: async (
    skip = 0,
    limit = 20,
    search?: string,
    statusFilter?: string
  ): Promise<ClientListResponse> => {
    const response = await apiClient.get<ClientListResponse>("/clients", {
      params: { skip, limit, search: search || undefined, status: statusFilter || undefined },
    });
    return response.data;
  },
  getClient: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/clients/${id}`);
    return response.data;
  },
  createClient: async (payload: ClientCreate): Promise<Client> => {
    const response = await apiClient.post<Client>("/clients", payload);
    return response.data;
  },
  updateClient: async (id: string, payload: ClientUpdate): Promise<Client> => {
    const response = await apiClient.put<Client>(`/clients/${id}`, payload);
    return response.data;
  },
  deactivateClient: async (id: string): Promise<Client> => {
    const response = await apiClient.delete<Client>(`/clients/${id}`);
    return response.data;
  },
};

export const legalEntityService = {
  getLegalEntities: async (
    skip = 0,
    limit = 20,
    search?: string,
    statusFilter?: string
  ): Promise<LegalEntityListResponse> => {
    const response = await apiClient.get<LegalEntityListResponse>("/legal-entities", {
      params: { skip, limit, search: search || undefined, status: statusFilter || undefined },
    });
    return response.data;
  },
  getLegalEntity: async (id: string): Promise<LegalEntity> => {
    const response = await apiClient.get<LegalEntity>(`/legal-entities/${id}`);
    return response.data;
  },
  createLegalEntity: async (payload: LegalEntityCreate): Promise<LegalEntity> => {
    const response = await apiClient.post<LegalEntity>("/legal-entities", payload);
    return response.data;
  },
  updateLegalEntity: async (id: string, payload: Partial<LegalEntityCreate>): Promise<LegalEntity> => {
    const response = await apiClient.put<LegalEntity>(`/legal-entities/${id}`, payload);
    return response.data;
  },
  deactivateLegalEntity: async (id: string): Promise<LegalEntity> => {
    const response = await apiClient.delete<LegalEntity>(`/legal-entities/${id}`);
    return response.data;
  },
};
