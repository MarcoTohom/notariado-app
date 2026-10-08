import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Case, CaseCreate, CaseStatus, CaseType, CaseUpdate } from "../../types";
import { caseService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { CaseFormModal } from "./CaseFormModal";
import { CaseDetailModal } from "./CaseDetailModal";
import { CaseValidationModal } from "../validation/CaseValidationModal";
import { GenerateDocumentModal } from "../documents/GenerateDocumentModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ModuleTip } from "../../components/common/ModuleTip";
import {
  CASE_STATUS_COLORS,
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
} from "../../lib/labels";
import {
  FolderOpen,
  Search,
  Plus,
  Pencil,
  Eye,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  FileOutput,
} from "lucide-react";

const PAGE_SIZE = 10;

/** Página de gestión de expedientes notariales. */
export const CasesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CaseType | "">("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "">("");
  const [page, setPage] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [cancellingCase, setCancellingCase] = useState<Case | null>(null);
  const [validatingCase, setValidatingCase] = useState<Case | null>(null);
  const [generatingCase, setGeneratingCase] = useState<Case | null>(null);

  const canCreate = hasPermission("cases:create");
  const canUpdate = hasPermission("cases:update");
  const canDelete = hasPermission("cases:delete");
  const canValidate = hasPermission("validations:read");
  const canGenerate = hasPermission("documents:generate");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const skip = page * PAGE_SIZE;

  const casesQuery = useQuery({
    queryKey: ["cases", search, typeFilter, statusFilter, page],
    queryFn: () =>
      caseService.getCases(
        skip,
        PAGE_SIZE,
        search || undefined,
        typeFilter || undefined,
        statusFilter || undefined
      ),
  });

  const total = casesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cases"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: CaseCreate | CaseUpdate) => {
      if (editingCase) {
        await caseService.updateCase(editingCase.id, payload as CaseUpdate);
      } else {
        await caseService.createCase(payload as CaseCreate);
      }
    },
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => caseService.cancelCase(id),
    onSuccess: () => {
      invalidate();
      setCancellingCase(null);
    },
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-600" />
            Expedientes Notariales
            <ModuleTip
              anchor="expediente"
              tipText="El expediente es la carpeta del caso legal: agrupa comparecientes, datos, validaciones y borradores. Primero se apertura el expediente, luego se capturan sus datos y finalmente se genera el borrador desde la plantilla activa."
            />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralización de documentación, comparecientes, borradores y finanzas por caso
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingCase(null);
              setFormOpen(true);
            }}
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Expediente
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
              placeholder="Buscar por número, título o descripción…"
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
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CaseStatus | "");
              setPage(0);
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map((s) => (
              <option key={s} value={s}>
                {CASE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => casesQuery.refetch()}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${casesQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabla */}
        {casesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Cargando expedientes…</span>
          </div>
        ) : casesQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-medium">
              No se pudieron cargar los expedientes. Verifica tu sesión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">No. Expediente</th>
                  <th className="py-2.5 px-4">Título</th>
                  <th className="py-2.5 px-4">Tipo de Escritura</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-center">Comparecientes</th>
                  <th className="py-2.5 px-4">Apertura</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(casesQuery.data?.items ?? []).map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {caseItem.case_number}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700 max-w-xs truncate" title={caseItem.title}>
                      {caseItem.title}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {CASE_TYPE_LABELS[caseItem.case_type]}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${CASE_STATUS_COLORS[caseItem.status]}`}
                      >
                        {CASE_STATUS_LABELS[caseItem.status]}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-600">
                      {caseItem.parties.length}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(caseItem.created_at).toLocaleDateString("es-GT")}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailCaseId(caseItem.id)}
                          className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                          title="Ver detalle y comparecientes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canValidate && (
                          <button
                            onClick={() => setValidatingCase(caseItem)}
                            className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                            title="Validar consistencia documental (RULE-001..020)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canGenerate && caseItem.status !== "CANCELADO" && (
                          <button
                            onClick={() => setGeneratingCase(caseItem)}
                            className="text-slate-400 hover:text-brand-700 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                            title="Generar borrador DOCX verificado"
                          >
                            <FileOutput className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canUpdate && caseItem.status !== "CANCELADO" && (
                          <button
                            onClick={() => {
                              setEditingCase(caseItem);
                              setFormOpen(true);
                            }}
                            className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                            title="Editar expediente"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && caseItem.status !== "CANCELADO" && (
                          <button
                            onClick={() => setCancellingCase(caseItem)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Cancelar expediente"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(casesQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No hay expedientes registrados{search ? ` para «${search}»` : ""}.
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
            Mostrando página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> • {total} expediente(s)
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
      <CaseFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={(payload) => saveMutation.mutateAsync(payload)}
        initialData={editingCase}
      />
      <CaseDetailModal caseId={detailCaseId} onClose={() => setDetailCaseId(null)} />
      <CaseValidationModal caseItem={validatingCase} onClose={() => setValidatingCase(null)} />
      <GenerateDocumentModal caseItem={generatingCase} onClose={() => setGeneratingCase(null)} />
      <ConfirmDialog
        isOpen={Boolean(cancellingCase)}
        title="Cancelar expediente"
        message={`El expediente «${cancellingCase?.case_number}» pasará al estado CANCELADO. Se conservará toda su información para trazabilidad, pero dejará de estar operativo.`}
        confirmLabel="Cancelar expediente"
        loading={cancelMutation.isPending}
        onConfirm={() => cancellingCase && cancelMutation.mutate(cancellingCase.id)}
        onCancel={() => setCancellingCase(null)}
      />
    </div>
  );
};
