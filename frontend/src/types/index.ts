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

// ---------------------------------------------------------------------------
// FASE 3: Clientes, Personas Jurídicas y Expedientes
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  dpi: string;
  nit?: string | null;
  marital_status?: string | null;
  profession?: string | null;
  nationality: string;
  birth_date?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  dpi: string;
  nit?: string;
  marital_status?: string;
  profession?: string;
  nationality?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ClientUpdate {
  first_name?: string;
  last_name?: string;
  nit?: string;
  marital_status?: string;
  profession?: string;
  nationality?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface ClientListResponse {
  total: number;
  items: Client[];
}

export interface LegalEntity {
  id: string;
  business_name: string;
  trade_name?: string | null;
  nit: string;
  society_type: string;
  registry_number?: string | null;
  registry_folio?: string | null;
  registry_book?: string | null;
  legal_representative_id?: string | null;
  representative_position?: string | null;
  legal_representative?: Client | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LegalEntityCreate {
  business_name: string;
  trade_name?: string;
  nit: string;
  society_type?: string;
  registry_number?: string;
  registry_folio?: string;
  registry_book?: string;
  legal_representative_id?: string;
  representative_position?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface LegalEntityListResponse {
  total: number;
  items: LegalEntity[];
}

export type CaseType =
  | "COMPRAVENTA"
  | "DONACION"
  | "ARRENDAMIENTO"
  | "MATRIMONIO"
  | "SOCIEDAD";

export type CaseStatus =
  | "ABIERTO"
  | "EN_REVISION"
  | "PENDIENTE"
  | "FINALIZADO"
  | "CANCELADO";

export type PartyRole =
  | "COMPRADOR"
  | "VENDEDOR"
  | "DONANTE"
  | "DONATARIO"
  | "ARRENDADOR"
  | "ARRENDATARIO"
  | "CONTRAYENTE"
  | "SOCIO"
  | "REPRESENTANTE_LEGAL"
  | "TESTIGO"
  | "INTERPRETE"
  | "OTRO";

export interface CaseParty {
  id: string;
  case_id: string;
  client_id: string;
  party_role: PartyRole;
  notes?: string | null;
  order_index: number;
  client?: Client | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  case_type: CaseType;
  status: CaseStatus;
  title: string;
  description?: string | null;
  internal_notes?: string | null;
  instrument_number?: string | null;
  protocol_folio?: string | null;
  protocol_book?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  assigned_user_id?: string | null;
  parties: CaseParty[];
  created_at: string;
  updated_at: string;
}

export interface CaseCreate {
  title: string;
  case_type: CaseType;
  description?: string;
  internal_notes?: string;
  instrument_number?: string;
  protocol_folio?: string;
  protocol_book?: string;
  assigned_user_id?: string;
  parties?: { client_id: string; party_role: PartyRole; notes?: string; order_index?: number }[];
}

export interface CaseUpdate {
  title?: string;
  description?: string;
  internal_notes?: string;
  status?: CaseStatus;
  instrument_number?: string;
  protocol_folio?: string;
  protocol_book?: string;
  assigned_user_id?: string;
}

export interface CaseListResponse {
  total: number;
  items: Case[];
}

export interface AddPartyRequest {
  client_id: string;
  party_role: PartyRole;
  notes?: string;
  order_index?: number;
}

// ---------------------------------------------------------------------------
// FASE 5: Repositorio y Versionamiento de Plantillas DOCX
// ---------------------------------------------------------------------------

export type DocxVersionStatus = "BORRADOR" | "ACTIVA" | "ARCHIVADA";

export interface TemplateFieldInfo {
  id: string;
  key: string;
  label: string;
  field_type: string;
  required: boolean;
  docx_variable?: string | null;
  auto_detected: boolean;
  display_order: number;
}

export interface TemplateVersionInfo {
  id: string;
  template_id: string;
  version_number: number;
  status: string;
  has_file: boolean;
  original_filename?: string | null;
  file_hash?: string | null;
  file_size?: number | null;
  notes?: string | null;
  uploaded_by_id?: string | null;
  created_at: string;
  fields: TemplateFieldInfo[];
}

export interface TemplateSummary {
  id: string;
  name: string;
  case_type: CaseType;
  description?: string | null;
  status: string;
  versions_count: number;
  active_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateListResponse {
  total: number;
  items: TemplateSummary[];
}

export interface TemplateDetail extends TemplateSummary {
  versions: TemplateVersionInfo[];
}

export interface PreviewResult {
  file_name: string;
  placeholders_free: boolean;
  residual_variables: string[];
  download_url: string;
}

// ---------------------------------------------------------------------------
// FASE 6: Motor de Reglas Notariales (RULE-001..RULE-020)
// ---------------------------------------------------------------------------

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