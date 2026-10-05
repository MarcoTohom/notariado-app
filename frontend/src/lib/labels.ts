import { CaseStatus, CaseType, PartyRole } from "../types";

/**
 * Catálogos de etiquetas en español para los enumerados del dominio notarial.
 * Centralizados para mantener consistencia visual en toda la interfaz.
 */

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  COMPRAVENTA: "Compraventa de Inmueble",
  DONACION: "Donación entre Vivos",
  ARRENDAMIENTO: "Arrendamiento",
  MATRIMONIO: "Protocolación de Matrimonio",
  SOCIEDAD: "Constitución de Sociedad",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  ABIERTO: "Abierto",
  EN_REVISION: "En Revisión",
  PENDIENTE: "Pendiente",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  ABIERTO: "bg-brand-50 text-brand-700 border-brand-200",
  EN_REVISION: "bg-amber-50 text-amber-700 border-amber-200",
  PENDIENTE: "bg-orange-50 text-orange-700 border-orange-200",
  FINALIZADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELADO: "bg-slate-100 text-slate-500 border-slate-300",
};

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  DONANTE: "Donante",
  DONATARIO: "Donatario",
  ARRENDADOR: "Arrendador",
  ARRENDATARIO: "Arrendatario",
  CONTRAYENTE: "Contrayente",
  SOCIO: "Socio",
  REPRESENTANTE_LEGAL: "Representante Legal",
  TESTIGO: "Testigo",
  INTERPRETE: "Intérprete",
  OTRO: "Otro",
};

/**
 * Roles sugeridos según el tipo de escritura (Art. 29 Código de Notariado):
 * el select de comparecientes los presenta primero sin excluir los demás.
 */
export const SUGGESTED_ROLES_BY_CASE_TYPE: Record<CaseType, PartyRole[]> = {
  COMPRAVENTA: ["COMPRADOR", "VENDEDOR", "TESTIGO"],
  DONACION: ["DONANTE", "DONATARIO", "TESTIGO"],
  ARRENDAMIENTO: ["ARRENDADOR", "ARRENDATARIO", "TESTIGO"],
  MATRIMONIO: ["CONTRAYENTE", "TESTIGO"],
  SOCIEDAD: ["SOCIO", "REPRESENTANTE_LEGAL", "TESTIGO"],
};

export const MARITAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "SOLTERO", label: "Soltero(a)" },
  { value: "CASADO", label: "Casado(a)" },
  { value: "DIVORCIADO", label: "Divorciado(a)" },
  { value: "VIUDO", label: "Viudo(a)" },
  { value: "UNION_DE_HECHO", label: "Unión de hecho" },
];

export const SOCIETY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "SOCIEDAD_ANONIMA", label: "Sociedad Anónima (S.A.)" },
  { value: "SOCIEDAD_RESPONSABILIDAD_LIMITADA", label: "Sociedad de Responsabilidad Limitada (Ltda.)" },
  { value: "SOCIEDAD_COLECTIVA", label: "Sociedad Colectiva" },
  { value: "ASOCIACION", label: "Asociación" },
  { value: "FUNDACION", label: "Fundación" },
  { value: "OTRO", label: "Otro" },
];

export const SOCIETY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SOCIETY_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

export const MARITAL_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  MARITAL_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

/** Estados del versionamiento inmutable de plantillas DOCX (Fase 5). */
export const DOCX_VERSION_STATUS_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  ACTIVA: "Activa",
  ARCHIVADA: "Archivada",
  FIELD_DEFINITION: "Definición de campos",
};

export const DOCX_VERSION_STATUS_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVADA: "bg-slate-100 text-slate-500 border-slate-300",
  FIELD_DEFINITION: "bg-brand-50 text-brand-700 border-brand-200",
};
