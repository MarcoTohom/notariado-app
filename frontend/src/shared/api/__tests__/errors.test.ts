import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage } from "../errors";

const errorResponse = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Error sintético", undefined, config, undefined, {
    status,
    statusText: "Error",
    data,
    headers: new AxiosHeaders(),
    config,
  });
};

describe("mensajes comunes de API", () => {
  it("conserva el detalle textual de FastAPI", () => {
    expect(getApiErrorMessage(errorResponse(409, { detail: "Revisión obsoleta." }))).toBe(
      "Revisión obsoleta.",
    );
  });

  it("agrupa los mensajes de validación 422", () => {
    expect(getApiErrorMessage(errorResponse(422, {
      detail: [{ msg: "Campo obligatorio." }, { msg: "Formato inválido." }],
    }))).toBe("Campo obligatorio. Formato inválido.");
  });

  it("explica un rechazo de permisos sin detalle", () => {
    expect(getApiErrorMessage(errorResponse(403, {}))).toBe(
      "No tienes permisos para realizar esta acción.",
    );
  });

  it("distingue la falta de conexión de una respuesta HTTP", () => {
    expect(getApiErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      "No se pudo conectar con el servidor.",
    );
  });

  it("conserva el mensaje alternativo de la operación para errores ordinarios", () => {
    expect(getApiErrorMessage(new Error("Error sintético"), "No se pudo guardar.")).toBe(
      "No se pudo guardar.",
    );
  });

  it("no muestra detalles vacíos ni objetos arbitrarios", () => {
    expect(getApiErrorMessage(errorResponse(500, { detail: "  " }), "Fallo de revisión.")).toBe(
      "Fallo de revisión.",
    );
    expect(getApiErrorMessage(errorResponse(500, { detail: { internal: true } }))).toBe(
      "Ocurrió un error inesperado.",
    );
  });
});
