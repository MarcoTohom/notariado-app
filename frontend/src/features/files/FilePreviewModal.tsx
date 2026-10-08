import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileInventoryItem } from "../../types";
import { fileService } from "../../services/api";
import { X, FileText, Loader2, AlertTriangle, FileWarning } from "lucide-react";

interface FilePreviewModalProps {
  item: FileInventoryItem | null;
  onClose: () => void;
}

/** Previsualización del contenido del archivo en modal: sin descargar ni
 *  abandonar la página (texto DOCX/PDF o tabla CSV/XLSX). */
export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ item, onClose }) => {
  const previewQuery = useQuery({
    queryKey: ["file-preview", item?.kind, item?.record_id],
    queryFn: () => fileService.getPreview(item?.kind ?? "", item?.record_id ?? ""),
    enabled: Boolean(item),
  });

  if (!item) return null;
  const preview = previewQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-brand-600 p-1.5 rounded-lg text-white shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{item.file_name}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                {item.reference} • Vista previa (sin descarga)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {previewQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-xs">Extrayendo contenido…</span>
            </div>
          ) : previewQuery.isError ? (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No se pudo generar la vista previa del archivo.
            </div>
          ) : preview?.preview_type === "unavailable" ? (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs">
              <FileWarning className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-bold">{preview.content as string}</p>
                <p>El documento no tiene capa de texto digital (posible escaneo). Sin OCR en el MVP.</p>
              </div>
            </div>
          ) : preview?.preview_type === "table" ? (
            (() => {
              const table = preview.content as { columns: string[]; rows: string[][] };
              return (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          {table.columns.map((column) => (
                            <th key={column} className="py-2 px-3">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {table.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="py-1.5 px-3 text-slate-700">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <pre
                data-testid="file-preview-text"
                className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed"
              >
                {typeof preview?.content === "string" ? preview.content : ""}
              </pre>
              {preview?.truncated && (
                <p className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 italic">
                  Contenido truncado por límite de vista previa (4000 palabras).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
