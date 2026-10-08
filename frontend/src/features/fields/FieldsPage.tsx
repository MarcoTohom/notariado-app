import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { caseService } from "../cases/api";
import { getApiErrorMessage } from "../../shared/api/errors";
import { fieldsApi } from "./api";
import { DynamicForm } from "./DynamicForm";
import { FieldDefinitionEditor, newField } from "./FieldDefinitionEditor";
import { inputClass } from "./FieldControls";
import { FieldDefinition, FormVersion } from "./types";

const CASE_LABELS: Record<string, string> = {
  COMPRAVENTA: "Compraventa",
  DONACION: "Donación",
  ARRENDAMIENTO: "Arrendamiento",
  MATRIMONIO: "Matrimonio",
  SOCIEDAD: "Sociedad",
};
export function FieldsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [versionId, setVersionId] = useState("");
  const [caseId, setCaseId] = useState(params.get("expediente") || "");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [caseType, setCaseType] = useState("COMPRAVENTA");
  const [draft, setDraft] = useState<FieldDefinition[]>([newField(1)]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const versions = useQuery({
    queryKey: ["field-versions"],
    queryFn: () => fieldsApi.versions(),
  });
  const selected = versions.data?.find((v) => v.id === versionId);
  const cases = useQuery({
    queryKey: ["field-cases", search, selected?.case_type],
    queryFn: () => caseService.getCases(0, 50, search, selected?.case_type),
  });
  const chosenCase = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => caseService.getCase(caseId),
    enabled: Boolean(caseId),
  });
  const compatible = Boolean(
    caseId && selected && chosenCase.data?.case_type === selected.case_type,
  );
  const saved = useQuery({
    queryKey: ["field-values", caseId, versionId],
    queryFn: () => fieldsApi.load(caseId, versionId),
    enabled: compatible,
  });
  const create = useMutation({
    mutationFn: () =>
      editingTemplate
        ? fieldsApi.revise(editingTemplate, draft)
        : fieldsApi.create(name, caseType, draft),
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ["field-versions"] });
      setVersionId(version.id);
      setEditing(false);
    },
  });
  const edit = (version?: FormVersion) => {
    setEditingTemplate(version?.template_id || null);
    setName(version?.name || "");
    setCaseType(version?.case_type || "COMPRAVENTA");
    setDraft(version ? structuredClone(version.fields) : [newField(1)]);
    create.reset();
    setEditing(true);
  };
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Formularios de escritura
          </h1>
          <p className="text-sm text-slate-600">
            Configure los campos y complete los datos del expediente.
          </p>
        </div>
        {hasPermission("templates:create") &&
          hasPermission("templates:update") && (
            <button
              className="rounded-lg bg-brand-600 text-white px-4 py-2"
              onClick={() => edit()}
            >
              Nuevo formulario
            </button>
          )}
      </div>
      {editing ? (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingTemplate
              ? "Nueva versión del formulario"
              : "Configurar formulario"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              Nombre
              <input
                className={inputClass}
                required
                maxLength={150}
                value={name}
                disabled={Boolean(editingTemplate)}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Tipo de escritura
              <select
                className={inputClass}
                value={caseType}
                disabled={Boolean(editingTemplate)}
                onChange={(e) => setCaseType(e.target.value)}
              >
                {Object.entries(CASE_LABELS).map(([key, title]) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-600">
            Cada guardado crea una versión nueva. Los formularios y datos
            anteriores se conservan.
          </p>
          <FieldDefinitionEditor fields={draft} onChange={setDraft} />
          {create.isError && (
            <p role="alert" className="text-red-700">
              {getApiErrorMessage(create.error)}
            </p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={create.isPending || !draft.length}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg"
            >
              {create.isPending ? "Guardando…" : "Guardar versión"}
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          {versions.isPending && <p role="status">Cargando formularios…</p>}
          {versions.isError && (
            <p role="alert">{getApiErrorMessage(versions.error)}</p>
          )}
          {versions.data?.length === 0 && (
            <p className="rounded-xl border p-6">
              Todavía no hay formularios. Un administrador o notario puede crear
              el primero.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              Formulario y versión
              <select
                className={inputClass}
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
              >
                <option value="">Seleccione un formulario</option>
                {versions.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · v{v.version_number} · {CASE_LABELS[v.case_type]}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <label>
                Buscar expediente
                <input
                  className={inputClass}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Número o título"
                />
              </label>
              <label>
                Expediente
                <select
                  className={inputClass}
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                >
                  <option value="">Seleccione un expediente</option>
                  {chosenCase.data &&
                    !cases.data?.items.some((c) => c.id === caseId) && (
                      <option value={caseId}>
                        {chosenCase.data.case_number} · {chosenCase.data.title}
                      </option>
                    )}
                  {cases.data?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} · {c.title}
                    </option>
                  ))}
                </select>
              </label>
              {(cases.isError || chosenCase.isError) && (
                <p role="alert">No se pudieron cargar los expedientes.</p>
              )}
            </div>
          </div>
          {selected &&
            hasPermission("templates:update") &&
            hasPermission("templates:create") && (
              <button className="text-brand-700" onClick={() => edit(selected)}>
                Configurar nueva versión
              </button>
            )}
          {selected && caseId && chosenCase.data && !compatible && (
            <p role="alert">
              Seleccione un formulario del mismo tipo de escritura que el
              expediente.
            </p>
          )}
          {compatible && saved.isPending && (
            <p role="status">Cargando datos…</p>
          )}
          {compatible && saved.isError && (
            <p role="alert">{getApiErrorMessage(saved.error)}</p>
          )}
          {compatible && selected && saved.data && (
            <section className="bg-white border rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold">
                {selected.name} · Versión {selected.version_number}
              </h2>
              <DynamicForm
                key={`${caseId}:${versionId}`}
                version={selected}
                caseId={caseId}
                initial={saved.data}
                readOnly={
                  !hasPermission("cases:update") ||
                  ["CANCELADO", "FINALIZADO"].includes(
                    chosenCase.data?.status || "",
                  )
                }
                onSaved={(data) =>
                  queryClient.setQueryData(
                    ["field-values", caseId, versionId],
                    data,
                  )
                }
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
