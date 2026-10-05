export const FIELD_TYPES = [
  "text",
  "textarea",
  "name",
  "dpi",
  "nit",
  "phone",
  "email",
  "integer",
  "decimal",
  "currency",
  "percentage",
  "date",
  "datetime",
  "boolean",
  "select",
  "relation",
  "file",
  "list",
  "computed",
  "richtext",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export type Values = Record<string, unknown>;
export interface FieldDefinition {
  key: string;
  label: string;
  field_type: FieldType;
  required?: boolean;
  nullable?: boolean;
  default_value?: unknown;
  min_length?: number | null;
  max_length?: number | null;
  min_value?: string | null;
  max_value?: string | null;
  regex?: string | null;
  mask?: string | null;
  format?: string | null;
  options_json?: {
    choices?: {
      label: string;
      value: string;
      active?: boolean;
      order?: number;
    }[];
    fields?: FieldDefinition[];
    autofill?: Record<string, string>;
    extensions?: string[];
    max_bytes?: number;
    lowercase?: boolean;
    currency?: "GTQ" | "USD";
    compare_to?: string | null;
    comparison?: "ge" | "le";
  };
  source?: "manual" | "clients" | "cases";
  source_reference?: string | null;
  readonly?: boolean;
  calculated?: boolean;
  calculation_expression?: string | null;
  docx_variable?: string | null;
  display_order?: number;
  help_text?: string | null;
  active?: boolean;
}
export interface FormVersion {
  id: string;
  template_id: string;
  version_number: number;
  name: string;
  case_type: string;
  fields: FieldDefinition[];
}
export interface FieldIssue {
  path: string;
  message: string;
}
export interface ValidationResult {
  values: Values;
  errors: FieldIssue[];
}
export interface SavedValues extends ValidationResult {
  revision: number;
}

export const TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto",
  textarea: "Texto largo",
  name: "Nombre",
  dpi: "DPI (CUI)",
  nit: "NIT",
  phone: "Teléfono",
  email: "Correo",
  integer: "Entero",
  decimal: "Decimal",
  currency: "Moneda",
  percentage: "Porcentaje",
  date: "Fecha",
  datetime: "Fecha y hora",
  boolean: "Sí / No",
  select: "Catálogo",
  relation: "Registro relacionado",
  file: "Archivo",
  list: "Lista de elementos",
  computed: "Cálculo",
  richtext: "Texto con formato",
};
