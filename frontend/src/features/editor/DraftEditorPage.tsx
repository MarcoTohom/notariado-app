import React, { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Case, CaseType } from "../../types";
import { caseService } from "../../services/api";
import { fieldsApi } from "../fields/api";
import { DynamicForm, DynamicFormApi } from "../fields/DynamicForm";
import { SavedValues, Values } from "../fields/types";
import { LivePreview } from "./LivePreview";
import { CaseValidationModal } from "../validation/CaseValidationModal";
import { GenerateDocumentModal } from "../documents/GenerateDocumentModal";
import { ShortcutHint } from "../../components/common/ShortcutHint";
import {
  findClausesKey,
  renumberClauses,
} from "./useDraftEditor";
import { useEditorShortcuts, EDITOR_SHORTCUTS, EditorShortcutAction } from "./useEditorShortcuts";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import {
  FileSignature,
  Save,
  ShieldCheck,
  FileOutput,
  ListPlus,
  ArrowDownUp,
  Loader2,
} from "lucide-react";

const inputClass =
  "border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full";

const combo = (action: EditorShortcutAction) =>
  EDITOR_SHORTCUTS.find((s) => s.action === action)?.combo ?? "";

/** Editor de borradores (WP-07): formulario a la izquierda, preview en vivo
 *  a la derecha, incisos editables y atajos de teclado (WP-08). */
