import { Modal, ModalBody } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import React, { useEffect, useState } from "react";
import { userService } from "./api";
import { auditService } from "../audit/api";
import type { UserItem } from "./types";
import type { AuditLogItem } from "../audit/types";
import { useAuth } from "../auth/AuthContext";
import { Users, Shield, History, RefreshCw } from "lucide-react";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === "users" && hasPermission("users:read")) {
        const data = await userService.getUsers();
        setUsers(data.items);
      } else if (tab === "audit" && hasPermission("audit:read")) {
        const data = await auditService.getAuditLogs();
        setAuditLogs(data.items);
      }
    } catch (err) {
      console.error("Error loading management data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  return (
    <Modal
      title={<>Control de Seguridad y Accesos</>}
      subtitle={<>Gestión de Roles RBAC y Auditoría del Bufete</>}
      icon={<Users className="w-5 h-5" />}
      onClose={onClose}
      size="4xl"
      height="85vh"
    >

      {/* Tabs & Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${tab === "users"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <Users className="w-4 h-4" />
            Usuarios Registrados ({users.length})
          </button>

          {hasPermission("audit:read") && (
            <button
              onClick={() => setTab("audit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${tab === "audit"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <History className="w-4 h-4" />
              Bitácora de Auditoría ({auditLogs.length})
            </button>
          )}
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Body Table */}
      <ModalBody>
        {tab === "users" ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Nombre Completo</th>
                  <th className="py-2.5 px-4">Correo</th>
                  <th className="py-2.5 px-4">Rol Notarial</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{u.username}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{u.full_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge className={`${u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                        }`}>
                        {u.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Acción</th>
                  <th className="py-2.5 px-4">Módulo</th>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Detalles</th>
                  <th className="py-2.5 px-4">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-2.5 px-4 text-brand-700">{log.module}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.user_email || "anónimo"}</td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};