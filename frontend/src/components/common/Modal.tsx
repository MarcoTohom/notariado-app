import { ReactNode, useId } from "react";
import { X } from "lucide-react";

type ModalSize = "md" | "lg" | "2xl" | "3xl" | "4xl";
const widths: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

interface ModalFrameProps {
  children: ReactNode;
  labelledBy: string;
  size?: ModalSize;
  height?: "90vh" | "85vh" | "content";
  animated?: boolean;
  confirmation?: boolean;
}

/** Contenedor visual. El consumidor conserva sus condiciones de apertura y cierre. */
export function ModalFrame({
  children,
  labelledBy,
  size = "2xl",
  height = "90vh",
  animated = false,
  confirmation = false,
}: ModalFrameProps) {
  const heightClass = height === "content" ? "" :
    `${height === "85vh" ? "max-h-[85vh]" : "max-h-[90vh]"} flex flex-col`;
  return (
    <div className={`fixed inset-0 ${confirmation ? "z-[60]" : "z-50"} flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4`}>
      <div
        role={confirmation ? "alertdialog" : "dialog"}
        aria-labelledby={labelledBy}
        className={`bg-white ${confirmation ? "rounded-xl" : "rounded-2xl"} ${widths[size]} w-full ${heightClass} shadow-2xl border border-slate-200 overflow-hidden ${animated ? "animate-in fade-in zoom-in-95 duration-200" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalProps extends Omit<ModalFrameProps, "labelledBy" | "confirmation"> {
  title: ReactNode;
  subtitle: ReactNode;
  icon: ReactNode;
  onClose: () => void;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function Modal({
  title, subtitle, icon, onClose, children,
  titleClassName = "", subtitleClassName = "", ...frameProps
}: ModalProps) {
  const titleId = useId();
  return (
    <ModalFrame {...frameProps} labelledBy={titleId}>
      <div className={`bg-slate-900 text-white p-5 flex items-center justify-between ${frameProps.height === "content" ? "" : "shrink-0"}`}>
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-600 p-2 rounded-lg text-white">{icon}</div>
          <div>
            <h3 id={titleId} className={`font-bold text-base leading-tight ${titleClassName}`}>{title}</h3>
            <p className={`text-xs text-slate-400 ${subtitleClassName}`}>{subtitle}</p>
          </div>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </ModalFrame>
  );
}

export function ModalBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto p-5 ${className}`}>{children}</div>;
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">{children}</div>;
}
