import { apiClient } from "../../shared/api/client";
import type { UserListResponse } from "./types";

export const userService = {
  getUsers: async (skip = 0, limit = 50, search?: string): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>("/users", {
      params: { skip, limit, search },
    });
    return response.data;
  },
};
