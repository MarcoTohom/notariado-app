import axios from "axios";
import { HealthResponse } from "../types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const systemService = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },
};