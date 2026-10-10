import { apiClient } from "../../shared/api/client";
import type { HealthResponse } from "./types";

export const systemService = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },
};
