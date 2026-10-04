export interface SystemInfo {
  version: string;
  environment: string;
  debug: boolean;
  database: string;
  timestamp: string;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  app: string;
  system: SystemInfo;
  checks: {
    database: string;
    uploads_dir: boolean;
    generated_dir: boolean;
    [key: string]: any;
  };
}

export type RoleType =
  | "ADMINISTRADOR"
  | "ABOGADO_NOTARIO"
  | "AUXILIAR"
  | "ADMINISTRACION";

export interface UserSession {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: RoleType;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
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
}

export interface UserListResponse {
  total: number;
  items: UserItem[];
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  module: string;
  record_id?: string;
  ip_address?: string;
  details?: string;
  status: string;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  items: AuditLogItem[];
}