import { apiClient } from "../../shared/api/client";
import type {
  CorpusGenerationResult,
  ExperimentTestCaseListResponse,
  ExperimentMethod,
  ExperimentExecution,
  ExperimentStage,
  ExperimentTimeMeasurement,
  ExperimentStats,
} from "./types";

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
