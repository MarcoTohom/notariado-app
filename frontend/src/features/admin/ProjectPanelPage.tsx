import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SystemHealthBadge } from "../../components/SystemHealthBadge";
import { PROJECT_PHASES, ProjectPhase } from "./projectPhases";
import {
  FileCheck2,
  Clock,
  Layers,
  CheckCircle,
  Terminal,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
  Users,
  GitCommit,
  Hourglass,
  Clock3,
} from "lucide-react";

export const ProjectPanelPage: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const renderStatusBadge = (status: ProjectPhase["status"]) => {
    switch (status) {
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            DONE
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
            <Clock3 className="w-3 h-3 text-amber-600 animate-spin" />
            EN PROCESO
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Hourglass className="w-3 h-3 text-slate-400" />
            PENDIENTE
          </span>
        );
    }
  };

  const doneCount = PROJECT_PHASES.filter((p) => p.status === "DONE").length;
  const progressPercent = Math.round((doneCount / PROJECT_PHASES.length) * 100);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner Hero Administrativo */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 mb-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Panel de Control Técnico • Solo Administrador</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Seguimiento de Ingeniería del Proyecto de Tesis
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Monitoreo técnico de fases arquitectónicas, scripts de infraestructura y estado experimental
            para la meta de reducción de tiempo de revisión notarial de{" "}
            <strong className="text-amber-400 font-bold">240 min a 60 min</strong>.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Baseline: <strong>240 min</strong> → Meta: <strong>60 min</strong></span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-lg flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Muestra de Tesis: <strong>100 Casos Sintéticos</strong></span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Reglas Notariales: <strong>RULE-001 .. RULE-020</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Notificación de Estado de Sesión */}
      {user && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">
                Autenticado como: <span className="font-mono">{user.full_name}</span> ({user.role})
              </p>
              <p className="text-emerald-700">
                Acceso administrativo total concedido con {user.permissions.length} permisos activos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasPermission("clients:read") && (
              <Link
                to="/clientes"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Clientes
              </Link>
            )}
            {hasPermission("cases:read") && (
              <Link
                to="/expedientes"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Expedientes
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Grid de Estado y Arquitectura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Columna Izquierda: Estado del Backend y Scripts */}
        <div className="lg:col-span-1 space-y-4">
          <SystemHealthBadge />

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2.5">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-500" />
              Scripts de Control en Windows
            </h4>
            <p className="text-slate-500">Automatización lista en PowerShell:</p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700">
              <li className="bg-slate-100 p-1.5 rounded">.\scripts\dev.ps1 <span className="text-slate-400">(Servidor completo)</span></li>
              <li className="bg-slate-100 p-1.5 rounded">.\scripts\test.ps1 <span className="text-slate-400">(Suite de pruebas)</span></li>
              <li className="bg-slate-100 p-1.5 rounded">.\scripts\seed.ps1 <span className="text-slate-400">(Siembra cuentas demo)</span></li>
              <li className="bg-slate-100 p-1.5 rounded">.\scripts\backup.ps1 <span className="text-slate-400">(Respaldo SQLite)</span></li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h4 className="font-semibold text-slate-800">Progreso Global de Desarrollo</h4>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>{doneCount} de {PROJECT_PHASES.length} paquetes completados</span>
              <span className="font-bold text-slate-700">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Seguimiento Data-Driven de Fases */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Seguimiento de Fases y Paquetes de Trabajo</h3>
              <p className="text-xs text-slate-500">Estado consolidado de F1 a F11 y paquetes WP-01 a WP-08</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
              {doneCount}/{PROJECT_PHASES.length} Entregados
            </span>
          </div>

          <div className="space-y-3 text-xs max-h-[640px] overflow-y-auto pr-1">
            {PROJECT_PHASES.map((phase) => (
              <div
                key={phase.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  phase.status === "DONE"
                    ? "bg-emerald-50/40 border-emerald-200/80"
                    : phase.status === "IN_PROGRESS"
                    ? "bg-amber-50/50 border-amber-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800">
                      {phase.id}
                    </span>
                    <h4 className="font-bold text-slate-900">{phase.title}</h4>
                  </div>
                  <div className="shrink-0">{renderStatusBadge(phase.status)}</div>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">{phase.summary}</p>

                {phase.commit && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                    <span>Commit:</span>
                    <span className="font-mono font-semibold text-slate-700">{phase.commit}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Documentación de arquitectura en <code>docs/</code></span>
            <a
              href="http://127.0.0.1:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Abrir Documentación Swagger OpenAPI <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
