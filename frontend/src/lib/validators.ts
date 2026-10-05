import { z } from "zod";

/**
 * Esquemas de validación del lado del cliente (Zod).
 * Espejan las reglas Pydantic del backend y los invariantes notariales:
 * - DPI: SIEMPRE string de exactamente 13 dígitos numéricos (nunca entero).
 * - NIT: SIEMPRE string (formato guatemalteco con guion, o "CF").
 */

export const DPI_REGEX = /^\d{13}$/;
export const NIT_REGEX = /^(\d{4,15}-?[\dkK]|CF)$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Campo de texto opcional: acepta "" (se limpia antes de enviar) o ausencia. */
const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().or(z.literal(""));

// ---------------------------------------------------------------------------
// Cliente (persona individual)
// ---------------------------------------------------------------------------

export const clientSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "Los nombres deben tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  last_name: z
    .string()
    .trim()
    .min(2, "Los apellidos deben tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  dpi: z
    .string()
    .trim()
    .regex(DPI_REGEX, "El DPI debe contener exactamente 13 dígitos numéricos"),
  nit: optionalText(20).refine(
    (v) => !v || NIT_REGEX.test(v.toUpperCase()),
    "Formato de NIT inválido (ej. 1234567-8 o CF)"
  ),
  marital_status: optionalText(30),
  profession: optionalText(100),
  nationality: z.string().trim().min(1, "La nacionalidad es obligatoria").max(50),
  birth_date: optionalText(10).refine(
    (v) => !v || DATE_REGEX.test(v),
    "Formato de fecha inválido (YYYY-MM-DD)"
  ),
  address: optionalText(300),
  phone: optionalText(20),
  email: optionalText(100).refine(
    (v) => !v || EMAIL_REGEX.test(v),
    "Formato de correo electrónico inválido"
  ),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

// ---------------------------------------------------------------------------
// Persona jurídica
// ---------------------------------------------------------------------------

export const legalEntitySchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "La razón social debe tener al menos 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  trade_name: optionalText(200),
  nit: z
    .string()
    .trim()
    .min(1, "El NIT es obligatorio")
    .max(20, "Máximo 20 caracteres")
    .refine((v) => NIT_REGEX.test(v.toUpperCase()), "Formato de NIT inválido (ej. 1234567-8)"),
  society_type: z.string().trim().min(1, "Selecciona el tipo de sociedad"),
  registry_number: optionalText(50),
  registry_folio: optionalText(30),
  registry_book: optionalText(30),
  representative_position: optionalText(100),
  address: optionalText(300),
  phone: optionalText(20),
  email: optionalText(100).refine(
    (v) => !v || EMAIL_REGEX.test(v),
    "Formato de correo electrónico inválido"
  ),
});

export type LegalEntityFormValues = z.infer<typeof legalEntitySchema>;

// ---------------------------------------------------------------------------
// Expediente notarial
// ---------------------------------------------------------------------------

export const CASE_TYPES = [
  "COMPRAVENTA",
  "DONACION",
  "ARRENDAMIENTO",
  "MATRIMONIO",
  "SOCIEDAD",
] as const;

export const caseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(250, "Máximo 250 caracteres"),
  case_type: z.enum(CASE_TYPES),
  description: optionalText(1000),
  internal_notes: optionalText(1000),
  instrument_number: optionalText(30),
  protocol_folio: optionalText(30),
  protocol_book: optionalText(30),
});

export type CaseFormValues = z.infer<typeof caseSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte cadenas vacías a undefined para no enviar campos opcionales vacíos. */
export const cleanOptional = (v?: string): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
};

/** Normaliza una entrada de DPI: solo dígitos, máximo 13. */
export const maskDpiInput = (raw: string): string => raw.replace(/\D/g, "").slice(0, 13);
