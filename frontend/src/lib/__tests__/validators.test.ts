import { describe, expect, it } from "vitest";
import {
  caseSchema,
  cleanOptional,
  clientSchema,
  legalEntitySchema,
  maskDpiInput,
} from "../validators";

/**
 * Pruebas de los invariantes notariales del lado del cliente:
 * - DPI siempre string de exactamente 13 dígitos numéricos.
 * - NIT siempre string con formato guatemalteco.
 * Estas reglas espejan los validadores Pydantic del backend.
 */

const validClient = {
  first_name: "María Fernanda",
  last_name: "López García",
  dpi: "1234567890101",
  nit: "1234567-8",
  marital_status: "CASADO",
  profession: "Ingeniera",
  nationality: "GUATEMALTECA",
  birth_date: "1990-05-14",
  address: "Zona 10, Ciudad de Guatemala",
  phone: "55551234",
  email: "maria.lopez@example.com",
};

describe("clientSchema — invariante DPI (13 dígitos, texto)", () => {
  it("acepta un DPI válido de 13 dígitos", () => {
    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it("rechaza DPI de 12 dígitos", () => {
    const result = clientSchema.safeParse({ ...validClient, dpi: "123456789012" });
    expect(result.success).toBe(false);
  });

  it("rechaza DPI de 14 dígitos", () => {
    const result = clientSchema.safeParse({ ...validClient, dpi: "12345678901234" });
    expect(result.success).toBe(false);
  });

  it("rechaza DPI con letras o espacios", () => {
    expect(clientSchema.safeParse({ ...validClient, dpi: "123456789010A" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...validClient, dpi: "1234 5678 90101" }).success).toBe(false);
  });

  it("rechaza DPI vacío", () => {
    expect(clientSchema.safeParse({ ...validClient, dpi: "" }).success).toBe(false);
  });
});

describe("clientSchema — invariante NIT (texto, formato guatemalteco)", () => {
  it("acepta NIT con guion, sin guion y CF", () => {
    expect(clientSchema.safeParse({ ...validClient, nit: "1234567-8" }).success).toBe(true);
    expect(clientSchema.safeParse({ ...validClient, nit: "12345678" }).success).toBe(true);
    expect(clientSchema.safeParse({ ...validClient, nit: "CF" }).success).toBe(true);
  });

  it("acepta NIT vacío u omitido (opcional)", () => {
    expect(clientSchema.safeParse({ ...validClient, nit: "" }).success).toBe(true);
    const { nit: _omit, ...sinNit } = validClient;
    expect(clientSchema.safeParse(sinNit).success).toBe(true);
  });

  it("rechaza NIT con formato inválido", () => {
    expect(clientSchema.safeParse({ ...validClient, nit: "ABC-1" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...validClient, nit: "12" }).success).toBe(false);
  });
});

describe("clientSchema — otros campos", () => {
  it("rechaza nombres de un solo carácter", () => {
    expect(clientSchema.safeParse({ ...validClient, first_name: "M" }).success).toBe(false);
  });

  it("rechaza correo electrónico inválido", () => {
    expect(clientSchema.safeParse({ ...validClient, email: "no-es-correo" }).success).toBe(false);
  });

  it("rechaza fecha de nacimiento con formato incorrecto", () => {
    expect(clientSchema.safeParse({ ...validClient, birth_date: "14/05/1990" }).success).toBe(false);
  });
});

describe("legalEntitySchema", () => {
  const validEntity = {
    business_name: "Inversiones del Valle, S.A.",
    trade_name: "Invevalle",
    nit: "7654321-9",
    society_type: "SOCIEDAD_ANONIMA",
    registry_number: "12345",
    registry_folio: "250",
    registry_book: "12",
    representative_position: "Gerente General",
    address: "Zona 9",
    phone: "22334455",
    email: "info@invevalle.example.com",
  };

  it("acepta una persona jurídica válida", () => {
    expect(legalEntitySchema.safeParse(validEntity).success).toBe(true);
  });

  it("exige NIT obligatorio", () => {
    expect(legalEntitySchema.safeParse({ ...validEntity, nit: "" }).success).toBe(false);
  });

  it("rechaza razón social muy corta", () => {
    expect(legalEntitySchema.safeParse({ ...validEntity, business_name: "X" }).success).toBe(false);
  });
});

describe("caseSchema", () => {
  it("acepta un expediente válido", () => {
    const result = caseSchema.safeParse({
      title: "Compraventa de inmueble Lote 12",
      case_type: "COMPRAVENTA",
      description: "",
      internal_notes: "",
      instrument_number: "",
      protocol_folio: "",
      protocol_book: "",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza título menor a 5 caracteres", () => {
    expect(
      caseSchema.safeParse({ title: "ABC", case_type: "COMPRAVENTA" }).success
    ).toBe(false);
  });

  it("rechaza tipo de escritura fuera del catálogo", () => {
    expect(
      caseSchema.safeParse({ title: "Título válido", case_type: "PODER_SIMPLE" }).success
    ).toBe(false);
  });
});

describe("helpers de limpieza", () => {
  it("cleanOptional convierte cadenas vacías a undefined", () => {
    expect(cleanOptional("")).toBeUndefined();
    expect(cleanOptional("   ")).toBeUndefined();
    expect(cleanOptional(undefined)).toBeUndefined();
    expect(cleanOptional("  valor ")).toBe("valor");
  });

  it("maskDpiInput conserva solo dígitos y limita a 13", () => {
    expect(maskDpiInput("1234-5678 90101")).toBe("1234567890101");
    expect(maskDpiInput("123456789012345678")).toBe("1234567890123");
    expect(maskDpiInput("abc")).toBe("");
  });
});
