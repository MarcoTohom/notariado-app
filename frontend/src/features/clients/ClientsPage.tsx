import { Badge } from "../../components/common/Badge";
import { LoadingState } from "../../components/common/Feedback";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Client, ClientCreate, ClientUpdate, LegalEntity, LegalEntityCreate } from "./types";
import { clientService, legalEntityService } from "./api";
import { useAuth } from "../auth/AuthContext";
import { ClientFormModal } from "./ClientFormModal";
import { LegalEntityFormModal } from "./LegalEntityFormModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { MARITAL_STATUS_LABELS, SOCIETY_TYPE_LABELS } from "../../lib/labels";
import {
  Users,
  Building2,
  Search,
  Plus,
  Pencil,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

type ClientTab = "individual" | "juridica";

/** Página de gestión de clientes: personas individuales y personas jurídicas. */
export const ClientsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<ClientTab>("individual");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null);

  const [entityFormOpen, setEntityFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [deactivatingEntity, setDeactivatingEntity] = useState<LegalEntity | null>(null);

  const canCreate = hasPermission("clients:create");
  const canUpdate = hasPermission("clients:update");
  const canDelete = hasPermission("clients:delete");

  // Búsqueda debounced: evita consultas por cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const skip = page * PAGE_SIZE;

  const clientsQuery = useQuery({
    queryKey: ["clients", search, page],
    queryFn: () => clientService.getClients(skip, PAGE_SIZE, search || undefined),
    enabled: tab === "individual",
  });

  const entitiesQuery = useQuery({
    queryKey: ["legal-entities", search, page],
    queryFn: () => legalEntityService.getLegalEntities(skip, PAGE_SIZE, search || undefined),
    enabled: tab === "juridica",
  });

  const activeQuery = tab === "individual" ? clientsQuery : entitiesQuery;
  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
  };

  const saveClientMutation = useMutation({
    mutationFn: async (payload: ClientCreate | ClientUpdate) => {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, payload as ClientUpdate);
      } else {
        await clientService.createClient(payload as ClientCreate);
      }
    },
    onSuccess: invalidate,
  });

  const saveEntityMutation = useMutation({
    mutationFn: async (payload: LegalEntityCreate | Partial<LegalEntityCreate>) => {
      if (editingEntity) {
        await legalEntityService.updateLegalEntity(editingEntity.id, payload);
      } else {
        await legalEntityService.createLegalEntity(payload as LegalEntityCreate);
      }
    },
    onSuccess: invalidate,
  });

  const deactivateClientMutation = useMutation({
    mutationFn: (id: string) => clientService.deactivateClient(id),
    onSuccess: () => {
      invalidate();
      setDeactivatingClient(null);
    },
  });

  const deactivateEntityMutation = useMutation({
    mutationFn: (id: string) => legalEntityService.deactivateLegalEntity(id),
    onSuccess: () => {
      invalidate();
      setDeactivatingEntity(null);
    },
  });

  const statusBadge = (status: string) => (
    <Badge className={`${status === "ACTIVE"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}>
      {status === "ACTIVE" ? "ACTIVO" : "INACTIVO"}
    </Badge>
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Gestión de Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sujetos de derecho reutilizables en instrumentos notariales • DPI y NIT almacenados como texto
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              if (tab === "individual") {
                setEditingClient(null);
                setClientFormOpen(true);
              } else {
                setEditingEntity(null);
                setEntityFormOpen(true);
              }
            }}
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {tab === "individual" ? "Nuevo Cliente" : "Nueva Persona Jurídica"}
          </button>
        )}
      </div>

      {/* Tabs + Buscador */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTab("individual");
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${tab === "individual"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              Personas Individuales
            </button>
            <button
              onClick={() => {
                setTab("juridica");
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${tab === "juridica"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Personas Jurídicas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={tab === "individual" ? "Buscar por nombre, DPI o NIT…" : "Buscar por razón social o NIT…"}
                className="border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => activeQuery.refetch()}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${activeQuery.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        {activeQuery.isLoading ? (
          <LoadingState className="py-16">

            <span className="text-xs">Cargando registros…</span>
          </LoadingState>
        ) : activeQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-medium">No se pudieron cargar los datos. Verifica tu sesión.</p>
          </div>
        ) : tab === "individual" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Nombre Completo</th>
                  <th className="py-2.5 px-4">DPI</th>
                  <th className="py-2.5 px-4">NIT</th>
                  <th className="py-2.5 px-4">Estado Civil</th>
                  <th className="py-2.5 px-4">Teléfono</th>
                  <th className="py-2.5 px-4">Estado</th>
                  {(canUpdate || canDelete) && <th className="py-2.5 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(clientsQuery.data?.items ?? []).map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {client.first_name} {client.last_name}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{client.dpi}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{client.nit || "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {client.marital_status ? MARITAL_STATUS_LABELS[client.marital_status] ?? client.marital_status : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{client.phone || "—"}</td>
                    <td className="py-2.5 px-4">{statusBadge(client.status)}</td>
                    {(canUpdate || canDelete) && (
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setEditingClient(client);
                                setClientFormOpen(true);
                              }}
                              className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                              title="Editar cliente"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && client.status === "ACTIVE" && (
                            <button
                              onClick={() => setDeactivatingClient(client)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              title="Baja lógica"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(clientsQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No hay clientes registrados{search ? ` para «${search}»` : ""}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Razón Social</th>
                  <th className="py-2.5 px-4">NIT</th>
                  <th className="py-2.5 px-4">Tipo de Sociedad</th>
                  <th className="py-2.5 px-4">Representante Legal</th>
                  <th className="py-2.5 px-4">Teléfono</th>
                  <th className="py-2.5 px-4">Estado</th>
                  {(canUpdate || canDelete) && <th className="py-2.5 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(entitiesQuery.data?.items ?? []).map((entity) => (
                  <tr key={entity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-800">{entity.business_name}</p>
                      {entity.trade_name && <p className="text-[10px] text-slate-400">{entity.trade_name}</p>}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{entity.nit}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {SOCIETY_TYPE_LABELS[entity.society_type] ?? entity.society_type}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {entity.legal_representative
                        ? `${entity.legal_representative.first_name} ${entity.legal_representative.last_name}`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{entity.phone || "—"}</td>
                    <td className="py-2.5 px-4">{statusBadge(entity.status)}</td>
                    {(canUpdate || canDelete) && (
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setEditingEntity(entity);
                                setEntityFormOpen(true);
                              }}
                              className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors"
                              title="Editar persona jurídica"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && entity.status === "ACTIVE" && (
                            <button
                              onClick={() => setDeactivatingEntity(entity)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              title="Baja lógica"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(entitiesQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No hay personas jurídicas registradas{search ? ` para «${search}»` : ""}.
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
            Mostrando página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> • {total} registro(s)
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
      <ClientFormModal
        isOpen={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSave={(payload) => saveClientMutation.mutateAsync(payload)}
        initialData={editingClient}
      />
      <LegalEntityFormModal
        isOpen={entityFormOpen}
        onClose={() => setEntityFormOpen(false)}
        onSave={(payload) => saveEntityMutation.mutateAsync(payload)}
        initialData={editingEntity}
      />
      <ConfirmDialog
        isOpen={Boolean(deactivatingClient)}
        title="Dar de baja cliente"
        message={`Se marcará a «${deactivatingClient?.first_name} ${deactivatingClient?.last_name}» como INACTIVO. El registro se conserva para trazabilidad notarial y no podrá asignarse a nuevos expedientes.`}
        confirmLabel="Dar de baja"
        loading={deactivateClientMutation.isPending}
        onConfirm={() => deactivatingClient && deactivateClientMutation.mutate(deactivatingClient.id)}
        onCancel={() => setDeactivatingClient(null)}
      />
      <ConfirmDialog
        isOpen={Boolean(deactivatingEntity)}
        title="Dar de baja persona jurídica"
        message={`Se marcará a «${deactivatingEntity?.business_name}» como INACTIVA. El registro se conserva para trazabilidad notarial.`}
        confirmLabel="Dar de baja"
        loading={deactivateEntityMutation.isPending}
        onConfirm={() => deactivatingEntity && deactivateEntityMutation.mutate(deactivatingEntity.id)}
        onCancel={() => setDeactivatingEntity(null)}
      />
    </div>
  );
};
