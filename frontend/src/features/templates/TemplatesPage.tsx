import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaseType, TemplateSummary } from "../../types";
import { templateService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { TemplateUploadModal } from "./TemplateUploadModal";
import { TemplateDetailModal } from "./TemplateDetailModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const PAGE_SIZE = 10;

/** Repositorio de plantillas DOCX con versionamiento inmutable (Fase 5). */
export const TemplatesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CaseType | "">("");
  const [page, setPage] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<TemplateSummary | null>(null);

  const canCreate = hasPermission("templates:create");
  const canDelete = hasPermission("templates:delete");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const skip = page * PAGE_SIZE;

  const templatesQuery = useQuery({
    queryKey: ["templates", search, typeFilter, page],
    queryFn: () =>
      templateService.getTemplates(skip, PAGE_SIZE, search || undefined, typeFilter || undefined),
  });

  const total = templatesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    queryClient.invalidateQueries({ queryKey: ["template"] });
  };

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => templateService.uploadTemplate(formData),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => templateService.deactivateTemplate(id),
    onSuccess: () => {
      invalidate();
      setDeactivating(null);
    },
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Plantillas de Escrituras DOCX
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Repositorio con versionamiento inmutable • Variables Jinja2 detectadas automáticamente
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setUploadOpen(true)}
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Plantilla
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o descripción…"
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as CaseType | "");
              setPage(0);
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los tipos</option>
            {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map((t) => (
              <option key={t} value={t}>
                {CASE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            onClick={() => templatesQuery.refetch()}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${templatesQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabla */}
        {templatesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Cargando plantillas…</span>
          </div>
        ) : templatesQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-medium">
              No se pudieron cargar las plantillas. Verifica tu sesión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Plantilla</th>
                  <th className="py-2.5 px-4">Tipo de Escritura</th>
                  <th className="py-2.5 px-4 text-center">Versiones</th>
                  <th className="py-2.5 px-4">Versión Vigente</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Creada</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(templatesQuery.data?.items ?? []).map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-800">{template.name}</p>
                      {template.description && (
                        <p className="text-[10px] text-slate-400 max-w-xs truncate" title={template.description}>
                          {template.description}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {CASE_TYPE_LABELS[template.case_type]}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600">
                      {template.versions_count}
                    </td>
                    <td className="py-2.5 px-4">
                      {template.active_version_id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activada
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin activar</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          template.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {template.status === "ACTIVE" ? "ACTIVA" : "INACTIVA"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(template.created_at).toLocaleDateString("es-GT")}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailTemplateId(template.id)}
                          className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                          title="Versiones, variables y render de prueba"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && template.status === "ACTIVE" && (
                          <button
                            onClick={() => setDeactivating(template)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Baja lógica"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(templatesQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No hay plantillas registradas{search ? ` para «${search}»` : ""}.
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
            Mostrando página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> • {total} plantilla(s)
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

      {/* Modales */}
      <TemplateUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={async (formData) => {
          await uploadMutation.mutateAsync(formData);
        }}
      />
      <TemplateDetailModal
        templateId={detailTemplateId}
        onClose={() => setDetailTemplateId(null)}
      />
      <ConfirmDialog
        isOpen={Boolean(deactivating)}
        title="Dar de baja plantilla"
        message={`Se marcará «${deactivating?.name}» como INACTIVA. Todo su historial de versiones DOCX se conserva en solo lectura para trazabilidad notarial.`}
        confirmLabel="Dar de baja"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivating && deactivateMutation.mutate(deactivating.id)}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  );
};
