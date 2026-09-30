import React from "react";
import { Scale, Shield, FileText, Users, FolderOpen, FlaskConical } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg text-white shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-white flex items-center gap-2">
              Borradores Notariales
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                UMG
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Sistema de Borradores de Escrituras Públicas</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <a href="#dashboard" className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-500" />
            Panel
          </a>
          <a href="#clientes" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Clientes
          </a>
          <a href="#expedientes" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" />
            Expedientes
          </a>
          <a href="#experimento" className="px-3 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" />
            Módulo Tesis
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Fase 1: Base Activa
          </span>
        </div>
      </div>
    </header>
  );
};