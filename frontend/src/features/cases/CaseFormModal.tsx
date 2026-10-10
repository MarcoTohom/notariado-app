import { Modal, ModalActions } from "../../components/common/Modal";
import { ErrorNotice, FieldError } from "../../components/common/Feedback";
import { inputClass, labelClass } from "../../components/common/formStyles";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Case, CaseCreate, CaseUpdate, PartyRole } from "./types";
import type { CaseType } from "../../shared/types";
import type { Client } from "../clients/types";
import { caseSchema, CaseFormValues, cleanOptional } from "../../lib/validators";
import {
  CASE_TYPE_LABELS,
  PARTY_ROLE_LABELS,
  SUGGESTED_ROLES_BY_CASE_TYPE,
} from "../../lib/labels";
import { getApiErrorMessage } from "../../shared/api/errors";
import { ClientSearchSelect } from "../../components/common/ClientSearchSelect";
import { FolderOpen, Save, Plus, Trash2 } from "lucide-react";

interface PendingParty {
  client: Client;
  party_role: PartyRole;
  notes: string;
}

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CaseCreate | CaseUpdate) => Promise<void>;
  initialData?: Case | null;
}

const ALL_ROLES = Object.keys(PARTY_ROLE_LABELS) as PartyRole[];





export const CaseFormModal: React.FC<CaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const isEdit = Boolean(initialData);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Constructor de comparecientes iniciales (solo en modo creación)
  const [pendingParties, setPendingParties] = useState<PendingParty[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRole, setSelectedRole] = useState<PartyRole>("COMPRADOR");
  const [partyNotes, setPartyNotes] = useState("");
  const [partyError, setPartyError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      case_type: "COMPRAVENTA",
      description: "",
      internal_notes: "",
      instrument_number: "",
      protocol_folio: "",
      protocol_book: "",
    },
  });

  const caseType = watch("case_type") as CaseType;
  const suggestedRoles = SUGGESTED_ROLES_BY_CASE_TYPE[caseType] ?? [];
  const orderedRoles = [...suggestedRoles, ...ALL_ROLES.filter((r) => !suggestedRoles.includes(r))];

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setPartyError(null);
      setPendingParties([]);
      setSelectedClient(null);
      setPartyNotes("");
      setSelectedRole(SUGGESTED_ROLES_BY_CASE_TYPE[initialData?.case_type ?? "COMPRAVENTA"][0]);
      reset({
        title: initialData?.title ?? "",
        case_type: initialData?.case_type ?? "COMPRAVENTA",
        description: initialData?.description ?? "",
        internal_notes: initialData?.internal_notes ?? "",
        instrument_number: initialData?.instrument_number ?? "",
        protocol_folio: initialData?.protocol_folio ?? "",
        protocol_book: initialData?.protocol_book ?? "",
      });
    }
  }, [isOpen, initialData, reset]);

  // Al cambiar el tipo de escritura, sugerir el rol principal correspondiente
  useEffect(() => {
    if (!isEdit && isOpen) {
      setSelectedRole(SUGGESTED_ROLES_BY_CASE_TYPE[caseType][0]);
    }
  }, [caseType, isEdit, isOpen]);

  if (!isOpen) return null;

  const addPendingParty = () => {
    setPartyError(null);
    if (!selectedClient) {
      setPartyError("Selecciona un cliente del buscador.");
      return;
    }
    if (pendingParties.some((p) => p.client.id === selectedClient.id)) {
      setPartyError("Este cliente ya fue agregado como compareciente.");
      return;
    }
    setPendingParties((prev) => [
      ...prev,
      { client: selectedClient, party_role: selectedRole, notes: partyNotes.trim() },
    ]);
    setSelectedClient(null);
    setPartyNotes("");
  };

  const removePendingParty = (clientId: string) => {
    setPendingParties((prev) => prev.filter((p) => p.client.id !== clientId));
  };

  const submit = async (values: CaseFormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit) {
        const payload: CaseUpdate = {
          title: values.title,
          description: cleanOptional(values.description),
          internal_notes: cleanOptional(values.internal_notes),
          instrument_number: cleanOptional(values.instrument_number),
          protocol_folio: cleanOptional(values.protocol_folio),
          protocol_book: cleanOptional(values.protocol_book),
        };
        await onSave(payload);
      } else {
        const payload: CaseCreate = {
          title: values.title,
          case_type: values.case_type,
          description: cleanOptional(values.description),
          internal_notes: cleanOptional(values.internal_notes),
          instrument_number: cleanOptional(values.instrument_number),
          protocol_folio: cleanOptional(values.protocol_folio),
          protocol_book: cleanOptional(values.protocol_book),
          parties: pendingParties.map((p, index) => ({
            client_id: p.client.id,
            party_role: p.party_role,
            notes: p.notes || undefined,
            order_index: index,
          })),
        };
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, "No se pudo guardar el expediente."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<>{isEdit ? "Editar Expediente" : "Aperturar Expediente Notarial"}</>}
      subtitle={<>{isEdit
        ? `Expediente ${initialData?.case_number}`
        : "Se generará el correlativo EXP-AAAA-##### automáticamente"}</>}
      icon={<FolderOpen className="w-5 h-5" />}
      onClose={onClose}
      size="3xl"
    >

      {/* Formulario */}
      <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto p-5">
        {serverError && (
          <ErrorNotice className="mb-4">
            {serverError}
          </ErrorNotice>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelClass}>
              Título del Expediente <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ej. Compraventa de inmueble Lote 12, zona 10"
              className={inputClass}
              {...register("title")}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="case_type" className={labelClass}>
              Tipo de Escritura <span className="text-red-500">*</span>
            </label>
            <select id="case_type" className={inputClass} {...register("case_type")} disabled={isEdit}>
              {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map((t) => (
                <option key={t} value={t}>
                  {CASE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.case_type && <FieldError>{errors.case_type.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="instrument_number" className={labelClass}>
              Número de Instrumento
            </label>
            <input id="instrument_number" type="text" className={inputClass} {...register("instrument_number")} />
            {errors.instrument_number && <FieldError>{errors.instrument_number.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="protocol_folio" className={labelClass}>
              Folio de Protocolo
            </label>
            <input id="protocol_folio" type="text" className={inputClass} {...register("protocol_folio")} />
            {errors.protocol_folio && <FieldError>{errors.protocol_folio.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="protocol_book" className={labelClass}>
              Libro de Protocolo
            </label>
            <input id="protocol_book" type="text" className={inputClass} {...register("protocol_book")} />
            {errors.protocol_book && <FieldError>{errors.protocol_book.message}</FieldError>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Descripción
            </label>
            <textarea id="description" rows={2} className={inputClass} {...register("description")} />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="internal_notes" className={labelClass}>
              Notas Internas
            </label>
            <textarea id="internal_notes" rows={2} className={inputClass} {...register("internal_notes")} />
            {errors.internal_notes && <FieldError>{errors.internal_notes.message}</FieldError>}
          </div>
        </div>

        {/* Constructor de comparecientes (solo creación) */}
        {!isEdit && (
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
              Comparecientes Iniciales (opcional)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
              <div>
                <label className={labelClass}>Cliente</label>
                <ClientSearchSelect value={selectedClient} onChange={setSelectedClient} />
              </div>
              <div>
                <label htmlFor="party_role" className={labelClass}>
                  Rol Compareciente
                </label>
                <select
                  id="party_role"
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
                <label htmlFor="party_notes" className={labelClass}>
                  Notas del Compareciente
                </label>
                <div className="flex gap-2">
                  <input
                    id="party_notes"
                    type="text"
                    value={partyNotes}
                    onChange={(e) => setPartyNotes(e.target.value)}
                    placeholder="Ej. Comparece por sus propios derechos"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addPendingParty}
                    className="shrink-0 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {partyError && <FieldError>{partyError}</FieldError>}

            {pendingParties.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {pendingParties.map((party) => (
                  <li
                    key={party.client.id}
                    className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {party.client.first_name} {party.client.last_name}
                        <span className="ml-2 font-mono text-[10px] text-slate-400">{party.client.dpi}</span>
                      </p>
                      {party.notes && <p className="text-[10px] text-slate-500 truncate">{party.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                        {PARTY_ROLE_LABELS[party.party_role]}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingParty(party.client.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer */}
        <ModalActions>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? "Guardando…" : isEdit ? "Guardar Cambios" : "Aperturar Expediente"}
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
};
