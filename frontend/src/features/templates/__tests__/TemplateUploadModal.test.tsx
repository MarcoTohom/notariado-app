import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateUploadModal, validateTemplateFile } from "../TemplateUploadModal";

/**
 * Pruebas del modal de carga de plantillas DOCX (Fase 5):
 * validación en cliente del archivo (extensión, tamaño) y de los
 * metadatos (nombre obligatorio), y construcción del FormData.
 */

const renderModal = (onSave = vi.fn().mockResolvedValue(undefined)) => {
  render(<TemplateUploadModal isOpen={true} onClose={() => {}} onSave={onSave} />);
  return onSave;
};

const docxFile = (name = "compraventa.docx", size = 2048) => {
  const file = new File(["contenido"], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("validateTemplateFile (reglas de seguridad de carga)", () => {
  it("exige un archivo", () => {
    expect(validateTemplateFile(null)).toMatch(/Selecciona un archivo/);
  });

  it("rechaza extensiones distintas de .docx", () => {
    expect(validateTemplateFile(new File(["x"], "plantilla.doc"))).toMatch(/\.docx/);
    expect(validateTemplateFile(new File(["x"], "plantilla.pdf"))).toMatch(/\.docx/);
  });

  it("rechaza archivos vacíos y mayores de 10 MB", () => {
    expect(validateTemplateFile(docxFile("vacio.docx", 0))).toMatch(/vacío/);
    expect(validateTemplateFile(docxFile("grande.docx", 11 * 1024 * 1024))).toMatch(/10 MB/);
  });

  it("acepta un .docx válido", () => {
    expect(validateTemplateFile(docxFile())).toBeNull();
  });
});

describe("TemplateUploadModal", () => {
  it("renderiza los campos del formulario de carga", () => {
    renderModal();
    expect(screen.getByLabelText(/Nombre de la Plantilla/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de Escritura/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Archivo DOCX/)).toBeInTheDocument();
  });

  it("muestra errores al enviar sin nombre ni archivo", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Cargar Plantilla/i }));

    expect(await screen.findByText(/al menos 3 caracteres/)).toBeInTheDocument();
    expect(screen.getByText(/Selecciona un archivo .docx/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rechaza un archivo con extensión distinta de .docx", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nombre de la Plantilla/), "Compraventa Base");
    // fireEvent.change: el archivo .txt llega al validador propio sin el filtro de `accept`
    fireEvent.change(screen.getByLabelText(/Archivo DOCX/), {
      target: { files: [new File(["x"], "plantilla.txt", { type: "text/plain" })] },
    });
    await user.click(screen.getByRole("button", { name: /Cargar Plantilla/i }));

    expect(await screen.findByText(/Solo se permiten archivos con extensión .docx/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("envía el FormData completo cuando todo es válido", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nombre de la Plantilla/), "Compraventa Base");
    await user.selectOptions(screen.getByLabelText(/Tipo de Escritura/), "COMPRAVENTA");
    await user.upload(screen.getByLabelText(/Archivo DOCX/), docxFile());
    await user.click(screen.getByRole("button", { name: /Cargar Plantilla/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const formData = onSave.mock.calls[0][0] as FormData;
    expect(formData.get("name")).toBe("Compraventa Base");
    expect(formData.get("case_type")).toBe("COMPRAVENTA");
    expect((formData.get("file") as File).name).toBe("compraventa.docx");
  });
});
