import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Case } from "../cases/types";
import type { ValidationRun } from "./types";
import { getApiErrorMessage } from "../../shared/api/errors";
import { validationService } from "./api";
import { fieldsApi } from "../fields/api";
import { useAuth } from "../auth/AuthContext";
import { FindingsPanel } from "./FindingsPanel";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import { formatDateTime } from "../../lib/format";
import { X, ShieldCheck, Play, Loader2, History } from "lucide-react";

interface CaseValidationModalProps {
  /** Expediente a validar; null cierra el modal. */
  caseItem: Case | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  LIMPIO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CON_ADVERTENCIAS: "bg-amber-50 text-amber-700 border-amber-200",
  CON_INCONSISTENCIAS: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  LIMPIO: "Limpio",
  CON_ADVERTENCIAS: "Con advertencias",
  CON_INCONSISTENCIAS: "Con inconsistencias",
};

/** Orquesta la ejecución del motor de reglas sobre un expediente y
 *  presenta el Panel de Inconsistencias con navegación al formulario. */
export const CaseValidationModal: React.FC<CaseValidationModalProps> = ({
  caseItem,
  onClose,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canExecute = hasPermission("validations:execute");

  const [versionId, setVersionId] = useState("");
  const [run, setRun] = useState<ValidationRun | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const versionsQuery = useQuery({
    queryKey: ["field-versions", caseItem?.case_type],
    queryFn: () => fieldsApi.versions(caseItem?.case_type),
    enabled: Boolean(caseItem),
  });

  const latestQuery = useQuery({
    queryKey: ["validation-latest", caseItem?.id],
    queryFn: () => validationService.getLatestRun(caseItem?.id as string),
    enabled: Boolean(caseItem),
  });

  useEffect(() => {
    setVersionId("");
    setRun(null);
    setActionError(null);
  }, [caseItem?.id]);

  // Preseleccionar la versión usada en la última corrida o la más reciente.
  useEffect(() => {
    if (latestQuery.data?.template_version_id) {
      setVersionId(latestQuery.data.template_version_id);
    }
  }, [latestQuery.data]);

  const runMutation = useMutation({
    mutationFn: () =>
      validationService.runValidation(caseItem?.id ?? "", versionId),
    onSuccess: (result) => {
      setRun(result);
      setActionError(null);
      latestQuery.refetch();
    },
    onError: (err) =>
      setActionError(getApiErrorMessage(err, "No se pudo ejecutar el motor de reglas.")),
  });

  if (!caseItem) return null;

  const goToField = (_fieldKey: string) => {
    onClose();
    navigate(`/formularios?expediente=${caseItem.id}`);
  };

  const displayed = run ?? latestQuery.data ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Validación de Consistencia Documental
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {caseItem.case_number} • {CASE_TYPE_LABELS[caseItem.case_type]} • RULE-001..RULE-020
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Selector de versión y ejecución */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="validation_version" className="block text-xs font-semibold text-slate-700 mb-1">
                Formulario y versión a evaluar
              </label>
              <select
                id="validation_version"
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Selecciona un formulario…</option>
                {(versionsQuery.data ?? []).map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name} · v{version.version_number}
                  </option>
                ))}
              </select>
              {versionsQuery.data?.length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  No hay formularios configurados para {CASE_TYPE_LABELS[caseItem.case_type]}; créalo en el módulo Formularios.
                </p>
              )}
            </div>
            {canExecute && (
              <button
                onClick={() => runMutation.mutate()}
                disabled={!versionId || runMutation.isPending}
                className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {runMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {runMutation.isPending ? "Evaluando 20 reglas…" : "Ejecutar validación"}
              </button>
            )}
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg">
              {actionError}
            </div>
          )}

          {/* Resumen de la corrida */}
          {displayed && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-bold border ${STATUS_STYLES[displayed.status]}`}>
                  {STATUS_LABELS[displayed.status] ?? displayed.status}
                </span>
                <span className="text-slate-500">
                  {displayed.total_findings} hallazgo(s): {displayed.critical_count} críticos,{" "}
                  {displayed.error_count} errores, {displayed.warning_count} advertencias
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                {run ? "Corrida actual" : "Última corrida"} • {formatDateTime(displayed.created_at)}
              </span>
            </div>
          )}

          {/* Panel de inconsistencias */}
          {displayed ? (
            <FindingsPanel findings={displayed.findings} onGoToField={goToField} />
          ) : (
            <p className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-6 text-center">
              Selecciona un formulario y pulsa «Ejecutar validación» para evaluar las 20 reglas notariales sobre este expediente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
