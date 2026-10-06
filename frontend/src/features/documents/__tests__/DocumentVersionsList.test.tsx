import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentVersionsList } from "../DocumentVersionsList";
import { DocumentVersionInfo } from "../../../types";

/**
 * Pruebas del historial inmutable de versiones de borradores (US-07.3):
 * estado de verificación, hash, tamaño, notas y descarga autenticada.
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

  it("muestra la versión verificada con hash, tamaño y enlace de descarga", () => {
    render(<DocumentVersionsList versions={[makeVersion({ notes: "Revisión inicial" })]} />);

    expect(screen.getByText("Versión v1")).toBeInTheDocument();
    expect(screen.getByText(/Verificada — sin placeholders/)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256: a453ec90eab9…/)).toBeInTheDocument();
    expect(screen.getByText("24.0 KB")).toBeInTheDocument();
    expect(screen.getByText("Revisión inicial")).toBeInTheDocument();

    const download = screen.getByRole("link", { name: /Descargar/ });
    expect(download).toHaveAttribute("href", "/api/v1/documents/versions/v1/download");
    expect(download).toHaveAttribute("download");
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
    expect(screen.getAllByRole("link", { name: /Descargar/ })).toHaveLength(2);
  });
});
