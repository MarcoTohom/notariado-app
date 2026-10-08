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
