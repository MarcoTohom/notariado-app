import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoginModal } from "./LoginModal";
import { UserManagementModal } from "./UserManagementModal";
import {
  Scale,
  FileText,
  FileStack,
  FileOutput,
  Users,
  FolderOpen,
  FlaskConical,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from "lucide-react";

const navLinkBase =
  "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5";

export const Navbar: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${navLinkBase} ${
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
    }`;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
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
            <NavLink to="/" end className={linkClass}>
              <FileText className="w-4 h-4 text-brand-500" />
              Panel
            </NavLink>
            {hasPermission("clients:read") && (
              <NavLink to="/clientes" className={linkClass}>
                <Users className="w-4 h-4" />
                Clientes
              </NavLink>
            )}
            {hasPermission("cases:read") && (
              <NavLink to="/expedientes" className={linkClass}>
                <FolderOpen className="w-4 h-4" />
                Expedientes
              </NavLink>
            )}
            {hasPermission("templates:read") && (
              <NavLink to="/plantillas" className={linkClass}>
                <FileStack className="w-4 h-4" />
                Plantillas
              </NavLink>
            )}
            {hasPermission("documents:read") && (
              <NavLink to="/documentos" className={linkClass}>
                <FileOutput className="w-4 h-4" />
                Borradores
              </NavLink>
            )}
            {hasPermission("templates:read") && <NavLink to="/formularios" className={linkClass}>Formularios</NavLink>}
            <span
              className="px-3 py-1.5 rounded-lg text-slate-600 flex items-center gap-1.5 cursor-not-allowed"
              title="Disponible en la Fase 11 del proyecto"
            >
              <FlaskConical className="w-4 h-4" />
              Módulo Tesis
            </span>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {hasPermission("users:read") && (
                  <button
                    onClick={() => setManagementOpen(true)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Control de Usuarios y Auditoría"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                    <span className="hidden sm:inline">Usuarios & RBAC</span>
                  </button>
                )}

                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 py-1 px-2.5 rounded-lg text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <div className="text-left">
                    <p className="font-semibold text-white leading-none">{user.username}</p>
                    <p className="text-[10px] text-amber-400 mt-0.5">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>
      {hasPermission("templates:read") && <nav className="md:hidden bg-white border-b px-4 py-2 text-sm"><NavLink to="/formularios">Formularios de escritura</NavLink></nav>}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <UserManagementModal isOpen={managementOpen} onClose={() => setManagementOpen(false)} />
    </>
  );
};
