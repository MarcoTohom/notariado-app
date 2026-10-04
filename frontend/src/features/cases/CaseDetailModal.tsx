import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaseStatus, Client, PartyRole } from "../../types";
import { caseService, getApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  CASE_STATUS_COLORS,
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
  PARTY_ROLE_LABELS,
  SUGGESTED_ROLES_BY_CASE_TYPE,
} from "../../lib/labels";
import { ClientSearchSelect } from "../../components/common/ClientSearchSelect";
import { X, FolderOpen, Plus, Trash2, Loader2, Users } from "lucide-react";

interface CaseDetailModalProps {
  caseId: string | null;
  onClose: () => void;
}

const ALL_ROLES = Object.keys(PARTY_ROLE_LABELS) as PartyRole[];
const ALL_STATUSES = Object.keys(CASE_STATUS_LABELS) as CaseStatus[];

const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

/** Detalle de expediente: ficha, comparecientes (agregar/quitar) y cambio de estado. */
export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ caseId, onClose }) => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission("cases:update");

  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRole, setSelectedRole] = useState<PartyRole>("COMPRADOR");
  const [partyNotes, setPartyNotes] = useState("");

  const caseQuery = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => caseService.getCase(caseId as string),
    enabled: Boolean(caseId),
  });

  const caseData = caseQuery.data;
  const suggestedRoles = caseData ? SUGGESTED_ROLES_BY_CASE_TYPE[caseData.case_type] : [];
  const orderedRoles = [...suggestedRoles, ...ALL_ROLES.filter((r) => !suggestedRoles.includes(r))];

  useEffect(() => {
    if (caseData) {
      setSelectedRole(SUGGESTED_ROLES_BY_CASE_TYPE[caseData.case_type][0]);
    }
    setActionError(null);
    setSelectedClient(null);
    setPartyNotes("");
  }, [caseId, caseData?.id]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["cases"] });
  };

  const addPartyMutation = useMutation({
    mutationFn: () =>
      caseService.addParty(caseId as string, {
        client_id: selectedClient?.id as string,
        party_role: selectedRole,
        notes: partyNotes.trim() || undefined,
        order_index: caseData?.parties.length ?? 0,
      }),
    onSuccess: () => {
      invalidate();
      setSelectedClient(null);
      setPartyNotes("");
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo agregar el compareciente.")),
  });

  const removePartyMutation = useMutation({
    mutationFn: (partyId: string) => caseService.removeParty(caseId as string, partyId),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo quitar el compareciente.")),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: CaseStatus) =>
      caseService.updateCase(caseId as string, { status: newStatus }),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo actualizar el estado.")),
  });

  if (!caseId) return null;

  const handleAddParty = () => {
    setActionError(null);
    if (!selectedClient) {
      setActionError("Selecciona un cliente del buscador para agregarlo.");
      return;
    }
    if (caseData?.parties.some((p) => p.client_id === selectedClient.id)) {
      setActionError("Este cliente ya comparece en el expediente.");
      return;
    }
    addPartyMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-mono">
                {caseData?.case_number ?? "Cargando…"}
              </h3>
              <p className="text-xs text-slate-400">
                {caseData ? CASE_TYPE_LABELS[caseData.case_type] : "Expediente notarial"}
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
          {caseQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-xs">Cargando expediente…</span>
            </div>
          ) : !caseData ? (
            <p className="py-16 text-center text-xs text-red-600">No se pudo cargar el expediente.</p>
          ) : (
            <div className="space-y-5">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg">
                  {actionError}
                </div>
              )}

              {/* Ficha del expediente */}
              <section>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">{caseData.title}</h4>
                    {caseData.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{caseData.description}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${CASE_STATUS_COLORS[caseData.status]}`}
                  >
                    {CASE_STATUS_LABELS[caseData.status]}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase">Instrumento</dt>
                    <dd className="font-mono text-slate-700 mt-0.5">{caseData.instrument_number || "—"}</dd>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase">Folio Protocolo</dt>
                    <dd className="font-mono text-slate-700 mt-0.5">{caseData.protocol_folio || "—"}</dd>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase">Libro Protocolo</dt>
                    <dd className="font-mono text-slate-700 mt-0.5">{caseData.protocol_book || "—"}</dd>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase">Apertura</dt>
                    <dd className="font-mono text-slate-700 mt-0.5">
                      {new Date(caseData.created_at).toLocaleDateString("es-GT")}
                    </dd>
                  </div>
                </dl>

                {/* Cambio de estado */}
                {canUpdate && (
                  <div className="mt-3 flex items-center gap-2">
                    <label htmlFor="case_status" className="text-xs font-semibold text-slate-600">
                      Cambiar estado:
                    </label>
                    <select
                      id="case_status"
                      value={caseData.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) => statusMutation.mutate(e.target.value as CaseStatus)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {CASE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                  </div>
                )}
              </section>

              {/* Comparecientes */}
              <section className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <Users className="w-4 h-4 text-brand-600" />
                  Comparecientes ({caseData.parties.length})
                </h4>

                {caseData.parties.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-4 text-center">
                    Aún no hay comparecientes registrados en este expediente.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {caseData.parties.map((party) => (
                      <li
                        key={party.id}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {party.client
                              ? `${party.client.first_name} ${party.client.last_name}`
                              : "Cliente no disponible"}
                            {party.client && (
                              <span className="ml-2 font-mono text-[10px] text-slate-400">
                                DPI: {party.client.dpi}
                              </span>
                            )}
                          </p>
                          {party.notes && <p className="text-[10px] text-slate-500 truncate">{party.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                            {PARTY_ROLE_LABELS[party.party_role] ?? party.party_role}
                          </span>
                          {canUpdate && (
                            <button
                              onClick={() => removePartyMutation.mutate(party.id)}
                              disabled={removePartyMutation.isPending}
                              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Quitar compareciente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Agregar compareciente */}
                {canUpdate && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                      Agregar Compareciente
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                      <div>
                        <label className={labelClass}>Cliente</label>
                        <ClientSearchSelect value={selectedClient} onChange={setSelectedClient} />
                      </div>
                      <div>
                        <label htmlFor="detail_party_role" className={labelClass}>
                          Rol
                        </label>
                        <select
                          id="detail_party_role"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as PartyRole)}
                          className={inputClass}
                        >
                          {orderedRoles.map((role) => (
                            <option key={role} value={role}>
                              {PARTY_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="detail_party_notes" className={labelClass}>
                          Notas
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="detail_party_notes"
                            type="text"
                            value={partyNotes}
                            onChange={(e) => setPartyNotes(e.target.value)}
                            placeholder="Ej. Comparece en representación"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={handleAddParty}
                            disabled={addPartyMutation.isPending}
                            className="shrink-0 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                          >
                            {addPartyMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
