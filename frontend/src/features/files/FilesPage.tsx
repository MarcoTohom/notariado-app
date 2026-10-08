import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileInventoryItem, FileKind } from "../../types";
import { fileService } from "../../services/api";
import { FilePreviewModal } from "./FilePreviewModal";
import { formatBytes } from "../../lib/format";
import {
  FolderSearch,
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
} from "lucide-react";

const KIND_LABELS: Record<FileKind, string> = {
  TEMPLATE_VERSION: "Plantilla",
  ATTACHMENT: "Adjunto",
  DOCUMENT_VERSION: "Borrador",
  PREVIEW: "Render de prueba",
};

const STATUS_CONFIG = {
  OK: { label: "OK", classes: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  DIFIERE: { label: "Difiere", classes: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertTriangle },
  NO_ENCONTRADO: { label: "No encontrado", classes: "bg-red-50 text-red-700 border-red-200", Icon: XCircle },
} as const;

/** Inventario operativo de archivos del sistema con verificación de
 *  persistencia (existencia, tamaño y hash contra la BD) y vista previa. */
export const FilesPage: React.FC = () => {
  const [kindFilter, setKindFilter] = useState<FileKind | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewItem, setPreviewItem] = useState<FileInventoryItem | null>(null);

  const inventoryQuery = useQuery({
    queryKey: ["files-inventory", kindFilter, statusFilter],
    queryFn: () => fileService.getInventory(kindFilter || undefined, statusFilter || undefined),
  });

  const items = inventoryQuery.data?.items ?? [];

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderSearch className="w-5 h-5 text-brand-600" />
            Archivos del Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verificación de persistencia (existencia, tamaño, hash SHA-256) y vista previa sin descarga
          </p>
        </div>
        <button
          onClick={() => inventoryQuery.refetch()}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          title="Re-verificar archivos"
        >
          <RefreshCw className={`w-4 h-4 ${inventoryQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as FileKind | "")}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los tipos</option>
            {(Object.keys(KIND_LABELS) as FileKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los estados</option>
            <option value="OK">OK</option>
            <option value="DIFIERE">Difiere</option>
            <option value="NO_ENCONTRADO">No encontrado</option>
          </select>
          <span className="ml-auto text-xs text-slate-400">
            {inventoryQuery.data?.total ?? 0} archivo(s) en inventario
          </span>
        </div>

        {/* Tabla */}
        {inventoryQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Verificando archivos…</span>
          </div>
        ) : inventoryQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-medium">
              No se pudo cargar el inventario. Verifica tu sesión y permisos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Archivo</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Ubicación lógica</th>
                  <th className="py-2.5 px-4 text-right">Tamaño</th>
                  <th className="py-2.5 px-4">Persistencia</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const config = STATUS_CONFIG[item.status];
                  const { Icon } = config;
                  return (
                    <tr key={`${item.kind}-${item.record_id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-800 max-w-[220px] truncate" title={item.file_name}>
                          {item.file_name}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.reference}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {KIND_LABELS[item.kind]}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500 max-w-[220px] truncate" title={item.logical_path}>
                        {item.logical_path}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {formatBytes(item.db_size ?? item.size_on_disk)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.classes}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                          {item.hash_matches_db === true && " ✓hash"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {item.previewable && item.exists_on_disk && (
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                              title="Ver contenido en modal (sin descargar)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      <FileText className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                      No hay archivos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};
