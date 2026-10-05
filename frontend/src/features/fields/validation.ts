import { z } from "zod";
import { FieldDefinition, Values } from "./types";

export function normalizeText(text: string) {
  return text.normalize("NFC").trim().replace(/\s+/g, " ");
}
export function maskDigits(value: string, mask?: string | null) {
  if (!mask) return value;
  const digits = value.replace(/\D/g, "");
  let i = 0;
  let result = "";
  for (const char of mask) {
    if (i >= digits.length) break;
    result += char === "0" ? digits[i++] : char;
  }
  // Preserve extra digits so validation can report overflow instead of truncating.
  return result + digits.slice(i);
}
export function fixedMoney(value: string) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) return value;
  const [integer, fraction = ""] = value.split(".");
  return `${integer}.${fraction.padEnd(2, "0")}`;
}
export function displayMoney(value: string, currency = "GTQ") {
  const fixed = fixedMoney(value);
  const [integer, fraction] = fixed.split(".");
  return `${currency === "USD" ? "$" : "Q"} ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction === undefined ? "" : `.${fraction}`}`;
}
function compareDecimal(a: string, b: string) {
  const scale = (x: string) => {
    const negative = x.startsWith("-");
    const [n, d = ""] = x.replace(/^-/, "").split(".");
    return BigInt(n + d.padEnd(12, "0")) * (negative ? -1n : 1n);
  };
  const aa = scale(a),
    bb = scale(b);
  return aa < bb ? -1 : aa > bb ? 1 : 0;
}

export function fieldError(f: FieldDefinition, value: unknown): string | null {
  if (f.calculated || f.field_type === "computed") return null;
  const blank =
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim());
  if (blank)
    return f.required || (value !== undefined && f.nullable === false)
      ? "Campo obligatorio o no admite nulos."
      : null;
  const kind = f.field_type;
  if (kind === "boolean")
    return typeof value === "boolean" ? null : "Seleccione verdadero o falso.";
  if (kind === "list") {
    if (!Array.isArray(value) || value.length > 100)
      return "Ingrese una lista de hasta 100 elementos.";
    if ((f.required && !value.length) || value.length < (f.min_length ?? 0))
      return "Agregue los elementos requeridos.";
    if (f.max_length != null && value.length > f.max_length)
      return "Demasiados elementos.";
    return null;
  }
  let text =
    typeof value === "string" ? value.trim().normalize("NFC") : String(value);
  if (["integer", "decimal", "currency", "percentage"].includes(kind)) {
    if (!/^-?\d{1,24}(?:\.\d{1,12})?$/.test(text))
      return "Número inválido (máximo 24 enteros y 12 decimales).";
    if (kind === "integer" && !/^-?\d+(?:\.0+)?$/.test(text))
      return "Ingrese un número entero.";
    if (
      kind === "integer" &&
      (compareDecimal(text, "9007199254740991") > 0 ||
        compareDecimal(text, "-9007199254740991") < 0)
    )
      return "Entero fuera del rango interoperable.";
    if (kind === "currency" && (text.split(".")[1]?.length ?? 0) > 2)
      return "Use como máximo dos decimales.";
    const min = f.min_value ?? (kind === "percentage" ? "0" : null);
    const max = f.max_value ?? (kind === "percentage" ? "100" : null);
    if (
      (min !== null && compareDecimal(text, min) < 0) ||
      (max !== null && compareDecimal(text, max) > 0)
    )
      return "Valor fuera del rango permitido.";
    return null;
  }
  if (typeof value !== "string" || text.length > 10000)
    return "Ingrese texto (máximo 10000 caracteres).";
  if (kind === "text" || kind === "name") text = normalizeText(text);
  if (kind === "name" && !/^[\p{L} '\-’]+$/u.test(text))
    return "El nombre solo admite letras, espacios, guiones y apóstrofes.";
  if (kind === "dpi") {
    text = text.replace(/[\s-]/g, "");
    if (!/^[0-9]{13}$/.test(text)) return "Formato de DPI inválido.";
  }
  if (kind === "nit") {
    text = text.replace(/[\s-]/g, "").toUpperCase();
    if (!/^(?:[0-9]{1,12}[0-9K]|CF)$/.test(text))
      return "Formato de NIT inválido.";
  }
  if (kind === "phone") {
    text = text.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{8,15}$/.test(text)) return "Formato de PHONE inválido.";
  }
  if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
    return "Correo electrónico inválido.";
  if (kind === "date" || kind === "datetime") {
    const dateText = text.slice(0, 10);
    const parsed = new Date(`${dateText}T12:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateText) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== dateText ||
      (kind === "date" && text.length !== 10) ||
      (kind === "datetime" &&
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/.test(text))
    )
      return "Fecha inválida; use formato ISO local.";
    if (
      (f.min_value && text < f.min_value) ||
      (f.max_value && text > f.max_value)
    )
      return "Fecha fuera del rango permitido.";
  }
  if (
    kind === "select" &&
    !f.options_json?.choices?.some(
      (o) => o.value === text && o.active !== false,
    )
  )
    return "Seleccione una opción activa del catálogo.";
  if (f.min_length != null && text.length < f.min_length)
    return "No alcanza la longitud mínima.";
  if (f.max_length != null && text.length > f.max_length)
    return "Supera la longitud máxima.";
  if (f.regex && !new RegExp(`^(?:${f.regex})$`).test(text))
    return "El valor no cumple el formato configurado.";
  return null;
}

export function formSchema(fields: FieldDefinition[]) {
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    const walk = (
      defs: FieldDefinition[],
      data: Values,
      prefix: (string | number)[] = [],
    ) => {
      for (const f of defs.filter((d) => d.active !== false)) {
        const value = data[f.key];
        const message = fieldError(f, value);
        const path = [...prefix, f.key];
        if (message) ctx.addIssue({ code: "custom", path, message });
        if (f.field_type === "list" && Array.isArray(value))
          value.forEach((item, index) => {
            if (!item || typeof item !== "object" || Array.isArray(item))
              ctx.addIssue({
                code: "custom",
                path: [...path, index],
                message: "Cada elemento debe ser un objeto.",
              });
            else walk(f.options_json?.fields || [], item, [...path, index]);
          });
        const other = f.options_json?.compare_to;
        if (
          !message &&
          other &&
          value != null &&
          value !== "" &&
          data[other] != null &&
          data[other] !== "" &&
          !fieldError(
            defs.find((d) => d.key === other)!,
            data[other],
          )
        ) {
          const a = String(value),
            b = String(data[other]);
          const cmp = ["integer", "decimal", "currency", "percentage"].includes(
            f.field_type,
          )
            ? compareDecimal(a, b)
            : a.localeCompare(b);
          if (f.options_json?.comparison === "le" ? cmp > 0 : cmp < 0)
            ctx.addIssue({
              code: "custom",
              path,
              message: "No cumple la comparación con el otro campo.",
            });
        }
      }
    };
    walk(fields, values);
  });
}

export function defaults(
  fields: FieldDefinition[],
  supplied: Values = {},
): Values {
  return Object.fromEntries(
    fields
      .filter((f) => f.active !== false)
      .map((f) => {
        let value =
          supplied[f.key] ??
          f.default_value ??
          (f.field_type === "list"
            ? []
            : f.field_type === "boolean"
              ? false
              : "");
        if (f.field_type === "list" && Array.isArray(value))
          value = value.map((item) =>
            defaults(f.options_json?.fields || [], item),
          );
        return [f.key, value];
      }),
  );
}
