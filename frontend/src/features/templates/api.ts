import { apiClient } from "../../shared/api/client";
import type { TemplateListResponse, TemplateDetail, PreviewResult } from "./types";

const multipartHeaders = { "Content-Type": "multipart/form-data" };

export const templateService = {
  getTemplates: async (
    skip = 0,
    limit = 20,
    search?: string,
    caseType?: string
  ): Promise<TemplateListResponse> => {
    const response = await apiClient.get<TemplateListResponse>("/templates", {
      params: { skip, limit, search: search || undefined, case_type: caseType || undefined },
    });
    return response.data;
  },
  getTemplate: async (id: string): Promise<TemplateDetail> => {
    const response = await apiClient.get<TemplateDetail>(`/templates/${id}`);
    return response.data;
  },
  uploadTemplate: async (formData: FormData): Promise<TemplateDetail> => {
    const response = await apiClient.post<TemplateDetail>("/templates", formData, {
      headers: multipartHeaders,
    });
    return response.data;
  },
  uploadVersion: async (templateId: string, formData: FormData): Promise<TemplateDetail> => {
    const response = await apiClient.post<TemplateDetail>(
      `/templates/${templateId}/versions`,
      formData,
      { headers: multipartHeaders }
    );
    return response.data;
  },
  activateVersion: async (templateId: string, versionId: string): Promise<TemplateDetail> => {
    const response = await apiClient.post<TemplateDetail>(
      `/templates/${templateId}/versions/${versionId}/activate`
    );
    return response.data;
  },
  previewVersion: async (templateId: string, versionId: string): Promise<PreviewResult> => {
    const response = await apiClient.post<PreviewResult>(
      `/templates/${templateId}/versions/${versionId}/preview`
    );
    return response.data;
  },
  deactivateTemplate: async (templateId: string): Promise<TemplateDetail> => {
    const response = await apiClient.delete<TemplateDetail>(`/templates/${templateId}`);
    return response.data;
  },
};
