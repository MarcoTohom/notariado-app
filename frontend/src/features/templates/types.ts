import type { CaseType } from "../../shared/types";

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
