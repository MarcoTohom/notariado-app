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
