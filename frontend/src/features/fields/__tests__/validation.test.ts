import { describe, expect, it } from "vitest";
import {
  defaults,
  displayMoney,
  fieldError,
  fixedMoney,
  formSchema,
  maskDigits,
} from "../validation";
import { FieldDefinition } from "../types";

const field = (
  field_type: FieldDefinition["field_type"],
  rest: Partial<FieldDefinition> = {},
): FieldDefinition => ({ key: "a", label: "A", field_type, ...rest });
describe("Validación sincronizada de campos", () => {
  it.each([
    ["text", "dos palabras"],
    ["textarea", "texto\nlargo"],
    ["name", "María de la Peña"],
    ["dpi", "0000 00000 0101"],
    ["nit", "00123-k"],
    ["phone", "+502 5555-0101"],
    ["email", "sintetico@example.com"],
    ["integer", "12"],
    ["decimal", "0.123456789012"],
    ["currency", "999999999999999999.01"],
    ["percentage", "100"],
    ["date", "2024-02-29"],
    ["datetime", "2026-10-04T13:45"],
    ["boolean", false],
    ["richtext", "<strong>Hola</strong>"],
  ] as const)("acepta %s", (kind, value) =>
    expect(fieldError(field(kind), value)).toBeNull(),
  );
  it.each([
    ["dpi", "123"],
    ["nit", "12-X"],
    ["name", "Nombre123"],
    ["phone", "123"],
    ["email", "invalido"],
    ["integer", "1.1"],
    ["currency", "1.001"],
    ["decimal", "NaN"],
    ["percentage", "100.01"],
    ["date", "2025-02-29"],
    ["datetime", "2026-10-04"],
    ["boolean", "false"],
  ] as const)("rechaza %s inválido", (kind, value) =>
    expect(fieldError(field(kind), value)).not.toBeNull(),
  );
  it("conserva precisión, máscara, ceros iniciales y dos decimales", () => {
    expect(fixedMoney("999999999999999999.1")).toBe("999999999999999999.10");
    expect(displayMoney("123456789012345.67")).toBe("Q 123,456,789,012,345.67");
    expect(displayMoney("1.2", "USD")).toBe("$ 1.20");
    expect(maskDigits("0000000000101", "0000 00000 0000")).toBe(
      "0000 00000 0101",
    );
    expect(
      fieldError(
        field("currency", { max_value: "999999999999999999.00" }),
        "999999999999999999.01",
      ),
    ).not.toBeNull();
  });
  it("valida objetos de listas y reporta su ruta", () => {
    const schema = formSchema([
      field("list", {
        key: "bienes",
        options_json: { fields: [field("dpi", { required: true })] },
      }),
    ]);
    const result = schema.safeParse({ bienes: [{ a: "123" }] });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual(["bienes", 0, "a"]);
  });
  it("respeta catálogos, fechas comparadas, límites y predeterminados", () => {
    expect(
      fieldError(
        field("select", {
          options_json: {
            choices: [{ value: "x", label: "X", active: false }],
          },
        }),
        "x",
      ),
    ).not.toBeNull();
    expect(
      fieldError(field("text", { regex: "[A-Z]+" }), "abc"),
    ).not.toBeNull();
    expect(
      defaults([
        field("boolean"),
        field("currency", { key: "monto", default_value: "0.10" }),
      ]),
    ).toEqual({ a: false, monto: "0.10" });
    const schema = formSchema([
      field("date", { key: "inicio" }),
      field("date", { key: "fin", options_json: { compare_to: "inicio" } }),
    ]);
    expect(
      schema.safeParse({ inicio: "2026-10-04", fin: "2026-10-03" }).success,
    ).toBe(false);
  });
});
