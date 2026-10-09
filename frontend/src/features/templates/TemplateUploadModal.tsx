import { Modal, ModalActions } from "../../components/common/Modal";
import { ErrorNotice, FieldError } from "../../components/common/Feedback";
import { inputClass, labelClass } from "../../components/common/formStyles";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CaseType } from "../../shared/types";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import { CASE_TYPES } from "../../lib/validators";
import { getApiErrorMessage } from "../../shared/api/errors";
import { formatBytes } from "../../lib/format";
import { FileUp, Save, FileText } from "lucide-react";

const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

const uploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(150, "Máximo 150 caracteres"),
  case_type: z.enum(CASE_TYPES),
  description: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recibe los metadatos y el archivo; debe lanzar el error de la API si falla. */
  onSave: (formData: FormData) => Promise<void>;
  /** Título y etiqueta del botón, para reutilizar el modal al subir versiones. */
  title?: string;
  submitLabel?: string;
}





export const validateTemplateFile = (file: File | null): string | null => {
  if (!file) return "Selecciona un archivo .docx.";
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return "Solo se permiten archivos con extensión .docx.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_TEMPLATE_BYTES) return "El archivo supera el máximo de 10 MB.";
  return null;
};

export const TemplateUploadModal: React.FC<TemplateUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = "Cargar Plantilla DOCX",
  submitLabel = "Cargar Plantilla",
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { name: "", case_type: "COMPRAVENTA", description: "", notes: "" },
  });

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setFileError(null);
      setSelectedFile(null);
      reset({ name: "", case_type: "COMPRAVENTA", description: "", notes: "" });
    }
  }, [isOpen, reset]);

  /** Valida el archivo incluso cuando Zod marca errores en los metadatos. */
  const onInvalid = () => {
    setFileError(validateTemplateFile(selectedFile));
  };

  if (!isOpen) return null;

  const submit = async (values: UploadFormValues) => {
    const validationError = validateTemplateFile(selectedFile);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setFileError(null);
    setSubmitting(true);
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("case_type", values.case_type);
      formData.append("description", values.description ?? "");
      formData.append("notes", values.notes ?? "");
      formData.append("file", selectedFile as File);
      await onSave(formData);
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, "No se pudo cargar la plantilla."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<>{title}</>}
      subtitle={<>Marcadores Jinja2 • {"{{ variable }}"} • Máx. 10 MB</>}
      icon={<FileUp className="w-5 h-5" />}
      onClose={onClose}
      size="lg"
    >

      {/* Formulario */}
      <form onSubmit={handleSubmit(submit, onInvalid)} className="flex-1 overflow-y-auto p-5">
        {serverError && (
          <ErrorNotice className="mb-4">
            {serverError}
          </ErrorNotice>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="tpl_name" className={labelClass}>
              Nombre de la Plantilla <span className="text-red-500">*</span>
            </label>
            <input
              id="tpl_name"
              type="text"
              placeholder="Ej. Compraventa de Inmueble — Bufete"
              className={inputClass}
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="tpl_case_type" className={labelClass}>
              Tipo de Escritura <span className="text-red-500">*</span>
            </label>
            <select id="tpl_case_type" className={inputClass} {...register("case_type")}>
              {(Object.keys(CASE_TYPE_LABELS) as CaseType[]).map((t) => (
                <option key={t} value={t}>
                  {CASE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.case_type && <FieldError>{errors.case_type.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="tpl_description" className={labelClass}>
              Descripción
            </label>
            <textarea
              id="tpl_description"
              rows={2}
              className={inputClass}
              {...register("description")}
            />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </div>

          <div>
            <label htmlFor="tpl_file" className={labelClass}>
              Archivo DOCX <span className="text-red-500">*</span>
            </label>
            <input
              id="tpl_file"
              type="file"
              accept=".docx"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                setFileError(validateTemplateFile(file));
              }}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700 file:cursor-pointer border border-slate-300 rounded-lg"
            />
            {selectedFile && !fileError && (
              <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {selectedFile.name} • {formatBytes(selectedFile.size)}
              </p>
            )}
            {fileError && <FieldError>{fileError}</FieldError>}
          </div>

          <div>
            <label htmlFor="tpl_notes" className={labelClass}>
              Notas de la versión
            </label>
            <input
              id="tpl_notes"
              type="text"
              placeholder="Ej. Versión inicial aprobada por el notario titular"
              className={inputClass}
              {...register("notes")}
            />
            {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
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
            {submitting ? "Cargando…" : submitLabel}
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
};
