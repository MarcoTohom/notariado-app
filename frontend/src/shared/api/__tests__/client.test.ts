import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "../client";
import { authService } from "../../../features/auth/api";
import { systemService } from "../../../features/dashboard/api";
import { clientService } from "../../../features/clients/api";
import { caseService } from "../../../features/cases/api";
import { documentService } from "../../../features/documents/api";
import { validationService } from "../../../features/validation/api";
import { templateService } from "../../../features/templates/api";
import { fieldsApi } from "../../../features/fields/api";

const requests: InternalAxiosRequestConfig[] = [];
const originalAdapter = apiClient.defaults.adapter;
const adapter: AxiosAdapter = async (config) => {
  requests.push(config);
  return {
    data: { synthetic: true },
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
};

beforeEach(() => {
  requests.length = 0;
  localStorage.clear();
  apiClient.defaults.adapter = adapter;
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("transporte compartido entre funcionalidades", () => {
  it("lee la sesión vigente en cada petición y deja de enviarla al cerrarla", async () => {
    localStorage.setItem("notariado_token", "sesion-sintetica-1");
    await systemService.getHealth();
    localStorage.setItem("notariado_token", "sesion-sintetica-2");
    await authService.getMe();
    localStorage.removeItem("notariado_token");
    await clientService.getClients();

    expect(requests.map((request) => request.headers.get("Authorization"))).toEqual([
      "Bearer sesion-sintetica-1",
      "Bearer sesion-sintetica-2",
      undefined,
    ]);
  });

  it("conserva los ceros del DPI y NIT en el JSON de captura", async () => {
    await clientService.createClient({
      first_name: "Persona",
      last_name: "Sintética",
      dpi: "0012345678901",
      nit: "0012345-K",
    });

    expect(requests[0].method).toBe("post");
    expect(requests[0].url).toBe("/clients");
    expect(JSON.parse(requests[0].data)).toMatchObject({
      dpi: "0012345678901",
      nit: "0012345-K",
    });
    expect(requests[0].headers.get("Content-Type")).toBe("application/json");
  });

  it("preserva paginación y omite los filtros vacíos de expedientes", async () => {
    await caseService.getCases(0, 20, "", "", "");
    expect(apiClient.getUri(requests[0])).toBe("/api/v1/cases?skip=0&limit=20");

    await caseService.getCases(20, 10, "sintético", "COMPRAVENTA", "ABIERTO");
    const query = new URL(apiClient.getUri(requests[1]), "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({
      skip: "20",
      limit: "10",
      search: "sintético",
      case_type: "COMPRAVENTA",
      status: "ABIERTO",
    });
  });

  it("mantiene los valores decimales como texto y las opciones de generación", async () => {
    await validationService.runValidation("exp-sintetico", "version-sintetica", {
      precio: "100.10",
    });
    await documentService.generate("exp-sintetico");

    expect(JSON.parse(requests[0].data)).toEqual({
      case_id: "exp-sintetico",
      template_version_id: "version-sintetica",
      values: { precio: "100.10" },
    });
    expect(requests[1].url).toBe("/documents/generate");
    expect(JSON.parse(requests[1].data)).toEqual({ case_id: "exp-sintetico" });
  });

  it("transporta FormData sin convertirlo a JSON en plantillas y adjuntos", async () => {
    const file = new File(["columna\nsintético"], "sintetico.csv", { type: "text/csv" });
    const form = new FormData();
    form.append("file", file);
    await templateService.uploadTemplate(form);
    await fieldsApi.upload("exp-sintetico", "version-sintetica", "archivo", file);

    expect(requests[0].data).toBe(form);
    expect(requests[0].headers.get("Content-Type")).toBe("multipart/form-data");
    expect(requests[1].data).toBeInstanceOf(FormData);
    expect(requests[1].data.get("file")).toBe(file);
    expect(requests[1].params).toEqual({ field: "archivo" });
    expect(requests[1].url).toBe("/fields/cases/exp-sintetico/versions/version-sintetica/files");
  });

  it("respeta la URL pública configurada y conserva el tiempo máximo de espera", async () => {
    vi.stubEnv("VITE_API_URL", "http://127.0.0.1:8012/api/v1");
    vi.resetModules();
    const { apiClient: configuredClient } = await import("../client");
    expect(configuredClient.getUri({ url: "/health" })).toBe("http://127.0.0.1:8012/api/v1/health");
    expect(configuredClient.defaults.timeout).toBe(10000);
  });
});
