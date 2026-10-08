import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, getApiErrorMessage } from "../../services/api";
import { Values } from "../fields/types";
import { useDebouncedSignature } from "./useDraftEditor";
import { Loader2, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LivePreviewProps {
  caseId: string;
  versionId: string;
  values: Values;
}

interface PreviewResponse {
  html: string;
  placeholders_free: boolean;
  residual_variables: string[];
}

/** Panel derecho del editor (WP-07): previsualización del documento que se
 *  actualiza con debounce de 800 ms tras cada cambio de valores. */
export const LivePreview: React.FC<LivePreviewProps> = ({ caseId, versionId, values }) => {
  const signature = useDebouncedSignature(values);

  const previewQuery = useQuery({
    queryKey: ["live-preview", caseId, versionId, signature],
    queryFn: async () =>
      (
        await apiClient.post<PreviewResponse>("/documents/preview-render", {
          case_id: caseId,
          template_version_id: versionId,
          values,
        })
      ).data,
    enabled: Boolean(caseId && versionId),
    placeholderData: (previous) => previous,
  });

  return (
    <section
      aria-label="Previsualización del documento"
      className="flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-brand-600" />
          Previsualización en vivo
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          {previewQuery.isFetching ? (
            <span className="text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> actualizando…
            </span>
          ) : previewQuery.data?.placeholders_free ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> sin placeholders
            </span>
          ) : previewQuery.data ? (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> placeholders pendientes
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {previewQuery.isError ? (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            {getApiErrorMessage(previewQuery.error, "No se pudo actualizar la previsualización.")}
          </p>
        ) : previewQuery.data ? (
          <article
            data-testid="live-preview-document"
            className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 min-h-[60vh] text-[13px] leading-relaxed text-slate-800 [&_p]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1"
            // El backend escapa el texto (anti-XSS); el HTML es estructural (<p>, <table>).
            dangerouslySetInnerHTML={{ __html: previewQuery.data.html }}
          />
        ) : (
          <p className="text-xs text-slate-400 text-center py-10">
            Escribe en el formulario para ver el documento en vivo.
          </p>
        )}
      </div>
    </section>
  );
};
