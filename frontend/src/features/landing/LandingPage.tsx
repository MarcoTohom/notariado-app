import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoginModal } from "../../components/LoginModal";
import {
  Scale,
  ShieldCheck,
  FileStack,
  FileOutput,
  Users,
  FolderOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogIn,
  ChevronDown,
  Sparkles,
  Lock,
  Layers,
  BookOpen,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        {/* Glow decorativo sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge de contexto legal */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-amber-500/30 text-amber-300 text-xs font-medium mb-6 shadow-sm">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Tecnología Jurídica Notarial • Ciudad de Guatemala</span>
            </div>

            {/* Titular Principal */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Borradores de escrituras públicas con{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                validación documental automatizada
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
              Plataforma de alta precisión para bufetes jurídicos guatemaltecos.
              Estructura datos de comparecientes, reutiliza plantillas DOCX con variables Jinja2
              y ejecuta <strong className="text-white">20 reglas notariales algorítmicas</strong> para
              blindar el protocolo contra inconsistencias antes de la firma.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/expedientes"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  <FolderOpen className="w-4 h-4" />
                  Ir al panel del sistema
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  <LogIn className="w-4 h-4" />
                  Acceder al Sistema
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollToSection("modulos")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:text-white"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Conocer módulos
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Resumen de Estado de Sesión en Hero */}
            {user && (
              <p className="mt-4 text-xs text-slate-400">
                Sesión activa como: <span className="font-semibold text-amber-300">{user.full_name}</span> ({user.role})
              </p>
            )}
          </div>

          {/* Métricas e Invariantes Clave */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-black text-amber-400 mb-0.5">20</div>
              <div className="text-xs font-semibold text-white">Reglas Notariales</div>
              <p className="text-[11px] text-slate-400 mt-1">DPI, NIT, Registro, Art. 30</p>
            </div>
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-black text-brand-400 mb-0.5">5</div>
              <div className="text-xs font-semibold text-white">Tipos de Instrumento</div>
              <p className="text-[11px] text-slate-400 mt-1">Compraventa, Mandato, S.A…</p>
            </div>
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 mb-0.5">100</div>
              <div className="text-xs font-semibold text-white">Casos Sintéticos</div>
              <p className="text-[11px] text-slate-400 mt-1">Evaluación experimental</p>
            </div>
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-black text-slate-200 mb-0.5">100%</div>
              <div className="text-xs font-semibold text-white">Offline y Seguro</div>
              <p className="text-[11px] text-slate-400 mt-1">Windows local sin nube</p>
            </div>
          </div>
        </div>
      </section>

      {/* Propuesta de Valor en 3 Tarjetas */}
      <section id="modulos" className="py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pilares de la Arquitectura Notarial
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Diseño enfocado en la certeza jurídica, eliminación de errores humanos y rigor documental.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1 */}
            <div className="bg-slate-850 border border-slate-750 hover:border-amber-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FileStack className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Plantillas DOCX con Jinja2 y Versionamiento Inmutable
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Carga de moldes notariales con marcadores estructurados <code className="text-amber-300 font-mono text-xs">{"{{ variable }}"}</code>, bucles de comparecientes y condicionales. Cada versión es inmutable con hash SHA-256 y una única versión permanece activa para garantizar certeza jurídica.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Historial inmutable • Sin sobrescritura</span>
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-slate-850 border border-slate-750 hover:border-brand-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Motor de 20 Reglas Notariales Automatizadas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Inspección algorítmica de DPI (13 dígitos exactos numéricos), NIT, datos registrales (finca, folio y libro numéricos), cantidades expresadas obligatoriamente en letras conforme al Art. 30 del Código de Notariado y porcentajes de capital social.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-brand-400" />
                <span>Reglas RULE-001 a RULE-020</span>
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-slate-850 border border-slate-750 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FileOutput className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Borradores Verificados sin Placeholders Residuales
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Generación server-side con <code className="text-emerald-300 font-mono text-xs">docxtpl</code> y auditoría cruzada con <code className="text-emerald-300 font-mono text-xs">python-docx</code>. Bloqueo inmediato ante hallazgos críticos para evitar borradores incompletos o cláusulas sin rellenar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verificación 100% libre de residuos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona (Flujo en 4 Pasos) */}
      <section id="flujo" className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Flujo de Trabajo Operativo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Del Expediente al Borrador en 4 Pasos
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Un proceso ordenado que reduce el tiempo de revisión sin comprometer la rigurosidad jurídica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Paso 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center mb-4 border border-amber-500/30">
                1
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Expediente</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apertura del correlativo oficial (EXP-AAAA-#####) y registro de comparecientes individuales o jurídicos con validación estricta de DPI y calidades.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 font-black text-sm flex items-center justify-center mb-4 border border-brand-500/30">
                2
              </div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-white text-sm">Plantilla</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vinculación de la versión de plantilla activa según el tipo de escritura (compraventa, mandato, arrendamiento, etc.) con extracción tipada de variables.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-black text-sm flex items-center justify-center mb-4 border border-purple-500/30">
                3
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Validación</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ejecución instantánea del motor RULE-001 a RULE-020: reporte clasificado de hallazgos (INFO, ADVERTENCIA, ERROR, CRÍTICO) con sugerencias de subsanación.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-4 border border-emerald-500/30">
                4
              </div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Borrador DOCX</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generación del borrador oficial DOCX con hash inmutable, registro en historial de versiones y descarga directa para revisión final del Notario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nota de Cumplimiento Legal y Función Notarial */}
      <section className="py-12 bg-slate-900/90 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-950/30 border border-amber-600/40 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300 mb-1">
                Herramienta de Apoyo Profesional — Cumplimiento del Marco Jurídico
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                El presente sistema es una herramienta tecnológica de asistencia para la estructuración de datos, reutilización de moldes y detección preventiva de inconsistencias documentales. <strong className="text-white">No sustituye la fe pública del Notario, el juicio y asesoría jurídica del abogado, ni los registros públicos oficiales</strong> de la República de Guatemala (Registro General de la Propiedad, Superintendencia de Administración Tributaria ni Registro Nacional de las Personas).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Académico */}
      <footer className="mt-auto py-10 bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600/20 text-brand-400 p-2 rounded-lg border border-brand-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Universidad Mariano Gálvez de Guatemala (UMG)</p>
              <p className="text-slate-400 text-[11px]">Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-slate-300 font-semibold">Proyecto de Graduación 2 • Tesis de Grado</p>
            <p className="text-slate-400 text-[11px]">Investigador: Marco Antonio Lares Tohom</p>
          </div>
        </div>
      </footer>

      {/* Modal de inicio de sesión */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};
