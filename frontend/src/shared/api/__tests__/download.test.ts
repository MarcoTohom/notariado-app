import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { downloadAuthenticated, filenameFromDisposition } from "../client";

/**
 * Descarga autenticada de archivos protegidos por JWT.
 *
 * Un `<a href download>` no envía la cabecera `Authorization`, por lo que el
 * backend responde 401 y el navegador no entrega el DOCX. Estas pruebas
 * comprueban que la descarga pide el binario con el cliente autenticado,
 * respeta el nombre enviado por el backend y falla de forma legible.
 */

const clickSpy = vi.fn();

describe("filenameFromDisposition", () => {
  it("prioriza la forma UTF-8 de Content-Disposition", () => {
    // "borrador v1 - copia ñ" codificado en UTF-8 por FastAPI.
    const header =
      "attachment; filename=borrador_v1.docx; filename*=UTF-8''borrador%20v1%20-%20copia%20%C3%B1.docx";
    expect(filenameFromDisposition(header)).toBe("borrador v1 - copia ñ.docx");
  });

  it("usa filename entre comillas cuando no hay forma UTF-8", () => {
    expect(filenameFromDisposition('attachment; filename="borrador_v2.docx"')).toBe(
      "borrador_v2.docx",
    );
  });

  it("acepta filename sin comillas", () => {
    expect(filenameFromDisposition("attachment; filename=borrador_v3.docx")).toBe(
      "borrador_v3.docx",
    );
  });

  it("devuelve null sin cabecera o sin nombre", () => {
    expect(filenameFromDisposition(undefined)).toBeNull();
    expect(filenameFromDisposition("attachment")).toBeNull();
  });

  it("no lanza con un valor UTF-8 malformado", () => {
    expect(() => filenameFromDisposition("attachment; filename*=UTF-8''%E0%A4%A")).not.toThrow();
  });
});

describe("downloadAuthenticated", () => {
  let link: { href: string; download: string; rel: string; click: () => void };
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy.mockClear();
    link = { href: "", download: "", rel: "", click: clickSpy };
    createObjectURL = vi.fn().mockReturnValue("blob:mock");
    revokeObjectURL = vi.fn();
    // El setup global define los stubs; aquí se reemplazan por spies para poder
    // verificar la creación y revocación del objeto blob.
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: revokeObjectURL,
    });
    vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(document.body);
    vi.spyOn(document.body, "removeChild").mockReturnValue(document.body);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("quita el prefijo /api/v1 duplicado que devuelve el backend", async () => {
    const { apiClient, normalizeDownloadUrl } = await import("../client");

    // El backend ya entrega "/api/v1/..." y axios lo antepondría otra vez.
    expect(normalizeDownloadUrl("/api/v1/documents/versions/v1/download")).toBe(
      "/documents/versions/v1/download",
    );
    expect(normalizeDownloadUrl("/api/v1/templates/preview-files/x.docx")).toBe(
      "/templates/preview-files/x.docx",
    );
    // Una ruta sin prefijo se usa tal cual.
    expect(normalizeDownloadUrl("/documents/versions/v1/download")).toBe(
      "/documents/versions/v1/download",
    );
    // Una URL absoluta se respeta íntegra.
    expect(normalizeDownloadUrl("http://127.0.0.1:8000/api/v1/documents/versions/v1/download")).toBe(
      "http://127.0.0.1:8000/api/v1/documents/versions/v1/download",
    );
    expect(String(apiClient.defaults.baseURL)).toBe("/api/v1");
  });

  it("no duplica el prefijo al pedir un borrador del backend", async () => {
    const { apiClient } = await import("../client");
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: new Blob(["docx"]),
      headers: { "content-type": "application/octet-stream" },
      status: 200,
    } as never);

    // download_url tal como lo devuelve la API (con /api/v1 incluido).
    await downloadAuthenticated(
      "/api/v1/documents/versions/6450a5a2-2651-40b7-8926-6ee998d791d9/download",
      "borrador_v5.docx",
    );

    expect(get).toHaveBeenCalledWith(
      "/documents/versions/6450a5a2-2651-40b7-8926-6ee998d791d9/download",
      expect.objectContaining({ responseType: "blob" }),
    );
  });

  it("pide el binario y dispara la descarga con el nombre del backend", async () => {
    const blob = new Blob(["contenido"], { type: "application/msword" });
    const { apiClient } = await import("../client");
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: blob,
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": 'attachment; filename="borrador_v4.docx"',
      },
      status: 200,
    } as never);

    // Reloj controlado desde antes de la llamada: la revocación de la URL del
    // objeto está diferida con setTimeout(1000) en el código de producción.
    vi.useFakeTimers();
    await downloadAuthenticated("/api/v1/documents/versions/v1/download", "borrador_v1.docx");
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();

    expect(get).toHaveBeenCalledWith(
      "/documents/versions/v1/download",
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(link.href).toBe("blob:mock");
    expect(link.download).toBe("borrador_v4.docx");
    // Tras avanzar el reloj, la URL del objeto se revoca (no queda retenida).
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("usa el nombre de reserva cuando el backend no envía Content-Disposition", async () => {
    const { apiClient } = await import("../client");
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: new Blob(["x"]),
      headers: { "content-type": "application/octet-stream" },
      status: 200,
    } as never);

    await downloadAuthenticated("/api/v1/templates/preview-files/x.docx", "vista_previa.docx");

    expect(link.download).toBe("vista_previa.docx");
    expect(link.rel).toBe("noopener");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("propaga el error del backend cuando la respuesta es JSON", async () => {
    const { apiClient } = await import("../client");
    const detail = "No se encontraron datos para exportar.";
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: new Blob([JSON.stringify({ detail })], { type: "application/json" }),
      headers: { "content-type": "application/json" },
      status: 200,
    } as never);

    await expect(
      downloadAuthenticated("/api/v1/experiment/export.xlsx", "experimento.xlsx"),
    ).rejects.toThrow(detail);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("no dispara descarga si la petición falla (401 sin token)", async () => {
    const { apiClient } = await import("../client");
    vi.spyOn(apiClient, "get").mockRejectedValue(
      Object.assign(new Error("Request failed with status code 401"), {
        isAxiosError: true,
        response: { status: 401, data: { detail: "No autenticado." } },
      }),
    );

    await expect(
      downloadAuthenticated("/api/v1/documents/versions/x/download", "borrador.docx"),
    ).rejects.toThrow();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("usa la misma ruta para el DOCX de prueba de plantilla", async () => {
    const { apiClient } = await import("../client");
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: new Blob(["docx"]),
      headers: { "content-type": "application/octet-stream" },
      status: 200,
    } as never);

    await downloadAuthenticated(
      "/api/v1/templates/preview-files/17c46ea9-edd5-4840-aeb1-22ae995e0e46.docx",
      "vista_previa_1.docx",
    );

    expect(get).toHaveBeenCalledWith(
      "/templates/preview-files/17c46ea9-edd5-4840-aeb1-22ae995e0e46.docx",
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
