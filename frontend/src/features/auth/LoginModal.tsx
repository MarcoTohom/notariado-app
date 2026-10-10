import { Modal } from "../../components/common/Modal";
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Lock, ShieldCheck, KeyRound, AlertCircle, UserCheck } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Error de autenticación. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLoading(true);
    setError(null);
    try {
      await login(user, pass);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Fallo en acceso demo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<>Acceso Notarial Seguro</>}
      subtitle={<>Autenticación con Argon2 y JWT (Fase 2)</>}
      icon={<Lock className="w-5 h-5" />}
      onClose={onClose}
      size="md"
      height="content"
      animated
    >

      {/* Body */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1">
              Usuario o Correo Electrónico
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej. notario.demo"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? "Verificando con Argon2..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Cuentas Demo de la Tesis */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Acceso Rápido con Cuentas Demo (Sección 45)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin", "Admin123!")}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 text-left transition-colors"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                admin
              </div>
              <div className="text-[10px] text-slate-500">ADMINISTRADOR</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("notario.demo", "Notario123!")}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 text-left transition-colors"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                notario.demo
              </div>
              <div className="text-[10px] text-slate-500">NOTARIO TITULAR</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("auxiliar.demo", "Auxiliar123!")}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition-colors"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                auxiliar.demo
              </div>
              <div className="text-[10px] text-slate-500">AUXILIAR PROTOCOLO</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("adminfin.demo", "Finanzas123!")}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-colors"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                adminfin.demo
              </div>
              <div className="text-[10px] text-slate-500">ADMINISTRACIÓN</div>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
