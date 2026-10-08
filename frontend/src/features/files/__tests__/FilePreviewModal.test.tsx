import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilePreviewModal } from "../FilePreviewModal";
import { FileInventoryItem } from "../../../types";

/**
 * Pruebas del modal de vista previa de archivos (WP-05):
 * texto, tabla, estado no disponible (sin OCR) y cierre, sin descargar.
 */

const mocks = vi.hoisted(() => ({ getPreview: vi.fn() }));
vi.mock("../../../services/api", () => ({
  fileService: { getPreview: mocks.getPreview },
}));

const renderModal = (item: FileInventoryItem | null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FilePreviewModal item={item} onClose={() => {}} />
    </QueryClientProvider>
  );
};

const baseItem: FileInventoryItem = {
  kind: "TEMPLATE_VERSION",
  record_id: "abc-123",
  file_name: "plantilla_compraventa.docx",
  reference: "Plantilla v1 (ACTIVA)",
  logical_path: "uploads/templates/abc-123.docx",
  db_size: 24576,
  db_hash: "hash",
  previewable: true,
  created_at: "2026-10-07T00:00:00",
  exists_on_disk: true,
  size_on_disk: 24576,
  size_matches_db: true,
  hash_matches_db: true,
  status: "OK",
};

describe("FilePreviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza nada sin item seleccionado", () => {
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el texto extraído del documento", async () => {
    mocks.getPreview.mockResolvedValue({
      file_name: "plantilla_compraventa.docx",
      kind: "TEMPLATE_VERSION",
      media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      preview_type: "text",
      content: "ESCRITURA PÚBLICA No. 151\nCOMPARECE: Ana Lucía Morales",
      truncated: false,
    });
    renderModal(baseItem);

    expect(await screen.findByTestId("file-preview-text")).toHaveTextContent(
      /ESCRITURA PÚBLICA No. 151/
    );
    expect(screen.getByText(/Vista previa \(sin descarga\)/)).toBeInTheDocument();
    // No hay enlace de descarga: solo lectura en modal.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("muestra el estado no disponible para PDF escaneado sin OCR", async () => {
    mocks.getPreview.mockResolvedValue({
      file_name: "certificacion.pdf",
      kind: "ATTACHMENT",
      media_type: "application/pdf",
      preview_type: "unavailable",
      content: "EXTRACCION_NO_DISPONIBLE_SIN_OCR",
      truncated: false,
    });
    renderModal({ ...baseItem, kind: "ATTACHMENT", file_name: "certificacion.pdf" });

    expect(
      await screen.findByText(/EXTRACCION_NO_DISPONIBLE_SIN_OCR/)
    ).toBeInTheDocument();
  });

  it("renderiza tabla para hojas CSV", async () => {
    mocks.getPreview.mockResolvedValue({
      file_name: "clientes.csv",
      kind: "ATTACHMENT",
      media_type: "text/csv",
      preview_type: "table",
      content: {
        columns: ["nombre", "dpi"],
        rows: [["Ana", "1234567890101"]],
      },
      truncated: false,
    });
    renderModal({ ...baseItem, kind: "ATTACHMENT", file_name: "clientes.csv" });

    expect(await screen.findByText("nombre")).toBeInTheDocument();
    expect(screen.getByText("1234567890101")).toBeInTheDocument();
  });
});
