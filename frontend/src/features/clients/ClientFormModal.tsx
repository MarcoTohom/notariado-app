import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Client, ClientCreate, ClientUpdate } from "./types";
import { clientSchema, ClientFormValues, cleanOptional, maskDpiInput } from "../../lib/validators";
import { MARITAL_STATUS_OPTIONS } from "../../lib/labels";
import { getApiErrorMessage } from "../../shared/api/errors";
import { X, UserPlus, Save } from "lucide-react";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Guarda el cliente; debe lanzar el error de la API para mostrarlo inline. */
  onSave: (payload: ClientCreate | ClientUpdate) => Promise<void>;
  /** Si se provee, el modal opera en modo edición (DPI inmutable). */
  initialData?: Client | null;
}

const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
const errorClass = "text-[11px] text-red-600 mt-1";

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const isEdit = Boolean(initialData);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      dpi: "",
      nit: "",
      marital_status: "",
      profession: "",
      nationality: "GUATEMALTECA",
      birth_date: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      reset({
        first_name: initialData?.first_name ?? "",
        last_name: initialData?.last_name ?? "",
        dpi: initialData?.dpi ?? "",
        nit: initialData?.nit ?? "",
        marital_status: initialData?.marital_status ?? "",
        profession: initialData?.profession ?? "",
        nationality: initialData?.nationality ?? "GUATEMALTECA",
        birth_date: initialData?.birth_date ?? "",
        address: initialData?.address ?? "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
      });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const submit = async (values: ClientFormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit) {
        const payload: ClientUpdate = {
          first_name: values.first_name,
          last_name: values.last_name,
          nit: cleanOptional(values.nit),
          marital_status: cleanOptional(values.marital_status),
          profession: cleanOptional(values.profession),
          nationality: values.nationality,
          birth_date: cleanOptional(values.birth_date),
          address: cleanOptional(values.address),
          phone: cleanOptional(values.phone),
          email: cleanOptional(values.email),
        };
        await onSave(payload);
      } else {
        const payload: ClientCreate = {
          first_name: values.first_name,
          last_name: values.last_name,
          dpi: values.dpi,
          nit: cleanOptional(values.nit),
          marital_status: cleanOptional(values.marital_status),
          profession: cleanOptional(values.profession),
          nationality: values.nationality,
          birth_date: cleanOptional(values.birth_date),
          address: cleanOptional(values.address),
          phone: cleanOptional(values.phone),
          email: cleanOptional(values.email),
        };
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, "No se pudo guardar el cliente."));
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEdit ? "Editar Cliente" : "Registrar Cliente"}
              </h3>
              <p className="text-xs text-slate-400">Persona individual • DPI como texto de 13 dígitos</p>
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
              <label htmlFor="first_name" className={labelClass}>
                Nombres <span className="text-red-500">*</span>
              </label>
              <input id="first_name" type="text" className={inputClass} {...register("first_name")} />
              {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className={labelClass}>
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input id="last_name" type="text" className={inputClass} {...register("last_name")} />
              {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
            </div>

            <div>
              <label htmlFor="dpi" className={labelClass}>
                DPI (CUI) <span className="text-red-500">*</span>
              </label>
              <Controller
                name="dpi"
                control={control}
                render={({ field }) => (
                  <input
                    id="dpi"
                    type="text"
                    inputMode="numeric"
                    maxLength={13}
                    placeholder="13 dígitos sin espacios"
                    disabled={isEdit}
                    className={`${inputClass} font-mono ${isEdit ? "bg-slate-100 text-slate-500" : ""}`}
                    value={field.value}
                    onChange={(e) => field.onChange(maskDpiInput(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              {errors.dpi && <p className={errorClass}>{errors.dpi.message}</p>}
            </div>

            <div>
              <label htmlFor="nit" className={labelClass}>
                NIT
              </label>
              <input
                id="nit"
                type="text"
                placeholder="1234567-8 o CF"
                className={`${inputClass} font-mono`}
                {...register("nit")}
              />
              {errors.nit && <p className={errorClass}>{errors.nit.message}</p>}
            </div>

            <div>
              <label htmlFor="marital_status" className={labelClass}>
                Estado Civil
              </label>
              <select id="marital_status" className={inputClass} {...register("marital_status")}>
                <option value="">— Seleccionar —</option>
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.marital_status && <p className={errorClass}>{errors.marital_status.message}</p>}
            </div>

            <div>
              <label htmlFor="profession" className={labelClass}>
                Profesión u Oficio
              </label>
              <input id="profession" type="text" className={inputClass} {...register("profession")} />
              {errors.profession && <p className={errorClass}>{errors.profession.message}</p>}
            </div>

            <div>
              <label htmlFor="nationality" className={labelClass}>
                Nacionalidad <span className="text-red-500">*</span>
              </label>
              <input id="nationality" type="text" className={inputClass} {...register("nationality")} />
              {errors.nationality && <p className={errorClass}>{errors.nationality.message}</p>}
            </div>

            <div>
              <label htmlFor="birth_date" className={labelClass}>
                Fecha de Nacimiento
              </label>
              <input id="birth_date" type="date" className={inputClass} {...register("birth_date")} />
              {errors.birth_date && <p className={errorClass}>{errors.birth_date.message}</p>}
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

            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelClass}>
                Dirección
              </label>
              <textarea id="address" rows={2} className={inputClass} {...register("address")} />
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
              {submitting ? "Guardando…" : isEdit ? "Guardar Cambios" : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
