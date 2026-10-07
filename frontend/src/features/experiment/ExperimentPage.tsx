import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaseType,
  ExperimentExecution,
  ExperimentMethod,
  ExperimentStage,
  ExperimentTestCase,
} from "../../types";
import { experimentService, getApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { ExperimentStatsCards } from "./ExperimentStatsCards";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import {
  FlaskConical,
  Play,
  Square,
  RefreshCw,
  Loader2,
  Database,
  Timer,
  CheckCircle2,
} from "lucide-react";

const STAGE_LABELS: Record<ExperimentStage, string> = {
  DETECCION: "Detección",
  CORRECCION: "Corrección",
  GENERACION: "Generación",
};

/** Módulo de medición experimental de tesis: corpus sintético, cronómetro
 *  por método (TRADITIONAL vs SYSTEM) y dashboard estadístico real. */
export const ExperimentPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canExecute = hasPermission("experiment:execute");

  const [typeFilter, setTypeFilter] = useState<CaseType | "">("");
  const [anomalyFilter, setAnomalyFilter] = useState<"" | "true" | "false">("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [active, setActive] = useState<ExperimentExecution | null>(null);
  const [activeCase, setActiveCase] = useState<ExperimentTestCase | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stageBusy, setStageBusy] = useState<ExperimentStage | null>(null);
  const [finishedStages, setFinishedStages] = useState<ExperimentStage[]>([]);
  const [manualFound, setManualFound] = useState("0");
  const [manualMissed, setManualMissed] = useState("0");
  const [corrections, setCorrections] = useState("0");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statsQuery = useQuery({
    queryKey: ["experiment-stats"],
    queryFn: () => experimentService.getStats(),
  });

  const casesQuery = useQuery({
    queryKey: ["experiment-cases", typeFilter, anomalyFilter],
    queryFn: () =>
      experimentService.getCases(
        0,
        100,
        typeFilter || undefined,
        anomalyFilter === "" ? undefined : anomalyFilter === "true"
      ),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["experiment-stats"] });
    queryClient.invalidateQueries({ queryKey: ["experiment-cases"] });
  };

  // Cronómetro en vivo de la corrida activa.
  useEffect(() => {
    if (active && !active.finished_at) {
      const started = new Date(active.started_at).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [active]);

  const generateMutation = useMutation({
    mutationFn: () => experimentService.generateCorpus(),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo generar el corpus.")),
  });

  const startMutation = useMutation({
    mutationFn: ({ testCase, method }: { testCase: ExperimentTestCase; method: ExperimentMethod }) =>
      experimentService.startExecution(testCase.id, method),
    onSuccess: (execution, { testCase }) => {
      setActive(execution);
      setActiveCase(testCase);
      setFinishedStages([]);
      setElapsed(0);
      setManualFound("0");
      setManualMissed("0");
      setCorrections("0");
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo iniciar la corrida.")),
  });

  const finishMutation = useMutation({
    mutationFn: () => {
      const payload =
        active?.method === "TRADITIONAL"
          ? {
              errors_found: parseInt(manualFound) || 0,
              errors_missed: parseInt(manualMissed) || 0,
              corrections: parseInt(corrections) || 0,
            }
          : { corrections: parseInt(corrections) || 0 };
      return experimentService.finishExecution(active?.id ?? "", payload);
    },
    onSuccess: (execution) => {
      setActive(null);
      setActiveCase(null);
      invalidate();
      setActionError(null);
      return execution;
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo finalizar la corrida.")),
  });

  const handleStage = async (stage: ExperimentStage) => {
    if (!active) return;
    setStageBusy(stage);
    try {
      const measurement = await experimentService.startStage(active.id, stage);
      await experimentService.finishStage(measurement.id);
      setFinishedStages((prev) => [...prev, stage]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "No se pudo registrar la etapa."));
    } finally {
      setStageBusy(null);
    }
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stats = statsQuery.data;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            Módulo de Tesis — Experimento de Medición
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Corpus de 100 casos sintéticos (20 por tipo) • Línea base 240 min → meta experimental 60 min
          </p>
        </div>
        {canExecute && (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            Generar corpus (100 casos)
          </button>
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg">
          {actionError}
        </div>
      )}

      {/* Distribución del corpus */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{stats.cases_total}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Casos en corpus</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{stats.cases_with_anomalies}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Con anomalías</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center">
            <p className="text-2xl font-extrabold text-brand-700">{stats.executions_total}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Corridas registradas</p>
          </div>
        </div>
      )}

      {/* Corrida activa con cronómetro */}
      {active && activeCase && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                Corrida en curso — método {active.method}
              </p>
              <p className="text-sm font-bold mt-0.5">{activeCase.title}</p>
              <p className="text-[11px] text-slate-400">
                {CASE_TYPE_LABELS[activeCase.case_type]} • Hallazgos esperados:{" "}
                {activeCase.expected_findings.length > 0
                  ? activeCase.expected_findings.join(", ")
                  : "ninguno (caso íntegro)"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-extrabold text-amber-400 flex items-center gap-2">
                <Timer className="w-6 h-6" />
                {formatElapsed(elapsed)}
              </p>
              <p className="text-[10px] text-slate-400">mm:ss transcurridos</p>
            </div>
          </div>

          {/* Etapas */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(Object.keys(STAGE_LABELS) as ExperimentStage[]).map((stage) => (
              <button
                key={stage}
                onClick={() => handleStage(stage)}
                disabled={stageBusy !== null || finishedStages.includes(stage)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  finishedStages.includes(stage)
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                } disabled:opacity-60`}
              >
                {finishedStages.includes(stage) ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : stageBusy === stage ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>

          {/* Finalización */}
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            {active.method === "TRADITIONAL" && (
              <>
                <label className="text-[11px] text-slate-300">
                  Inconsistencias detectadas
                  <input
                    type="number"
                    min={0}
                    value={manualFound}
                    onChange={(e) => setManualFound(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </label>
                <label className="text-[11px] text-slate-300">
                  Inconsistencias omitidas
                  <input
                    type="number"
                    min={0}
                    value={manualMissed}
                    onChange={(e) => setManualMissed(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </label>
              </>
            )}
            <label className="text-[11px] text-slate-300">
              Correcciones realizadas
              <input
                type="number"
                min={0}
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </label>
            <button
              onClick={() => finishMutation.mutate()}
              disabled={finishMutation.isPending}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {finishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Finalizar corrida
            </button>
          </div>
        </div>
      )}

      {/* Tabla de casos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CaseType | "")}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los tipos</option>
            {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map((t) => (
              <option key={t} value={t}>
                {CASE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={anomalyFilter}
            onChange={(e) => setAnomalyFilter(e.target.value as "" | "true" | "false")}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Íntegros y anómalos</option>
            <option value="true">Solo anómalos</option>
            <option value="false">Solo íntegros</option>
          </select>
          <button
            onClick={() => casesQuery.refetch()}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors ml-auto"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${casesQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {casesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Cargando corpus…</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Caso</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Condición</th>
                  <th className="py-2.5 px-4">Hallazgos esperados</th>
                  {canExecute && <th className="py-2.5 px-4 text-right">Ejecutar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(casesQuery.data?.items ?? []).map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-700 max-w-xs truncate" title={testCase.title}>
                      {testCase.title}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{CASE_TYPE_LABELS[testCase.case_type]}</td>
                    <td className="py-2.5 px-4">
                      {testCase.has_anomalies ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Anómalo
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Íntegro
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">
                      {testCase.expected_findings.length > 0
                        ? testCase.expected_findings.join(", ")
                        : "—"}
                    </td>
                    {canExecute && (
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startMutation.mutate({ testCase, method: "SYSTEM" })}
                            disabled={startMutation.isPending || Boolean(active)}
                            className="text-[10px] font-bold bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-40"
                            title="Medir con el sistema"
                          >
                            Sistema
                          </button>
                          <button
                            onClick={() => startMutation.mutate({ testCase, method: "TRADITIONAL" })}
                            disabled={startMutation.isPending || Boolean(active)}
                            className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-40"
                            title="Medir con el método tradicional"
                          >
                            Tradicional
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(casesQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                      Corpus vacío. Pulsa «Generar corpus (100 casos)» para crear la muestra experimental.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dashboard estadístico */}
      <section>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          Dashboard Experimental (datos reales únicamente)
        </h3>
        {stats ? (
          <ExperimentStatsCards stats={stats} />
        ) : (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Calculando estadística…</span>
          </div>
        )}
      </section>
    </div>
  );
};
