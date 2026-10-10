import type { RoleType } from "../auth/types";

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
}

export interface UserListResponse {
  total: number;
  items: UserItem[];
}
