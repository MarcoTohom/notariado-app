import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentVersionsList } from "../DocumentVersionsList";
import type { DocumentVersionInfo } from "../types";

// La descarga se delega en el cliente autenticado; aquí se aísla para verificar
// que el componente la invoca con la ruta y el nombre de reserva correctos.
const mocks = vi.hoisted(() => ({ downloadAuthenticated: vi.fn() }));
vi.mock("../../../shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../shared/api/client")>()),
  downloadAuthenticated: mocks.downloadAuthenticated,
}));
const downloadMock = mocks.downloadAuthenticated;

beforeEach(() => {
  downloadMock.mockReset();
});

/**
 * Pruebas del historial inmutable de versiones de borradores (US-07.3):
 * estado de verificación, hash, tamaño, notas y descarga autenticada.
 *
 * La descarga se hace por el cliente autenticado (no un `<a href>`, que no
 * enviaría el JWT y recibiría 401 del backend).
 */

const makeVersion = (overrides: Partial<DocumentVersionInfo> = {}): DocumentVersionInfo => ({
  id: "v1",
  document_id: "doc1",
  version_number: 1,
  template_version_id: "tv1",
  template_name: "Compraventa Base",
  validation_status: "OK",
  placeholders_free: true,
  residual_variables: [],
  file_hash: "a453ec90eab9c1d2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
  file_size: 24576,
  notes: null,
  created_by_id: "u1",
  download_url: "/api/v1/documents/versions/v1/download",
  created_at: "2026-10-05T04:30:00",
  ...overrides,
});

describe("DocumentVersionsList", () => {
  it("muestra el estado vacío cuando no hay versiones", () => {
    render(<DocumentVersionsList versions={[]} />);
    expect(screen.getByText(/Aún no hay versiones generadas/)).toBeInTheDocument();
  });

  it("muestra la versión verificada con hash, tamaño y botón de descarga", () => {
    render(<DocumentVersionsList versions={[makeVersion({ notes: "Revisión inicial" })]} />);

    expect(screen.getByText("Versión v1")).toBeInTheDocument();
    expect(screen.getByText(/Verificada — sin placeholders/)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256: a453ec90eab9…/)).toBeInTheDocument();
    expect(screen.getByText("24.0 KB")).toBeInTheDocument();
    expect(screen.getByText("Revisión inicial")).toBeInTheDocument();

    // Es un botón (no un enlace) porque la descarga requiere la cabecera JWT.
    const download = screen.getByRole("button", { name: /Descargar/ });
    expect(download).toHaveAttribute("type", "button");
    expect(download).not.toHaveAttribute("href");
  });

  it("descarga con el cliente autenticado al pulsar el botón", async () => {
    const user = userEvent.setup();
    downloadMock.mockResolvedValue(undefined);

    render(<DocumentVersionsList versions={[makeVersion()]} />);
    await user.click(screen.getByRole("button", { name: /Descargar/ }));

    await waitFor(() => expect(downloadMock).toHaveBeenCalledTimes(1));
    expect(downloadMock).toHaveBeenCalledWith(
      "/api/v1/documents/versions/v1/download",
      "borrador_v1.docx",
    );
  });

  it("muestra un mensaje legible cuando la descarga falla", async () => {
    const user = userEvent.setup();
    downloadMock.mockRejectedValue(
      Object.assign(new Error("fallo"), {
        isAxiosError: true,
        response: { status: 401, data: { detail: "No autenticado." } },
      }),
    );

    render(<DocumentVersionsList versions={[makeVersion()]} />);
    await user.click(screen.getByRole("button", { name: /Descargar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No autenticado.");
  });

  it("alerta cuando la versión quedó con placeholders residuales", () => {
    render(
      <DocumentVersionsList
        versions={[
          makeVersion({
            validation_status: "ERROR_PLACEHOLDERS_PENDIENTES",
            placeholders_free: false,
            residual_variables: ["vendedor.nit", "precio"],
          }),
        ]}
      />
    );

    expect(screen.getByText(/Placeholders pendientes \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/\{\{ vendedor.nit \}\}/)).toBeInTheDocument();
  });

  it("ordena el historial con múltiples versiones sin sobrescribir", () => {
    render(
      <DocumentVersionsList
        versions={[
          makeVersion({ id: "v2", version_number: 2, notes: "Corregida" }),
          makeVersion({ id: "v1", version_number: 1, notes: "Inicial" }),
        ]}
      />
    );
    expect(screen.getByText("Versión v2")).toBeInTheDocument();
    expect(screen.getByText("Versión v1")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Descargar/ })).toHaveLength(2);
  });
});
