import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PreviewResult, TemplateVersionInfo } from "../../types";
import { getApiErrorMessage, templateService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  CASE_TYPE_LABELS,
  DOCX_VERSION_STATUS_COLORS,
  DOCX_VERSION_STATUS_LABELS,
} from "../../lib/labels";
import { formatBytes, formatDateTime, shortHash } from "../../lib/format";
import { validateTemplateFile } from "./TemplateUploadModal";
import {
  X,
  FileText,
  Loader2,
  CheckCircle2,
  PlayCircle,
  Upload,
  Download,
  AlertTriangle,
  History,
  ListChecks,
} from "lucide-react";

interface TemplateDetailModalProps {
  templateId: string | null;
  onClose: () => void;
}

/** Detalle de plantilla: historial de versiones, campos detectados,
 *  activación de versión vigente y render de prueba verificado. */
export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  templateId,
  onClose,
}) => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUploadVersion = hasPermission("templates:update");
  const canActivate = hasPermission("templates:activate");

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");

  const detailQuery = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => templateService.getTemplate(templateId as string),
    enabled: Boolean(templateId),
  });

  const detail = detailQuery.data;
  const selectedVersion: TemplateVersionInfo | null =
    detail?.versions.find((v) => v.id === selectedVersionId) ??
    detail?.versions[0] ??
    null;

  useEffect(() => {
    setSelectedVersionId(null);
    setActionError(null);
    setPreviewResult(null);
    setVersionFile(null);
    setVersionNotes("");
  }, [templateId]);

  if (!templateId) return null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  };

  const activateMutation = useMutation({
    mutationFn: (versionId: string) =>
      templateService.activateVersion(templateId, versionId),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo activar la versión.")),
  });

  const previewMutation = useMutation({
    mutationFn: (versionId: string) =>
      templateService.previewVersion(templateId, versionId),
    onSuccess: (result) => {
      setPreviewResult(result);
      setActionError(null);
    },
    onError: (err) => {
      setPreviewResult(null);
      setActionError(getApiErrorMessage(err, "No se pudo generar el render de prueba."));
    },
  });

  const uploadVersionMutation = useMutation({
    mutationFn: (formData: FormData) =>
      templateService.uploadVersion(templateId, formData),
    onSuccess: () => {
      invalidate();
      setVersionFile(null);
      setVersionNotes("");
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo cargar la versión.")),
  });

  const handleUploadVersion = () => {
    setActionError(null);
    const error = validateTemplateFile(versionFile);
    if (error) {
      setActionError(error);
      return;
    }
    const formData = new FormData();
    formData.append("notes", versionNotes);
    formData.append("file", versionFile as File);
    uploadVersionMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {detail?.name ?? "Cargando…"}
              </h3>
              <p className="text-xs text-slate-400">
                {detail ? CASE_TYPE_LABELS[detail.case_type] : "Plantilla notarial"} • Versionamiento inmutable
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
        <div className="flex-1 overflow-y-auto p-5">
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-xs">Cargando plantilla…</span>
            </div>
          ) : !detail ? (
            <p className="py-16 text-center text-xs text-red-600">No se pudo cargar la plantilla.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Columna izquierda: historial de versiones */}
              <section>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <History className="w-4 h-4 text-brand-600" />
                  Historial de Versiones ({detail.versions.length})
                </h4>

                {actionError && (
                  <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-lg">
                    {actionError}
                  </div>
                )}

                <ul className="space-y-2">
                  {detail.versions.map((version) => (
                    <li
                      key={version.id}
                      className={`border rounded-xl p-3 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? "border-brand-400 bg-brand-50/50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          v{version.version_number}
                          {version.original_filename && (
                            <span className="ml-2 font-mono font-normal text-[10px] text-slate-400">
                              {version.original_filename}
                            </span>
                          )}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            DOCX_VERSION_STATUS_COLORS[version.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {DOCX_VERSION_STATUS_LABELS[version.status] ?? version.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                        <span>{formatDateTime(version.created_at)}</span>
                        {version.file_size != null && <span>{formatBytes(version.file_size)}</span>}
                        {version.file_hash && <span className="font-mono">SHA-256: {shortHash(version.file_hash)}</span>}
                      </div>
                      {version.notes && (
                        <p className="mt-1 text-[10px] text-slate-500 italic">{version.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Subir nueva versión */}
                {canUploadVersion && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">
                      Subir Nueva Versión (v{(detail.versions[0]?.version_number ?? 0) + 1})
                    </p>
                    <input
                      type="file"
                      accept=".docx"
                      aria-label="Archivo de nueva versión"
                      onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700 file:cursor-pointer border border-slate-300 rounded-lg bg-white"
                    />
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={versionNotes}
                        onChange={(e) => setVersionNotes(e.target.value)}
                        placeholder="Notas de la versión (opcional)"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleUploadVersion}
                        disabled={uploadVersionMutation.isPending}
                        className="shrink-0 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                      >
                        {uploadVersionMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        Subir
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Columna derecha: versión seleccionada */}
              <section>
                {selectedVersion && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-brand-600" />
                        Variables Detectadas — v{selectedVersion.version_number} ({selectedVersion.fields.length})
                      </h4>
                    </div>

                    {/* Acciones de la versión */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {canActivate && selectedVersion.has_file && selectedVersion.status !== "ACTIVA" && (
                        <button
                          onClick={() => activateMutation.mutate(selectedVersion.id)}
                          disabled={activateMutation.isPending}
                          className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                        >
                          {activateMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Activar esta versión
                        </button>
                      )}
                      {selectedVersion.has_file && (
                        <button
                          onClick={() => previewMutation.mutate(selectedVersion.id)}
                          disabled={previewMutation.isPending}
                          className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                        >
                          {previewMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3 h-3" />
                          )}
                          Probar render
                        </button>
                      )}
                    </div>

                    {/* Resultado del render de prueba */}
                    {previewResult && (
                      <div
                        className={`mb-3 border rounded-lg px-3 py-2.5 text-xs ${
                          previewResult.placeholders_free
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <p className="font-bold flex items-center gap-1.5">
                          {previewResult.placeholders_free ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Render verificado: cero placeholders residuales
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4" />
                              Quedaron variables sin sustituir: {previewResult.residual_variables.join(", ")}
                            </>
                          )}
                        </p>
                        <a
                          href={previewResult.download_url}
                          download
                          className="mt-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                        >
                          <Download className="w-3 h-3" />
                          Descargar DOCX de prueba
                        </a>
                      </div>
                    )}

                    {/* Campos detectados */}
                    {selectedVersion.fields.length === 0 ? (
                      <p className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-4 text-center">
                        Esta versión no tiene variables registradas.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Variable Jinja2</th>
                              <th className="py-2 px-3">Etiqueta</th>
                              <th className="py-2 px-3">Tipo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedVersion.fields.map((field) => (
                              <tr key={field.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-[11px] text-brand-700">
                                  {`{{ ${field.docx_variable ?? field.key} }}`}
                                </td>
                                <td className="py-2 px-3 text-slate-700">{field.label}</td>
                                <td className="py-2 px-3">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    {field.field_type}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
