import React, { useMemo, useState } from "react";
import { FindingSeverity, ValidationFinding } from "../../types";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";

/** Configuración visual por severidad (orden: CRITICAL > ERROR > WARNING > INFO). */
export const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; badge: string; card: string; Icon: typeof XCircle }
> = {
  CRITICAL: {
    label: "Crítico",
    badge: "bg-red-100 text-red-800 border-red-300",
    card: "border-red-300 bg-red-50/60",
    Icon: XCircle,
  },
  ERROR: {
    label: "Error",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    card: "border-orange-300 bg-orange-50/60",
    Icon: AlertOctagon,
  },
  WARNING: {
    label: "Advertencia",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    card: "border-amber-300 bg-amber-50/60",
    Icon: AlertTriangle,
  },
  INFO: {
    label: "Info",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    card: "border-sky-300 bg-sky-50/60",
    Icon: Info,
  },
};

export const SEVERITY_ORDER: FindingSeverity[] = ["CRITICAL", "ERROR", "WARNING", "INFO"];

export const countBySeverity = (
  findings: ValidationFinding[]
): Record<FindingSeverity, number> => {
  const counts: Record<FindingSeverity, number> = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
  for (const finding of findings) {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
  }
  return counts;
};

export const filterBySeverity = (
  findings: ValidationFinding[],
  severity: FindingSeverity | "ALL"
): ValidationFinding[] =>
  severity === "ALL" ? findings : findings.filter((f) => f.severity === severity);

interface FindingsPanelProps {
  findings: ValidationFinding[];
  /** Callback "Ir al campo": recibe el field_key del hallazgo. */
  onGoToField?: (fieldKey: string) => void;
}

/**
 * Panel interactivo de inconsistencias notariales (Fase 6):
 * severidad, mensaje, valor actual vs. esperado, ubicación y
 * acción directa de "Ir al campo" para corregir en el formulario.
 */
export const FindingsPanel: React.FC<FindingsPanelProps> = ({ findings, onGoToField }) => {
  const [filter, setFilter] = useState<FindingSeverity | "ALL">("ALL");
  const counts = useMemo(() => countBySeverity(findings), [findings]);
  const visible = useMemo(() => filterBySeverity(findings, filter), [findings, filter]);

  if (findings.length === 0) {
    return (
      <div
        data-testid="findings-empty"
        className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3.5 text-xs"
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold">Documento consistente</p>
          <p>El motor no detectó inconsistencias en las 20 reglas evaluadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros por severidad */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por severidad">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <button
          onClick={() => setFilter("ALL")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            filter === "ALL"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
          }`}
        >
          Todas ({findings.length})
        </button>
        {SEVERITY_ORDER.map((severity) => {
          const config = SEVERITY_CONFIG[severity];
          const count = counts[severity];
          if (count === 0) return null;
          return (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                filter === severity
                  ? "bg-slate-900 text-white border-slate-900"
                  : `${config.badge} hover:opacity-80`
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de hallazgos */}
      <ul className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
        {visible.map((finding, index) => {
          const config = SEVERITY_CONFIG[finding.severity];
          const { Icon } = config;
          return (
            <li
              key={`${finding.rule_id}-${finding.field_key}-${index}`}
              data-testid={`finding-${finding.severity}`}
              className={`border rounded-xl p-3.5 ${config.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px]">{finding.rule_id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${config.badge}`}>
                        {config.label}
                      </span>
                      {finding.location && (
                        <span className="text-[10px] text-slate-500 italic">{finding.location}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed">
                      {finding.message}
                    </p>
                    {(finding.current_value || finding.expected_value) && (
                      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                        <div className="bg-white/80 border border-slate-200 rounded-lg px-2 py-1.5">
                          <dt className="font-bold text-slate-400 uppercase text-[9px]">En el documento</dt>
                          <dd className="font-mono text-slate-700 break-words">
                            {finding.current_value || "—"}
                          </dd>
                        </div>
                        <div className="bg-white/80 border border-slate-200 rounded-lg px-2 py-1.5">
                          <dt className="font-bold text-slate-400 uppercase text-[9px]">Valor esperado</dt>
                          <dd className="font-mono text-slate-700 break-words">
                            {finding.expected_value || "—"}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
                {onGoToField && (
                  <button
                    onClick={() => onGoToField(finding.field_key)}
                    className="shrink-0 text-[11px] font-semibold bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    title={`Ir al campo ${finding.field_key} en el formulario`}
                  >
                    Ir al campo
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
