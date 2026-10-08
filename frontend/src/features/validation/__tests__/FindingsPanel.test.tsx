import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FindingsPanel, countBySeverity, filterBySeverity } from "../FindingsPanel";
import type { ValidationFinding } from "../types";

/**
 * Pruebas del Panel de Inconsistencias Notariales (Fase 6):
 * resumen por severidad, filtrado interactivo, comparación de
 * valor actual vs. esperado y acción "Ir al campo".
 */

const fixtureFindings: ValidationFinding[] = [
  {
    rule_id: "RULE-004",
    severity: "CRITICAL",
    field_key: "comprador_dpi",
    message: "El DPI del comprador no coincide con el registrado en el expediente.",
    current_value: "1234567890102",
    expected_value: "1234567890101",
    location: "Comparecencia — COMPRADOR",
  },
  {
    rule_id: "RULE-012",
    severity: "ERROR",
    field_key: "departamento_inmueble",
    message: "El departamento indicado no existe en el catálogo oficial de Guatemala.",
    current_value: "NARNIA",
    expected_value: "Departamento válido (22 en catálogo)",
    location: "Datos registrales",
  },
  {
    rule_id: "RULE-013",
    severity: "WARNING",
    field_key: "municipio_inmueble",
    message: "El municipio no consta en el catálogo; verifique la ortografía.",
    current_value: "XUL",
    expected_value: "Municipio del catálogo oficial",
    location: "Datos registrales",
  },
];

describe("helpers de severidad", () => {
  it("countBySeverity totaliza por nivel", () => {
    const counts = countBySeverity(fixtureFindings);
    expect(counts).toEqual({ CRITICAL: 1, ERROR: 1, WARNING: 1, INFO: 0 });
  });

  it("filterBySeverity filtra o devuelve todo", () => {
    expect(filterBySeverity(fixtureFindings, "ALL")).toHaveLength(3);
    expect(filterBySeverity(fixtureFindings, "CRITICAL")).toHaveLength(1);
    expect(filterBySeverity(fixtureFindings, "CRITICAL")[0].rule_id).toBe("RULE-004");
  });
});

describe("FindingsPanel", () => {
  it("muestra el estado limpio cuando no hay hallazgos", () => {
    render(<FindingsPanel findings={[]} />);
    expect(screen.getByTestId("findings-empty")).toBeInTheDocument();
    expect(screen.getByText(/Documento consistente/)).toBeInTheDocument();
  });

  it("renderiza cada hallazgo con regla, mensaje y comparación de valores", () => {
    render(<FindingsPanel findings={fixtureFindings} />);

    expect(screen.getByText("RULE-004")).toBeInTheDocument();
    expect(screen.getByText(/El DPI del comprador no coincide/)).toBeInTheDocument();
    expect(screen.getByText("1234567890102")).toBeInTheDocument();
    expect(screen.getByText("1234567890101")).toBeInTheDocument();
    expect(screen.getByText(/Comparecencia — COMPRADOR/)).toBeInTheDocument();

    // Contadores de los filtros
    expect(screen.getByRole("button", { name: /Todas \(3\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crítico \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Error \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Advertencia \(1\)/ })).toBeInTheDocument();
  });

  it("filtra los hallazgos al pulsar un nivel de severidad", async () => {
    const user = userEvent.setup();
    render(<FindingsPanel findings={fixtureFindings} />);

    await user.click(screen.getByRole("button", { name: /Crítico \(1\)/ }));
    expect(screen.getByText("RULE-004")).toBeInTheDocument();
    expect(screen.queryByText("RULE-012")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Todas \(3\)/ }));
    expect(screen.getByText("RULE-012")).toBeInTheDocument();
  });

  it("dispara la acción 'Ir al campo' con el field_key del hallazgo", async () => {
    const onGoToField = vi.fn();
    const user = userEvent.setup();
    render(<FindingsPanel findings={fixtureFindings} onGoToField={onGoToField} />);

    const buttons = screen.getAllByRole("button", { name: /Ir al campo/i });
    await user.click(buttons[0]);
    expect(onGoToField).toHaveBeenCalledWith("comprador_dpi");
  });
});
