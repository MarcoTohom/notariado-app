import { Modal, ModalActions } from "../../components/common/Modal";
import { ErrorNotice, FieldError } from "../../components/common/Feedback";
import { inputClass, labelClass } from "../../components/common/formStyles";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Client, ClientCreate, ClientUpdate } from "./types";
import { clientSchema, ClientFormValues, cleanOptional, maskDpiInput } from "../../lib/validators";
import { MARITAL_STATUS_OPTIONS } from "../../lib/labels";
import { getApiErrorMessage } from "../../shared/api/errors";
import { UserPlus, Save } from "lucide-react";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Guarda el cliente; debe lanzar el error de la API para mostrarlo inline. */
  onSave: (payload: ClientCreate | ClientUpdate) => Promise<void>;
  /** Si se provee, el modal opera en modo edición (DPI inmutable). */
  initialData?: Client | null;
}





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
    <Modal
      title={<>{isEdit ? "Editar Cliente" : "Registrar Cliente"}</>}
      subtitle={<>Persona individual • DPI como texto de 13 dígitos</>}
      icon={<UserPlus className="w-5 h-5" />}
      onClose={onClose}
      size="2xl"
    >

      {/* Formulario */}
      <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto p-5">
        {serverError && (
          <ErrorNotice className="mb-4">
            {serverError}
          </ErrorNotice>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className={labelClass}>
              Nombres <span className="text-red-500">*</span>
            </label>
            <input id="first_name" type="text" className={inputClass} {...register("first_name")} />
            {errors.first_name && <FieldError>{errors.first_name.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="last_name" className={labelClass}>
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input id="last_name" type="text" className={inputClass} {...register("last_name")} />
            {errors.last_name && <FieldError>{errors.last_name.message}</FieldError>}
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
            {errors.dpi && <FieldError>{errors.dpi.message}</FieldError>}
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
            {errors.nit && <FieldError>{errors.nit.message}</FieldError>}
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
            {errors.marital_status && <FieldError>{errors.marital_status.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="profession" className={labelClass}>
              Profesión u Oficio
            </label>
            <input id="profession" type="text" className={inputClass} {...register("profession")} />
            {errors.profession && <FieldError>{errors.profession.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="nationality" className={labelClass}>
              Nacionalidad <span className="text-red-500">*</span>
            </label>
            <input id="nationality" type="text" className={inputClass} {...register("nationality")} />
            {errors.nationality && <FieldError>{errors.nationality.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="birth_date" className={labelClass}>
              Fecha de Nacimiento
            </label>
            <input id="birth_date" type="date" className={inputClass} {...register("birth_date")} />
            {errors.birth_date && <FieldError>{errors.birth_date.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Teléfono
            </label>
            <input id="phone" type="text" className={inputClass} {...register("phone")} />
            {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Correo Electrónico
            </label>
            <input id="email" type="email" className={inputClass} {...register("email")} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>
              Dirección
            </label>
            <textarea id="address" rows={2} className={inputClass} {...register("address")} />
            {errors.address && <FieldError>{errors.address.message}</FieldError>}
          </div>
        </div>

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
            {submitting ? "Guardando…" : isEdit ? "Guardar Cambios" : "Registrar Cliente"}
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
};
