import { LoadingState } from "../../components/common/Feedback";
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { LoginModal } from "./LoginModal";
import { LockKeyhole, ShieldX, LogIn } from "lucide-react";

interface RequireAuthProps {
  /** Permiso granular requerido (matriz RBAC, ej. "clients:read"). */
  permission?: string;
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ permission, children }) => {
  const { user, loading, hasPermission } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return (
      <LoadingState className="py-24">

        <span className="text-xs">Verificando sesión…</span>
      </LoadingState>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LockKeyhole className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Módulo protegido</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Esta sección requiere autenticación. Inicia sesión con una cuenta del bufete para continuar.
        </p>
        <button
          onClick={() => setLoginOpen(true)}
          className="mt-5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          Iniciar Sesión
        </button>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acceso restringido</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Tu rol <span className="font-mono font-semibold">{user.role}</span> no cuenta con el permiso{" "}
          <span className="font-mono font-semibold">{permission}</span> requerido para este módulo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
