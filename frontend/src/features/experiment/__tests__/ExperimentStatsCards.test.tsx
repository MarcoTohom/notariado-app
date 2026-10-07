import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExperimentStatsCards } from "../ExperimentStatsCards";
import { ExperimentStats } from "../../../types";

/**
 * Pruebas del Dashboard Experimental (Fase 11):
 * las métricas mostradas derivan de corridas reales — nunca valores fijos.
 */

const baseStats: ExperimentStats = {
  baseline_minutes: 240,
  baseline_source: "MEDICIONES",
  traditional: {
    n: 4,
    mean_seconds: 13200,
    std_seconds: 600,
    ci95_seconds: 588,
    mean_minutes: 220,
    errors_found: 30,
    errors_missed: 20,
    normality: { W: 0.98, p_value: 0.91, normal: true },
  },
  system: {
    n: 4,
    mean_seconds: 3300,
    std_seconds: 240,
    ci95_seconds: 235.2,
    mean_minutes: 55,
    errors_found: 50,
    errors_missed: 0,
    normality: { W: 0.97, p_value: 0.87, normal: true },
  },
  traditional_mean_minutes_used: 220,
  reduction_percentage: 75.0,
  paired_test: {
    test: "t_student_pareada",
    pairs: 4,
    statistic: 12.5,
    p_value: 0.001,
    alpha: 0.05,
    significant: true,
  },
  cases_total: 100,
  cases_with_anomalies: 50,
  executions_total: 8,
};

describe("ExperimentStatsCards", () => {
  it("muestra medias, reducción calculada y decisión de hipótesis", () => {
    render(<ExperimentStatsCards stats={baseStats} />);

    // μ tradicional usada aparece en "Línea Base" y en "μ Tradicional".
    expect(screen.getAllByText("220").length).toBeGreaterThan(0);
    expect(screen.getByText("55")).toBeInTheDocument(); // μ sistema
    expect(screen.getByTestId("reduction-value")).toHaveTextContent("75%");
    expect(screen.getByTestId("hypothesis-decision")).toHaveTextContent(/rechaza H₀/);
    expect(screen.getByText(/t_student_pareada/)).toBeInTheDocument();
  });

  it("muestra errores detectados y omitidos por método", () => {
    render(<ExperimentStatsCards stats={baseStats} />);
    expect(screen.getByText("30")).toBeInTheDocument(); // tradicional detectadas
    expect(screen.getByText("20")).toBeInTheDocument(); // tradicional omitidas
    expect(screen.getByText("50")).toBeInTheDocument(); // sistema detectadas
    expect(screen.getByText("0")).toBeInTheDocument(); // sistema omitidas
  });

  it("sin corridas SYSTEM la reducción no se inventa", () => {
    const empty: ExperimentStats = {
      ...baseStats,
      baseline_source: "HISTORICA",
      system: {
        n: 0,
        mean_seconds: null,
        std_seconds: null,
        ci95_seconds: null,
        mean_minutes: null,
        errors_found: 0,
        errors_missed: 0,
        normality: null,
      },
      reduction_percentage: null,
      paired_test: null,
    };
    render(<ExperimentStatsCards stats={empty} />);

    expect(screen.getByTestId("reduction-value")).toHaveTextContent("—");
    expect(screen.getByText(/Requiere corridas SYSTEM/)).toBeInTheDocument();
    expect(screen.getByText(/Histórica \(240 min\)/)).toBeInTheDocument();
    expect(screen.queryByTestId("hypothesis-decision")).not.toBeInTheDocument();
  });

  it("ofrece enlaces de exportación XLSX y CSV", () => {
    render(<ExperimentStatsCards stats={baseStats} />);
    const xlsx = screen.getByRole("link", { name: /Exportar XLSX/ });
    const csv = screen.getByRole("link", { name: /Exportar CSV/ });
    expect(xlsx).toHaveAttribute("href", "/api/v1/experiment/export.xlsx");
    expect(csv).toHaveAttribute("href", "/api/v1/experiment/export.csv");
  });
});
