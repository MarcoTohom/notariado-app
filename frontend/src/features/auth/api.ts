import { apiClient } from "../../shared/api/client";
import type { TokenResponse, UserSession } from "./types";

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
