import type { RoleType } from "../auth/types";

export interface PermissionOverrides {
  grant?: string[];
  revoke?: string[];
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: RoleType;
  status: string;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  permission_overrides?: PermissionOverrides | null;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  role?: RoleType;
  status?: string;
  password?: string;
  permission_overrides?: PermissionOverrides | null;
}

export interface UserListResponse {
  total: number;
  items: UserItem[];
}