export const DraftEditorPage: React.FC = () => {
  const [params] = useSearchParams();
  const [versionId, setVersionId] = useState("");
  const [caseId, setCaseId] = useState(params.get("expediente") || "");
  const [values, setValues] = useState<Values>({});
  const [api, setApi] = useState<DynamicFormApi | null>(null);
  const [validatingCase, setValidatingCase] = useState<Case | null>(null);
  const [generatingCase, setGeneratingCase] = useState<Case | null>(null);

  const versionsQuery = useQuery({
    queryKey: ["field-versions"],
    queryFn: () => fieldsApi.versions(),
  });
  const casesQuery = useQuery({
    queryKey: ["editor-cases"],
    queryFn: () => caseService.getCases(0, 100),
  });
  const caseQuery = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => caseService.getCase(caseId),
    enabled: Boolean(caseId),
  });
  const savedQuery = useQuery({
    queryKey: ["field-values", caseId, versionId],
    queryFn: () => fieldsApi.load(caseId, versionId),
    enabled: Boolean(caseId && versionId),
  });

  const selectedVersion = versionsQuery.data?.find((v) => v.id === versionId);
  const compatible = Boolean(
    caseId && selectedVersion && caseQuery.data?.case_type === selectedVersion.case_type
  );
  const ready = compatible && savedQuery.data;

  // ---- Operaciones de incisos (WP-07) ------------------------------------
  const clauseSubfields = useMemo(() => {
    const listField = selectedVersion?.fields.find(
      (f) => f.field_type === "list" && /clausula|inciso/i.test(f.key)
    );
    return listField?.options_json?.fields ?? [];
  }, [selectedVersion]);

  const addClause = useCallback(() => {
    if (!api) return;
    const current = api.getValues();
    const key = findClausesKey(current);
    if (!key || clauseSubfields.length === 0) return;
    const items = (current[key] as Record<string, unknown>[]) ?? [];
    const newItem: Record<string, unknown> = {};
    for (const sub of clauseSubfields) {
      newItem[sub.key] = sub.key === "numero" ? items.length + 1 : "";
    }
    api.setValue(key, [...items, newItem]);
  }, [api, clauseSubfields]);

  const renumber = useCallback(() => {
    if (!api) return;
    const current = api.getValues();
    const key = findClausesKey(current);
    if (!key) return;
    api.setValue(key, renumberClauses((current[key] as Record<string, unknown>[]) ?? []));
  }, [api]);

  // ---- Atajos de teclado (WP-08) ------------------------------------------
  const handleShortcut = useCallback(
    (action: EditorShortcutAction) => {
      switch (action) {
        case "save":
          api?.submit();
          break;
        case "validate":
          if (caseQuery.data) setValidatingCase(caseQuery.data);
          break;
        case "generate":
          if (caseQuery.data) setGeneratingCase(caseQuery.data);
          break;
        case "addClause":
          addClause();
          break;
        case "clauseUp":
        case "clauseDown":
        case "clauseDelete":
          // El movimiento/borrado fino por ítem se hace con los botones de la lista;
          // el atajo renombra/renumera como ayuda rápida tras reordenar.
          renumber();
          break;
      }
    },
    [api, caseQuery.data, addClause, renumber]
  );

  useEditorShortcuts({ enabled: Boolean(ready), onAction: handleShortcut });

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-brand-600" />
            Editor de Borradores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Datos a la izquierda • documento en vivo a la derecha
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {EDITOR_SHORTCUTS.slice(0, 4).map((shortcut) => (
            <ShortcutHint key={shortcut.action} combo={shortcut.combo} label={shortcut.label} />
          ))}
        </div>
      </div>

      {/* Selectores */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Expediente
          <select
            className={`${inputClass} mt-1`}
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
          >
            <option value="">Seleccione un expediente…</option>
            {(casesQuery.data?.items ?? [])
              .filter((c) => c.status !== "CANCELADO")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} · {c.title}
                </option>
              ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Plantilla y versión
          <select
            className={`${inputClass} mt-1`}
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          >
            <option value="">Seleccione una plantilla…</option>
            {(versionsQuery.data ?? [])
              .filter((v) => !caseQuery.data || v.case_type === caseQuery.data.case_type)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · v{v.version_number} · {CASE_TYPE_LABELS[v.case_type as CaseType]}
                </option>
              ))}
          </select>
        </label>
        {caseId && selectedVersion && !compatible && (
          <p className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            La plantilla no corresponde al tipo de escritura del expediente seleccionado.
          </p>
        )}
      </div>

      {/* Paneles */}
      {!ready ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-xs text-slate-400">
          {savedQuery.isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando datos del expediente…
            </span>
          ) : (
            "Seleccione un expediente y una plantilla compatibles para comenzar a editar."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(380px,42%)_1fr] gap-4 items-start">
          {/* Panel izquierdo: formulario */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700">Datos del borrador</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={addClause}
                  className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  aria-keyshortcuts="Alt+N"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  Añadir inciso
                </button>
                <button
                  onClick={renumber}
                  className="text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  title="Renumerar incisos según el orden actual"
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  Renumerar
                </button>
              </div>
            </div>

            <DynamicForm
              key={`${caseId}:${versionId}`}
              version={selectedVersion!}
              caseId={caseId}
              initial={savedQuery.data as SavedValues}
              onValuesChange={setValues}
              onRegisterApi={setApi}
            />

            {/* Acciones */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                onClick={() => api?.submit()}
                className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-keyshortcuts="Control+S"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar <ShortcutHint combo={combo("save")} />
              </button>
              <button
                onClick={() => caseQuery.data && setValidatingCase(caseQuery.data)}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-keyshortcuts="Control+Enter"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Validar <ShortcutHint combo={combo("validate")} />
              </button>
              <button
                onClick={() => caseQuery.data && setGeneratingCase(caseQuery.data)}
                className="text-xs font-semibold bg-slate-900 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-keyshortcuts="Control+G"
              >
                <FileOutput className="w-3.5 h-3.5" />
                Generar DOCX <ShortcutHint combo={combo("generate")} />
              </button>
            </div>
          </div>

          {/* Panel derecho: preview en vivo */}
          <div className="lg:sticky lg:top-20 min-h-[70vh]">
            <LivePreview caseId={caseId} versionId={versionId} values={values} />
          </div>
        </div>
      )}

      <CaseValidationModal caseItem={validatingCase} onClose={() => setValidatingCase(null)} />
      <GenerateDocumentModal caseItem={generatingCase} onClose={() => setGeneratingCase(null)} />
    </div>
  );
};
