import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, LegalEntity, LegalEntityCreate } from "../../types";
import { legalEntitySchema, LegalEntityFormValues, cleanOptional } from "../../lib/validators";
import { SOCIETY_TYPE_OPTIONS } from "../../lib/labels";
import { getApiErrorMessage } from "../../services/api";
import { ClientSearchSelect } from "../../components/common/ClientSearchSelect";
import { X, Building2, Save } from "lucide-react";

interface LegalEntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: LegalEntityCreate | Partial<LegalEntityCreate>) => Promise<void>;
  initialData?: LegalEntity | null;
}

const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
const errorClass = "text-[11px] text-red-600 mt-1";

export const LegalEntityFormModal: React.FC<LegalEntityFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const isEdit = Boolean(initialData);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [representative, setRepresentative] = useState<Client | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LegalEntityFormValues>({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      business_name: "",
      trade_name: "",
      nit: "",
      society_type: "SOCIEDAD_ANONIMA",
      registry_number: "",
      registry_folio: "",
      registry_book: "",
      representative_position: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setRepresentative(initialData?.legal_representative ?? null);
      reset({
        business_name: initialData?.business_name ?? "",
        trade_name: initialData?.trade_name ?? "",
        nit: initialData?.nit ?? "",
        society_type: initialData?.society_type ?? "SOCIEDAD_ANONIMA",
        registry_number: initialData?.registry_number ?? "",
        registry_folio: initialData?.registry_folio ?? "",
        registry_book: initialData?.registry_book ?? "",
        representative_position: initialData?.representative_position ?? "",
        address: initialData?.address ?? "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
      });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const submit = async (values: LegalEntityFormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload: LegalEntityCreate = {
        business_name: values.business_name,
        trade_name: cleanOptional(values.trade_name),
        nit: values.nit,
        society_type: values.society_type,
        registry_number: cleanOptional(values.registry_number),
        registry_folio: cleanOptional(values.registry_folio),
        registry_book: cleanOptional(values.registry_book),
        legal_representative_id: representative?.id,
        representative_position: cleanOptional(values.representative_position),
        address: cleanOptional(values.address),
        phone: cleanOptional(values.phone),
        email: cleanOptional(values.email),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, "No se pudo guardar la persona jurídica."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEdit ? "Editar Persona Jurídica" : "Registrar Persona Jurídica"}
              </h3>
              <p className="text-xs text-slate-400">Sociedades, asociaciones y fundaciones • NIT como texto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto p-5">
          {serverError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="business_name" className={labelClass}>
                Razón Social <span className="text-red-500">*</span>
              </label>
              <input id="business_name" type="text" className={inputClass} {...register("business_name")} />
              {errors.business_name && <p className={errorClass}>{errors.business_name.message}</p>}
            </div>

            <div>
              <label htmlFor="trade_name" className={labelClass}>
                Nombre Comercial
              </label>
              <input id="trade_name" type="text" className={inputClass} {...register("trade_name")} />
              {errors.trade_name && <p className={errorClass}>{errors.trade_name.message}</p>}
            </div>

            <div>
              <label htmlFor="nit" className={labelClass}>
                NIT <span className="text-red-500">*</span>
              </label>
              <input
                id="nit"
                type="text"
                placeholder="1234567-8"
                className={`${inputClass} font-mono`}
                {...register("nit")}
              />
              {errors.nit && <p className={errorClass}>{errors.nit.message}</p>}
            </div>

            <div>
              <label htmlFor="society_type" className={labelClass}>
                Tipo de Sociedad <span className="text-red-500">*</span>
              </label>
              <select id="society_type" className={inputClass} {...register("society_type")}>
                {SOCIETY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.society_type && <p className={errorClass}>{errors.society_type.message}</p>}
            </div>

            {/* Datos registrales mercantiles */}
            <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                Datos Registrales (Registro Mercantil)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="registry_number" className={labelClass}>
                    No. Registro
                  </label>
                  <input id="registry_number" type="text" className={inputClass} {...register("registry_number")} />
                  {errors.registry_number && <p className={errorClass}>{errors.registry_number.message}</p>}
                </div>
                <div>
                  <label htmlFor="registry_folio" className={labelClass}>
                    Folio
                  </label>
                  <input id="registry_folio" type="text" className={inputClass} {...register("registry_folio")} />
                  {errors.registry_folio && <p className={errorClass}>{errors.registry_folio.message}</p>}
                </div>
                <div>
                  <label htmlFor="registry_book" className={labelClass}>
                    Libro
                  </label>
                  <input id="registry_book" type="text" className={inputClass} {...register("registry_book")} />
                  {errors.registry_book && <p className={errorClass}>{errors.registry_book.message}</p>}
                </div>
              </div>
            </div>

            {/* Representante legal */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Representante Legal (persona individual registrada)</label>
              <ClientSearchSelect value={representative} onChange={setRepresentative} />
            </div>

            <div>
              <label htmlFor="representative_position" className={labelClass}>
                Cargo del Representante
              </label>
              <input
                id="representative_position"
                type="text"
                placeholder="Ej. Gerente General"
                className={inputClass}
                {...register("representative_position")}
              />
              {errors.representative_position && (
                <p className={errorClass}>{errors.representative_position.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Teléfono
              </label>
              <input id="phone" type="text" className={inputClass} {...register("phone")} />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Correo Electrónico
              </label>
              <input id="email" type="email" className={inputClass} {...register("email")} />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="address" className={labelClass}>
                Dirección
              </label>
              <input id="address" type="text" className={inputClass} {...register("address")} />
              {errors.address && <p className={errorClass}>{errors.address.message}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
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
              {submitting ? "Guardando…" : isEdit ? "Guardar Cambios" : "Registrar Persona Jurídica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
