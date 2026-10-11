import { apiClient } from "../../shared/api/client";
import type { UserItem, UserListResponse, UserUpdatePayload } from "./types";

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
