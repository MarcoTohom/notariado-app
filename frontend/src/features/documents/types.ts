export interface DocumentVersionInfo {
  id: string;
  document_id: string;
  version_number: number;
  template_version_id: string;
  template_name?: string | null;
  validation_status: "OK" | "ERROR_PLACEHOLDERS_PENDIENTES";
  placeholders_free: boolean;
  residual_variables: string[];
  file_hash: string;
  file_size: number;
  notes?: string | null;
  created_by_id: string;
  download_url?: string | null;
  created_at: string;
}

export interface DocumentSummary {
  id: string;
  case_id: string;
  case_number?: string | null;
  title: string;
  status: string;
  versions_count: number;
  latest_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  total: number;
  items: DocumentSummary[];
}

export interface DocumentDetail extends DocumentSummary {
  versions: DocumentVersionInfo[];
}
