import React from "react";
import { DocumentVersionInfo } from "../../types";
import { formatBytes, formatDateTime, shortHash } from "../../lib/format";
import { CheckCircle2, AlertTriangle, Download, FileText } from "lucide-react";

interface DocumentVersionsListProps {
  versions: DocumentVersionInfo[];
}

/**
 * Historial inmutable de versiones de un borrador (US-07.3):
 * número de versión, estado de verificación, hash SHA-256, notas y
 * descarga autenticada. Las versiones jamás se sobrescriben.
 */
export const DocumentVersionsList: React.FC<DocumentVersionsListProps> = ({ versions }) => {
  if (versions.length === 0) {
    return (
      <p className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-4 text-center">
        Aún no hay versiones generadas de este borrador.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {versions.map((version) => (
        <li
          key={version.id}
          className="border border-slate-200 rounded-xl p-3.5 bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="bg-brand-50 border border-brand-200 p-1.5 rounded-lg shrink-0">
                <FileText className="w-4 h-4 text-brand-600" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Versión v{version.version_number}
                  </span>
                  {version.placeholders_free ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Verificada — sin placeholders
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
                      title={`Variables residuales: ${version.residual_variables.join(", ")}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Placeholders pendientes ({version.residual_variables.length})
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                  <span>{formatDateTime(version.created_at)}</span>
                  <span>{formatBytes(version.file_size)}</span>
                  <span className="font-mono">SHA-256: {shortHash(version.file_hash)}</span>
                  {version.template_name && <span>Plantilla: {version.template_name}</span>}
                </div>
                {version.notes && (
                  <p className="mt-1 text-[10px] text-slate-500 italic">{version.notes}</p>
                )}
                {!version.placeholders_free && (
                  <p className="mt-1 text-[10px] font-mono text-red-600">
                    {version.residual_variables.map((v) => `{{ ${v} }}`).join(" ")}
                  </p>
                )}
              </div>
            </div>
            {version.download_url && (
              <a
                href={version.download_url}
                download
                className="shrink-0 text-[11px] font-semibold bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title={`Descargar versión v${version.version_number}`}
              >
                <Download className="w-3 h-3" />
                Descargar
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
