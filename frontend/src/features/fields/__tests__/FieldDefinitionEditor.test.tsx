import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldDefinitionEditor } from "../FieldDefinitionEditor";
import { FieldDefinition } from "../types";
import { newField } from "../editor/defaults";

function show(initial: FieldDefinition[], depth = 0) {
  const changed = vi.fn();
  function Harness() {
    const [fields, setFields] = useState(initial);
    return <FieldDefinitionEditor depth={depth} fields={fields} onChange={(next) => { changed(next); setFields(next); }} />;
  }
  render(<Harness />);
  return { user: userEvent.setup(), changed };
}

describe("FieldDefinitionEditor dividido", () => {
  it("edita catálogos y restricciones conservando opciones y metadatos previos", async () => {
    const definition: FieldDefinition = { ...newField(1), field_type: "select", help_text: "Ayuda previa", options_json: { lowercase: false, choices: [{ label: "Uno", value: "uno", order: 4, active: true }] } };
    const { user, changed } = show([definition]);
    await user.clear(screen.getByLabelText("Etiqueta de opción 1"));
    await user.type(screen.getByLabelText("Etiqueta de opción 1"), "Sintética");
    await user.click(screen.getByLabelText("Activa", { exact: true }));
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    await user.click(screen.getByRole("button", { name: "Restricciones y ayuda" }));
    await user.type(screen.getByLabelText("Valor predeterminado"), "uno");
    expect(changed).toHaveBeenLastCalledWith([{ ...definition, default_value: "uno", options_json: { lowercase: false, choices: [{ label: "Sintética", value: "uno", order: 4, active: false }, { label: "Nueva opción", value: "opcion_2", order: 1, active: true }] } }]);
    await user.click(screen.getByRole("button", { name: "Quitar opción 2" }));
    expect(screen.queryByLabelText("Etiqueta de opción 2")).not.toBeInTheDocument();
  });

  it("aplica restricciones como texto monetario y convierte solo las longitudes", async () => {
    const definition: FieldDefinition = { ...newField(1), field_type: "currency", options_json: { currency: "USD" } };
    const { user, changed } = show([definition]);
    await user.click(screen.getByRole("button", { name: "Restricciones y ayuda" }));
    await user.type(screen.getByLabelText("Valor mínimo (o fecha ISO)"), "000.10");
    await user.type(screen.getByLabelText("Longitud / elementos mínimos"), "2");
    expect(changed).toHaveBeenLastCalledWith([{ ...definition, min_value: "000.10", min_length: 2 }]);
    await user.clear(screen.getByLabelText("Longitud / elementos mínimos"));
    expect(changed).toHaveBeenLastCalledWith([{ ...definition, min_value: "000.10", min_length: null }]);
  });

  it("conserva las decisiones de tipo y reinicia el autocompletado al cambiar de fuente", async () => {
    const { user, changed } = show([newField(1)]);
    await user.selectOptions(screen.getByLabelText("Tipo de campo"), "computed");
    expect(screen.getByLabelText("Solo lectura")).toBeDisabled();
    expect(changed).toHaveBeenLastCalledWith([{ ...newField(1), field_type: "computed", calculated: true, readonly: true, source: "manual", calculation_expression: "0", options_json: {} }]);
    await user.selectOptions(screen.getByLabelText("Tipo de campo"), "relation");
    await user.selectOptions(screen.getByLabelText("Buscar en"), "cases");
    expect(changed).toHaveBeenLastCalledWith([{ ...newField(1), field_type: "relation", calculated: false, readonly: false, source: "cases", calculation_expression: null, options_json: { autofill: {} } }]);
  });

  it("edita listas anidadas sin perder opciones del padre y reordena definiciones", async () => {
    const parent: FieldDefinition = { ...newField(1), label: "Bienes", field_type: "list", options_json: { max_bytes: 123, fields: [{ ...newField(1), label: "Descripción" }] } };
    const { user, changed } = show([parent, { ...newField(2), label: "Monto" }]);
    const child = screen.getByRole("group", { name: "1. Descripción" });
    await user.clear(within(child).getByLabelText("Etiqueta", { exact: true }));
    await user.type(within(child).getByLabelText("Etiqueta", { exact: true }), "Detalle");
    const updated = { ...parent, options_json: { ...parent.options_json, fields: [{ ...newField(1), label: "Detalle" }] } };
    expect(changed).toHaveBeenLastCalledWith([updated, { ...newField(2), label: "Monto" }]);
    const sibling = screen.getByRole("group", { name: "2. Monto" });
    await user.click(within(sibling).getByRole("button", { name: "Subir campo" }));
    expect(changed).toHaveBeenLastCalledWith([{ ...newField(2), label: "Monto", display_order: 0 }, { ...updated, display_order: 1 }]);
    await user.click(within(screen.getByRole("group", { name: "1. Monto" })).getByRole("button", { name: "Eliminar campo" }));
    expect(screen.getByRole("group", { name: "1. Bienes" })).toBeInTheDocument();
  });

  it("mantiene el límite de anidación y genera claves nuevas sin duplicarlas", async () => {
    const { user, changed } = show([newField(2)], 3);
    expect(within(screen.getByLabelText("Tipo de campo")).queryByRole("option", { name: "Lista de elementos" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar campo al elemento" }));
    expect(changed).toHaveBeenLastCalledWith([newField(2), newField(3)]);
  });
});
