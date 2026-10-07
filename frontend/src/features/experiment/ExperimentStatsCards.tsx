import React from "react";
import { ExperimentStats } from "../../types";
import { experimentService } from "../../services/api";
import { Download, TrendingDown, FlaskConical, Sigma, Clock, AlertCircle } from "lucide-react";

/**
 * Dashboard experimental (Fase 11): métricas calculadas EXCLUSIVAMENTE desde
 * corridas reales. La reducción deriva de la fórmula oficial:
 * ((μ_tradicional − μ_sistema) / μ_tradicional) × 100.
 */
export const ExperimentStatsCards: React.FC<{ stats: ExperimentStats }> = ({ stats }) => {
  const { traditional, system, paired_test: paired } = stats;

  return (
    <div className="space-y-4" data-testid="experiment-stats">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Línea Base
          </p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {stats.traditional_mean_minutes_used} <span className="text-xs font-semibold">min</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {stats.baseline_source === "HISTORICA"
              ? `Histórica (${stats.baseline_minutes} min)`
              : `De ${traditional.n} medición(es) tradicionales`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> μ Tradicional
          </p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {traditional.mean_minutes ?? "—"}
            {traditional.mean_minutes != null && <span className="text-xs font-semibold"> min</span>}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            n={traditional.n} • σ={traditional.std_seconds ?? "—"}s
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> μ Sistema
          </p>
          <p className="text-xl font-extrabold text-brand-700 mt-1">
            {system.mean_minutes ?? "—"}
            {system.mean_minutes != null && <span className="text-xs font-semibold"> min</span>}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            n={system.n} • IC95 ±{system.ci95_seconds ?? "—"}s
          </p>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            stats.reduction_percentage != null
              ? "bg-emerald-50 border-emerald-200"
              : "bg-white border-slate-200"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Reducción
          </p>
          <p
            className={`text-xl font-extrabold mt-1 ${
              stats.reduction_percentage != null ? "text-emerald-700" : "text-slate-400"
            }`}
            data-testid="reduction-value"
          >
            {stats.reduction_percentage != null ? `${stats.reduction_percentage}%` : "—"}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {stats.reduction_percentage != null ? "Meta experimental: ~75%" : "Requiere corridas SYSTEM"}
          </p>
        </div>
      </div>

      {/* Detección de inconsistencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
          <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-4 h-4 text-brand-600" />
            Inconsistencias detectadas vs. omitidas
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tradicional</p>
              <p className="mt-0.5">
                <span className="font-bold text-emerald-700">{traditional.errors_found}</span> detectadas •{" "}
                <span className="font-bold text-red-600">{traditional.errors_missed}</span> omitidas
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sistema</p>
              <p className="mt-0.5">
                <span className="font-bold text-emerald-700">{system.errors_found}</span> detectadas •{" "}
                <span className="font-bold text-red-600">{system.errors_missed}</span> omitidas
              </p>
            </div>
          </div>
        </div>

        {/* Inferencia estadística */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
          <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <Sigma className="w-4 h-4 text-brand-600" />
            Contraste de hipótesis (α = 0.05)
          </p>
          {paired ? (
            <div className="space-y-1 text-slate-600">
              <p>
                Prueba: <span className="font-mono font-semibold">{paired.test}</span> ({paired.pairs} parejas)
              </p>
              <p>
                Estadístico: <span className="font-mono">{paired.statistic}</span> • p-valor:{" "}
                <span className="font-mono font-bold">{paired.p_value}</span>
              </p>
              <p
                className={`font-bold ${paired.significant ? "text-emerald-700" : "text-amber-700"}`}
                data-testid="hypothesis-decision"
              >
                {paired.significant
                  ? "Se rechaza H₀: la reducción es estadísticamente significativa."
                  : "No se rechaza H₀ con la muestra actual."}
              </p>
            </div>
          ) : (
            <p className="text-slate-500">
              Se requieren al menos 3 casos evaluados con AMBOS métodos para el contraste pareado
              (Shapiro-Wilk → t de Student o Wilcoxon).
            </p>
          )}
        </div>
      </div>

      {/* Exportación */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600 flex items-center gap-1.5">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          Exportar datos reales para el Capítulo IV de la tesis (SPSS / R).
        </p>
        <div className="flex gap-2">
          <a
            href={experimentService.exportXlsxUrl}
            download
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar XLSX
          </a>
          <a
            href={experimentService.exportCsvUrl}
            download
            className="text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </a>
        </div>
      </div>
    </div>
  );
};
