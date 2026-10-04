import axios from "axios";
import {
  HealthResponse,
  TokenResponse,
  UserSession,
  UserListResponse,
  AuditLogListResponse
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
};

export const auditService = {
  getAuditLogs: async (skip = 0, limit = 50, module?: string): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>("/audit", {
      params: { skip, limit, module },
    });
    return response.data;
  },
};