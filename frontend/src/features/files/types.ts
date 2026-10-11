export type FileKind = "TEMPLATE_VERSION" | "ATTACHMENT" | "DOCUMENT_VERSION" | "PREVIEW";
export type FilePersistenceStatus = "OK" | "NO_ENCONTRADO" | "DIFIERE";

export interface FileInventoryItem {
  kind: FileKind;
  record_id: string;
  file_name: string;
  reference: string;
  logical_path: string;
  db_size?: number | null;
  db_hash?: string | null;
  previewable: boolean;
  created_at: string;
  exists_on_disk: boolean;
  size_on_disk?: number | null;
  size_matches_db: boolean;
  hash_matches_db?: boolean | null;
  status: FilePersistenceStatus;
}

export interface FileInventoryResponse {
  total: number;
  items: FileInventoryItem[];
}

export interface FilePreviewResponse {
  file_name: string;
  kind: FileKind;
  media_type: string;
  preview_type: "text" | "table" | "unavailable";
  content: string | { columns: string[]; rows: string[][] };
  truncated: boolean;
}
