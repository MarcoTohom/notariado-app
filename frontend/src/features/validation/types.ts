export type FindingSeverity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

export interface ValidationFinding {
  rule_id: string;
  severity: FindingSeverity;
  field_key: string;
  message: string;
  current_value: string;
  expected_value: string;
  location: string;
}

export interface ValidationRun {
  id: string;
  case_id: string;
  template_version_id: string;
  executed_by_id: string;
  status: "LIMPIO" | "CON_ADVERTENCIAS" | "CON_INCONSISTENCIAS";
  total_findings: number;
  critical_count: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  findings: ValidationFinding[];
  created_at: string;
}

export interface ValidationRunListResponse {
  total: number;
  items: ValidationRun[];
}

export interface RuleCatalogItem {
  rule_id: string;
  severity: FindingSeverity;
  name: string;
  description: string;
}
