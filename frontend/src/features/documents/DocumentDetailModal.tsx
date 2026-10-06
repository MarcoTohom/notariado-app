import React from "react";
import { useQuery } from "@tanstack/react-query";
import { documentService } from "../../services/api";
import { DocumentVersionsList } from "./DocumentVersionsList";
import { formatDateTime } from "../../lib/format";
import { X, FileText, Loader2 } from "lucide-react";

interface DocumentDetailModalProps {
  documentId: string | null;
  onClose: () => void;
}

/** Historial completo de versiones de un borrador con descarga autenticada. */
export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  documentId,
  onClose,
}) => {
  const detailQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => documentService.getDocument(documentId as string),
    enabled: Boolean(documentId),
  });

  if (!documentId) return null;
  const detail = detailQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {detail?.title ?? "Cargando…"}
              </h3>
              <p className="text-xs text-slate-400">
                {detail?.case_number} • Creado {detail ? formatDateTime(detail.created_at) : "…"} • Versionamiento inmutable
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
              <span className="text-xs">Cargando historial…</span>
            </div>
          ) : detail ? (
            <DocumentVersionsList versions={detail.versions} />
          ) : (
            <p className="py-16 text-center text-xs text-red-600">
              No se pudo cargar el documento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
