import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { SystemHealthBadge } from "./components/SystemHealthBadge";
import { LoginModal } from "./components/LoginModal";
import { 
  FileCheck2, 
  Clock, 
  Layers, 
  CheckCircle, 
  Terminal, 
  ArrowRight,
  ShieldAlert,
  LogIn,
  Users
} from "lucide-react";

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Hero */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-4">
              <span>Proyecto de Graduación 2 • UMG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Sistema de Borradores de Escrituras Públicas y Validación Documental
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Plataforma notarial de ingeniería de software para la Ciudad de Guatemala. Diseñada para automatizar la congruencia documental, estandarizar plantillas y reducir el tiempo de revisión manual de <strong className="text-amber-400 font-bold">240 min a una meta de 60 min</strong> por escritura.
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
        {!user ? (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-amber-900">Sesión no iniciada (Modo Consulta)</p>
                <p className="text-amber-700">Inicia sesión con una de las cuentas demo (Admin, Notario, Auxiliar, Finanzas) para probar los permisos RBAC.</p>
              </div>
            </div>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Acceder con Demo
            </button>
          </div>
        ) : (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Autenticado como: <span className="font-mono">{user.full_name}</span> ({user.role})
                </p>
                <p className="text-emerald-700">
                  {user.permissions.length} permisos asignados de acuerdo con la matriz de seguridad de la tesis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Estado y Arquitectura */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta de Estado del Backend */}
          <div className="lg:col-span-1">
            <SystemHealthBadge />

            <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2.5">
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
          </div>

          {/* Fases del Proyecto */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Estado de la Hoja de Ruta (Sprint 1)</h3>
                <p className="text-xs text-slate-500">Desarrollo modular acumulativo según la metodología Scrum</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Fase 2: Completada
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Fase 1 */}
              <div className="p-3 rounded-lg border bg-emerald-50/50 border-emerald-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Fase 1: Fundación Arquitectónica, Entorno y CI</span>
                    <span className="text-emerald-700 font-semibold">100% DONE</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Backend FastAPI, SQLite `app.db`, migraciones Alembic, configuración Pydantic v2, frontend React 18 / TypeScript / Tailwind CSS y pruebas automatizadas en Windows.
                  </p>
                </div>
              </div>

              {/* Fase 2 */}
              <div className="p-3 rounded-lg border bg-emerald-50/50 border-emerald-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Fase 2: Seguridad, Roles RBAC, Usuarios y Auditoría</span>
                    <span className="text-emerald-700 font-semibold">100% DONE</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Hash seguro con Argon2, tokens JWT con expiración, modelo `users`, 4 roles notariales (`ADMINISTRADOR`, `ABOGADO_NOTARIO`, `AUXILIAR`, `ADMINISTRACION`), permisos granulares, bitácora de auditoría sanitizada y siembra de cuentas demo.
                  </p>
                </div>
              </div>

              {/* Fase 3 */}
              <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-start gap-3 opacity-90">
                <Users className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Fase 3: Sujetos de Derecho y Expedientes Notariales</span>
                    <span className="text-amber-600 font-semibold">Siguiente Etapa</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Clientes individuales y jurídicos (DPI 13 dígitos y NIT como texto normalizado), gestión de expedientes notariales y los 5 tipos de escritura base.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Documentación de respaldo lista en <code>docs/</code></span>
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
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Sistema de Borradores de Escrituras Públicas • Tesis de Grado UMG • Marco Antonio Lares Tohom</p>
      </footer>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
};