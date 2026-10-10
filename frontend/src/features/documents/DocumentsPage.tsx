import { LoadingState } from "../../components/common/Feedback";
import { Badge } from "../../components/common/Badge";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { documentService } from "./api";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { formatDateTime } from "../../lib/format";
import {
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const PAGE_SIZE = 10;

/** Repositorio de borradores generados con historial inmutable (Fase 7). */
export const DocumentsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [detailDocumentId, setDetailDocumentId] = useState<string | null>(null);

  const skip = page * PAGE_SIZE;
  const documentsQuery = useQuery({
    queryKey: ["documents", page],
    queryFn: () => documentService.getDocuments(skip, PAGE_SIZE),
  });

  const total = documentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Borradores Generados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historial inmutable de versiones DOCX verificadas sin placeholders residuales
          </p>
        </div>
        <button
          onClick={() => documentsQuery.refetch()}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${documentsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
        {documentsQuery.isLoading ? (
          <LoadingState className="py-16">

            <span className="text-xs">Cargando borradores…</span>
          </LoadingState>
        ) : documentsQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-medium">
              No se pudieron cargar los borradores. Verifica tu sesión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Documento</th>
                  <th className="py-2.5 px-4">Expediente</th>
                  <th className="py-2.5 px-4 text-center">Versiones</th>
                  <th className="py-2.5 px-4">Última verificación</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Generado</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(documentsQuery.data?.items ?? []).map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 max-w-xs truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{doc.case_number ?? "—"}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600">{doc.versions_count}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ver historial
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge className="bg-brand-50 text-brand-700 border border-brand-200">
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{formatDateTime(doc.created_at)}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailDocumentId(doc.id)}
                          className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                          title="Ver historial de versiones y descargar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(documentsQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                      Aún no hay borradores. Genera el primero desde un expediente con el botón «Generar DOCX».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Mostrando página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> • {total} documento(s)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <DocumentDetailModal
        documentId={detailDocumentId}
        onClose={() => setDetailDocumentId(null)}
      />
    </div>
  );
};
