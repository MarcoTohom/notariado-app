import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicForm } from "../DynamicForm";
import { CONTROLS } from "../FieldControls";
import { fieldsApi } from "../api";
import { clientService } from "../../clients/api";
import { FIELD_TYPES, FieldDefinition, FormVersion } from "../types";

const field = (
  key: string,
  type: FieldDefinition["field_type"],
  rest: Partial<FieldDefinition> = {},
): FieldDefinition => ({ key, label: key, field_type: type, ...rest });
function show(fields: FieldDefinition[], values = {}, readOnly = false) {
  const version: FormVersion = {
    id: "version",
    template_id: "template",
    version_number: 1,
    name: "Prueba",
    case_type: "COMPRAVENTA",
    fields,
  };
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DynamicForm
        version={version}
        caseId="case"
        initial={{ values, errors: [], revision: 0 }}
        readOnly={readOnly}
      />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(fieldsApi, "validate").mockImplementation(
    async (_case, _version, values) => ({ values, errors: [] }),
  );
  vi.spyOn(fieldsApi, "save").mockImplementation(
    async (_case, _version, values, revision) => ({
      values,
      errors: [],
      revision: revision + 1,
    }),
  );
});
describe("DynamicForm", () => {
  it("registra controles para los veinte tipos", () =>
    expect(Object.keys(CONTROLS).sort()).toEqual([...FIELD_TYPES].sort()));
  it("impide guardar DPI inválido y muestra ayuda y errores", async () => {
    show([
      field("dpi", "dpi", { required: true, help_text: "Use 13 dígitos" }),
    ]);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/dpi/), "123");
    await user.click(screen.getByText("Guardar datos"));
    expect(
      await screen.findByText("Formato de DPI inválido."),
    ).toBeInTheDocument();
    expect(screen.getByText("Use 13 dígitos")).toBeInTheDocument();
    expect(fieldsApi.save).not.toHaveBeenCalled();
  });
  it("edita, reordena y elimina objetos de listas antes de persistir", async () => {
    show([
      field("bienes", "list", {
        options_json: { fields: [field("nombre", "text", { required: true })] },
      }),
    ]);
    const user = userEvent.setup();
    await user.click(screen.getByText("Agregar bienes"));
    await user.type(screen.getByLabelText(/nombre/), "Uno");
    await user.click(screen.getByText("Agregar bienes"));
    await user.type(screen.getAllByLabelText(/nombre/)[1], "Dos");
    await user.click(screen.getByLabelText("Subir bienes 2"));
    expect(screen.getAllByLabelText(/nombre/)[0]).toHaveValue("Dos");
    await user.click(screen.getByLabelText("Eliminar bienes 2"));
    await user.click(screen.getByText("Guardar datos"));
    await waitFor(() =>
      expect(fieldsApi.save).toHaveBeenCalledWith(
        "case",
        "version",
        { bienes: [{ nombre: "Dos" }] },
        0,
      ),
    );
    expect(
      await screen.findByText("Datos guardados y validados."),
    ).toBeInTheDocument();
  });
  it("formatea moneda sin perder precisión y respeta solo lectura", async () => {
    show([
      field("monto", "currency"),
      field("total", "computed", { calculation_expression: "monto" }),
    ]);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("monto"), "999999999999999999.1");
    await user.tab();
    expect(screen.getByLabelText("monto")).toHaveValue("999999999999999999.10");
    expect(screen.getByLabelText("total")).toHaveAttribute("readonly");
    expect(
      screen.getByText("Q 999,999,999,999,999,999.10"),
    ).toBeInTheDocument();
  });
  it("selecciona el ID del cliente y aplica los valores autoritativos", async () => {
    vi.spyOn(clientService, "getClients").mockResolvedValue({
      total: 1,
      items: [{ id: "client", first_name: "María", last_name: "Sintética" }],
    } as Awaited<ReturnType<typeof clientService.getClients>>);
    vi.spyOn(clientService, "getClient").mockResolvedValue({
      id: "client",
      first_name: "María",
      last_name: "Sintética",
    } as Awaited<ReturnType<typeof clientService.getClient>>);
    vi.mocked(fieldsApi.validate).mockImplementation(
      async (_c, _v, values) => ({
        values: { ...values, dpi: values.cliente ? "0000000000101" : null },
        errors: [],
      }),
    );
    show([
      field("cliente", "relation", {
        source: "clients",
        options_json: { autofill: { dpi: "dpi" } },
      }),
      field("dpi", "dpi"),
    ]);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("option", { name: "María Sintética" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("dpi")).toHaveValue("0000000000101"),
    );
    expect(screen.getByLabelText("dpi")).toBeDisabled();
    await user.click(screen.getByText("Guardar datos"));
    await waitFor(() =>
      expect(fieldsApi.save).toHaveBeenCalledWith(
        "case",
        "version",
        expect.objectContaining({ cliente: "client", dpi: "0000000000101" }),
        0,
      ),
    );
  });
  it("carga un archivo y lo descarga mediante el cliente autenticado", async () => {
    vi.spyOn(fieldsApi, "upload").mockResolvedValue({
      id: "file",
      name: "sintetico.csv",
    });
    vi.spyOn(fieldsApi, "download").mockResolvedValue();
    show([field("archivo", "file")]);
    const user = userEvent.setup();
    await user.upload(
      screen.getByLabelText("archivo"),
      new File(["a,b\n1,2"], "sintetico.csv", { type: "text/csv" }),
    );
    await user.click(await screen.findByText("Descargar archivo"));
    expect(fieldsApi.download).toHaveBeenCalledWith("case", "file");
    await user.click(screen.getByText("Guardar datos"));
    await waitFor(() =>
      expect(fieldsApi.save).toHaveBeenCalledWith(
        "case",
        "version",
        { archivo: "file" },
        0,
      ),
    );
  });
  it("deshabilita campos y acciones de escritura en vista de lectura", () => {
    show(
      [
        field("nombre", "text"),
        field("lista", "list", {
          options_json: { fields: [field("item", "text")] },
        }),
      ],
      {},
      true,
    );
    expect(screen.getByLabelText("nombre")).toBeDisabled();
    expect(screen.getByText("Agregar lista")).toBeDisabled();
    expect(screen.queryByText("Guardar datos")).not.toBeInTheDocument();
  });
  it("muestra errores de guardado sin afirmar éxito", async () => {
    vi.mocked(fieldsApi.save).mockRejectedValue(new Error("sin conexión"));
    show([field("nombre", "text")]);
    const user = userEvent.setup();
    await user.click(screen.getByText("Guardar datos"));
    await waitFor(() =>
      expect(
        within(screen.getByRole("alert")).getByText(
          "Ocurrió un error inesperado.",
        ),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("Datos guardados y validados."),
    ).not.toBeInTheDocument();
  });
});
