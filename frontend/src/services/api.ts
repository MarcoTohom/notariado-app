import axios from "axios";
import {
  HealthResponse,
  TokenResponse,
  UserSession,
  UserItem,
  UserUpdatePayload,
  UserListResponse,
  AuditLogListResponse,
  Client,
  ClientCreate,
  ClientUpdate,
  ClientListResponse,
  LegalEntity,
  LegalEntityCreate,
  LegalEntityListResponse,
  Case,
  CaseCreate,
  CaseUpdate,
  CaseListResponse,
  CaseParty,
  AddPartyRequest,
  TemplateDetail,
  TemplateListResponse,
  PreviewResult,
  ValidationRun,
  ValidationRunListResponse,
  RuleCatalogItem,
  DocumentDetail,
  DocumentListResponse,
  ExperimentTestCaseListResponse,
  CorpusGenerationResult,
  ExperimentExecution,
  ExperimentTimeMeasurement,
  ExperimentStage,
  ExperimentMethod,
  ExperimentStats,
  FileInventoryResponse,
  FilePreviewResponse,
} from "../types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor to inject Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("notariado_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const systemService = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },
};

export const authService = {
  login: async (usernameOrEmail: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/auth/login", {
      username_or_email: usernameOrEmail,
      password: password,
    });
    return response.data;
  },
  getMe: async (): Promise<UserSession> => {
    const response = await apiClient.get<UserSession>("/auth/me");
    return response.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};

export const userService = {
  getUsers: async (skip = 0, limit = 50, search?: string): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>("/users", {
      params: { skip, limit, search },
    });
    return response.data;
  },
  updateUser: async (id: string, data: Partial<UserUpdatePayload>): Promise<UserItem> => {
    const response = await apiClient.put<UserItem>(`/users/${id}`, data);
    return response.data;
  },
  getPermissionCatalog: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>("/users/meta/permissions");
    return response.data;
  },
};

export const auditService = {
  getAuditLogs: async (skip = 0, limit = 50, module?: string): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>("/audit", {
      params: { skip, limit, module },
    });
    return response.data;
  },
};

/** Extrae un mensaje de error amigable desde respuestas FastAPI ({detail}). */
export const getApiErrorMessage = (err: unknown, fallback = "Ocurrió un error inesperado."): string => {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim() !== "") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
        .join(" ");
    }
    if (err.response?.status === 403) return "No tienes permisos para realizar esta acción.";
    if (err.message && !err.response) return "No se pudo conectar con el servidor.";
  }
  return fallback;
};

// ---------------------------------------------------------------------------
// FASE 3: Clientes, Personas Jurídicas y Expedientes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FASE 5: Repositorio y Versionamiento de Plantillas DOCX
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FASE 6: Motor de Reglas Notariales
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FASE 7: Generación y Versionamiento de Borradores DOCX
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FASE 11: Experimento de Tesis UMG
// ---------------------------------------------------------------------------

export const experimentService = {
  generateCorpus: async (): Promise<CorpusGenerationResult> => {
    const response = await apiClient.post<CorpusGenerationResult>("/experiment/cases/generate");
    return response.data;
  },
  getCases: async (
    skip = 0,
    limit = 100,
    caseType?: string,
    hasAnomalies?: boolean
  ): Promise<ExperimentTestCaseListResponse> => {
    const response = await apiClient.get<ExperimentTestCaseListResponse>("/experiment/cases", {
      params: { skip, limit, case_type: caseType || undefined, has_anomalies: hasAnomalies },
    });
    return response.data;
  },
  startExecution: async (testCaseId: string, method: ExperimentMethod): Promise<ExperimentExecution> => {
    const response = await apiClient.post<ExperimentExecution>("/experiment/executions/start", {
      test_case_id: testCaseId,
      method,
    });
    return response.data;
  },
  finishExecution: async (
    executionId: string,
    payload: { errors_found?: number; errors_missed?: number; corrections?: number; notes?: string }
  ): Promise<ExperimentExecution> => {
    const response = await apiClient.post<ExperimentExecution>(
      `/experiment/executions/${executionId}/finish`,
      payload
    );
    return response.data;
  },
  startStage: async (executionId: string, stage: ExperimentStage): Promise<ExperimentTimeMeasurement> => {
    const response = await apiClient.post<ExperimentTimeMeasurement>(
      `/experiment/executions/${executionId}/stages/start`,
      { stage }
    );
    return response.data;
  },
  finishStage: async (measurementId: string): Promise<ExperimentTimeMeasurement> => {
    const response = await apiClient.post<ExperimentTimeMeasurement>(
      `/experiment/stages/${measurementId}/finish`
    );
    return response.data;
  },
  getStats: async (): Promise<ExperimentStats> => {
    const response = await apiClient.get<ExperimentStats>("/experiment/stats");
    return response.data;
  },
  exportXlsxUrl: "/api/v1/experiment/export.xlsx",
  exportCsvUrl: "/api/v1/experiment/export.csv",
};

// ---------------------------------------------------------------------------
// WP-05: Inventario y previsualización de archivos del sistema
// ---------------------------------------------------------------------------

export const fileService = {
  getInventory: async (
    kind?: string,
    statusFilter?: string,
    skip = 0,
    limit = 100
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