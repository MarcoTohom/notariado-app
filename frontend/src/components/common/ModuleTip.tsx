import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight, X } from "lucide-react";

interface ModuleTipProps {
  anchor: "expediente" | "plantilla" | "borrador";
  tipText: string;
}

export const ModuleTip: React.FC<ModuleTipProps> = ({ anchor, tipText }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-full transition-colors"
        title="Consejo rápido del módulo"
        aria-label="Ayuda contextual"
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
        <span>Ayuda</span>
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 z-30 mt-2 w-72 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xl text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              Tip Notarial
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              aria-label="Cerrar ayuda"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] mb-2.5">{tipText}</p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              to={`/guia#${anchor}`}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700"
            >
              Consultar guía completa <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
