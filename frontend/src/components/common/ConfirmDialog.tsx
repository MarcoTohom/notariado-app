import React, { useId } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalFrame } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmación para acciones destructivas (bajas lógicas, cancelaciones). */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Volver",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <ModalFrame labelledBy={titleId} size="md" height="content" confirmation>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="font-bold text-sm text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </ModalFrame>
  );
};
