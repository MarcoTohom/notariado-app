import React, { useEffect, useState } from "react";
import { UserItem, RoleType, PermissionOverrides } from "../../types";
import { userService, getApiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  X,
  UserCheck,
  Shield,
  ShieldAlert,
  Loader2,
  Save,
  CheckSquare,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

interface EditUserModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES: { value: RoleType; label: string }[] = [
  { value: "ADMINISTRADOR", label: "ADMINISTRADOR (Acceso total)" },
  { value: "ABOGADO_NOTARIO", label: "ABOGADO_NOTARIO (Notario titular)" },
  { value: "AUXILIAR", label: "AUXILIAR (Protocolo y expedientes)" },
  { value: "ADMINISTRACION", label: "ADMINISTRACION (Cobros y reportes)" },
];

const STATUSES: { value: string; label: string }[] = [
  { value: "ACTIVE", label: "ACTIVO (Acceso permitido)" },
  { value: "INACTIVE", label: "INACTIVO (Baja lógica)" },
  { value: "SUSPENDED", label: "SUSPENDIDO (Bloqueo temporal)" },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user: currentUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleType>("AUXILIAR");
  const [status, setStatus] = useState("ACTIVE");
  const [grantPerms, setGrantPerms] = useState<string[]>([]);
  const [revokePerms, setRevokePerms] = useState<string[]>([]);

  const [catalog, setCatalog] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = currentUser?.id === user?.id;

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
      setGrantPerms(user.permission_overrides?.grant || []);
      setRevokePerms(user.permission_overrides?.revoke || []);
      setError(null);

      // Cargar catálogo de permisos
      setLoadingCatalog(true);
      userService
        .getPermissionCatalog()
        .then((perms) => setCatalog(perms))
        .catch((err) => console.error("Error cargando permisos:", err))
        .finally(() => setLoadingCatalog(false));
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const toggleGrant = (perm: string) => {
    setGrantPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
    // Si se concede, remover de revocados
    setRevokePerms((prev) => prev.filter((p) => p !== perm));
  };

  const toggleRevoke = (perm: string) => {
    setRevokePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
    // Si se revoca, remover de concedidos
    setGrantPerms((prev) => prev.filter((p) => p !== perm));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const overrides: PermissionOverrides = {
      grant: grantPerms,
      revoke: revokePerms,
    };

    try {
      await userService.updateUser(user.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        role: role,
        status: status,
        permission_overrides: overrides,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo actualizar el usuario."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Editar Usuario: <span className="font-mono text-amber-300">{user.username}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste de rol notarial, estado y overrides granulares de permisos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSelf && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Estás editando tu propia cuenta de administrador. Por seguridad, no puedes retirar tu rol ni desactivarte.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rol Notarial
              </label>
              <select
                value={role}
                disabled={isSelf}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de la Cuenta
              </label>
              <select
                value={status}
                disabled={isSelf}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección de Overrides de Permisos */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  Overrides Granulares de Permisos
                </h4>
                <p className="text-[11px] text-slate-500">
                  Modifica permisos individuales independientemente del rol base del usuario.
                </p>
              </div>
              {loadingCatalog && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conceder adicionalmente (Grant) */}
              <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Permisos adicionales (Grant)</span>
                  <span className="ml-auto text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded-full">
                    {grantPerms.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {catalog.map((perm) => (
                    <label
                      key={`grant-${perm}`}
                      className="flex items-center gap-2 text-[11px] text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={grantPerms.includes(perm)}
                        onChange={() => toggleGrant(perm)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-mono">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Revocar específicamente (Revoke) */}
              <div className="border border-red-200 bg-red-50/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 mb-2">
                  <MinusCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Permisos revocados (Revoke)</span>
                  <span className="ml-auto text-[10px] bg-red-200/80 text-red-800 px-1.5 py-0.5 rounded-full">
                    {revokePerms.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {catalog.map((perm) => (
                    <label
                      key={`revoke-${perm}`}
                      className="flex items-center gap-2 text-[11px] text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={revokePerms.includes(perm)}
                        onChange={() => toggleRevoke(perm)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="font-mono">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
