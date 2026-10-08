import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FolderOpen,
  FileStack,
  FileOutput,
  Scale,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export const GuidePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span>Guía de Arquitectura Documental Notarial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Plantillas vs. Borradores vs. Expedientes
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Comprender la diferencia y el ciclo de vida de cada artefacto es esencial para garantizar
            la certeza jurídica, la reutilización eficiente y la inmutabilidad de los instrumentos públicos.
          </p>
        </div>
      </div>

      {/* Los Tres Conceptos Fundamentales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* 1. Expediente */}
        <section
          id="expediente"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-20 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-2">
              CASO JURÍDICO
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Expediente</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Es la <strong>carpeta del caso legal</strong> gestionado en el bufete. Agrupa a los
              comparecientes (compradores, vendedores, mandantes), datos específicos del negocio
              jurídico, valores monetarios y el historial completo de borradores generados.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 space-y-1">
              <div><strong>Ejemplo:</strong> EXP-2026-00001</div>
              <div><strong>Tipo:</strong> Compraventa de Inmueble</div>
              <div><strong>Estado:</strong> EN_REVISION</div>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Contenedor de datos y personas</span>
          </div>
        </section>

        {/* 2. Plantilla */}
        <section
          id="plantilla"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-20 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 flex items-center justify-center mb-4">
              <FileStack className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-300 mb-2">
              MOLDE REUTILIZABLE
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Plantilla</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Es el <strong>molde DOCX reutilizable</strong> que contiene la redacción formal con
              marcadores Jinja2 <code className="text-brand-700 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{"{{ variable }}"}</code>.
              Cada tipo de escritura cuenta con plantillas versionadas de forma inmutable; solo una versión
              permanece <strong>ACTIVA</strong> a la vez.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 space-y-1">
              <div><strong>Ejemplo:</strong> Compraventa Contado v2</div>
              <div><strong>Variables:</strong> 18 tipadas</div>
              <div><strong>Estado:</strong> ACTIVA (Inmutable)</div>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Molde institucional verificado</span>
          </div>
        </section>

        {/* 3. Borrador */}
        <section
          id="borrador"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-20 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mb-4">
              <FileOutput className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
              DOCUMENTO GENERADO
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Borrador</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Es el <strong>archivo DOCX final</strong> generado al combinar los datos del expediente
              con la plantilla activa. Pasa por una verificación server-side rigurosa (cero placeholders
              residuales) y se guarda con hash criptográfico SHA-256 en el historial del expediente.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 space-y-1">
              <div><strong>Ejemplo:</strong> Borrador v1 (EXP-2026-00001)</div>
              <div><strong>Validación:</strong> 100% Sin Residuos</div>
              <div><strong>SHA-256:</strong> e83a71b4…</div>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resultado listo para protocolo</span>
          </div>
        </section>
      </div>

      {/* Diagrama de Flujo Visual */}
      <section className="mb-12 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <h3 className="text-base font-bold mb-1 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          El Flujo de Generación Notarial
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Cómo interactúan los tres componentes dentro del proceso de confección de la escritura:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
            <FolderOpen className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-white">1. Datos del Expediente</h4>
            <p className="text-[11px] text-slate-400 mt-1">Comparecientes, DPI, NIT, fincas, precios</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-500">
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
            <FileStack className="w-5 h-5 text-brand-400 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-white">2. Molde de Plantilla</h4>
            <p className="text-[11px] text-slate-400 mt-1">Cláusulas Jinja2 y variables tipadas</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-500">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white">Motor de Validación (RULE-001 a RULE-020):</span>
              <p className="text-slate-400">
                Inspecciona congruencia documental antes de emitir el documento. Si existen errores críticos, bloquea la generación.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 font-mono text-xs bg-emerald-950 border border-emerald-800/80 text-emerald-300 px-3 py-1.5 rounded-lg">
            <FileOutput className="w-4 h-4 text-emerald-400" />
            <span>Borrador DOCX Verificado</span>
          </div>
        </div>
      </section>

      {/* Tabla Comparativa */}
      <section className="mb-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Tabla Comparativa de Ciclo de Vida y Responsabilidad
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Resumen de diferencias técnicas y operativas entre los tres conceptos:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Criterio</th>
                <th className="py-3 px-4 bg-amber-50/50 text-amber-900">Expediente</th>
                <th className="py-3 px-4 bg-brand-50/50 text-brand-900">Plantilla</th>
                <th className="py-3 px-4 bg-emerald-50/50 text-emerald-900">Borrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">¿Qué representa?</td>
                <td className="py-3 px-4 text-slate-600">Un caso legal o cliente específico</td>
                <td className="py-3 px-4 text-slate-600">Un molde DOCX genérico reutilizable</td>
                <td className="py-3 px-4 text-slate-600">El resultado de fusionar caso + plantilla</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">¿Qué se edita?</td>
                <td className="py-3 px-4 text-slate-600">Comparecientes y valores de campos</td>
                <td className="py-3 px-4 text-slate-600">El archivo base DOCX y sus variables</td>
                <td className="py-3 px-4 text-slate-600">No se edita directo; se genera nueva versión</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">¿Dónde se almacena?</td>
                <td className="py-3 px-4 text-slate-600 font-mono">Tabla `cases` en base de datos</td>
                <td className="py-3 px-4 text-slate-600 font-mono">Directorio `uploads/templates/`</td>
                <td className="py-3 px-4 text-slate-600 font-mono">Directorio `generated/documents/`</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">¿Quién lo crea?</td>
                <td className="py-3 px-4 text-slate-600">Auxiliar o Notario responsable</td>
                <td className="py-3 px-4 text-slate-600">Administrador o Notario Titular</td>
                <td className="py-3 px-4 text-slate-600">El sistema vía motor backend `docxtpl`</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">¿Se puede eliminar?</td>
                <td className="py-3 px-4 text-slate-600">Solo cancelación lógica (mantiene auditoría)</td>
                <td className="py-3 px-4 text-slate-600">Inmutable: pasa a estado ARCHIVADA</td>
                <td className="py-3 px-4 text-slate-600">Inmutable: queda en historial de versiones</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">Identificador típico</td>
                <td className="py-3 px-4 font-mono text-slate-700">EXP-2026-00001</td>
                <td className="py-3 px-4 font-mono text-slate-700">v1, v2 (hash SHA-256)</td>
                <td className="py-3 px-4 font-mono text-slate-700">Versión 1, 2 (hash SHA-256)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips Prácticos y Buenas Prácticas */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Consejos Prácticos para la Operación del Bufete
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              ¿Cuándo subir una nueva versión de plantilla?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Cuando cambia la redacción estándar de una cláusula, se agrega un nuevo campo obligatorio
              o entra en vigencia una reforma legal. Al activar la nueva versión, las anteriores se archivan
              automáticamente y los expedientes futuros usarán el nuevo molde.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ¿Cuándo generar una nueva versión de borrador?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Cuando un cliente rectifica su dirección, DPI o estado civil, o cuando se ajusta el monto
              de la transacción en el expediente. Al re-generar, el sistema crea un nuevo archivo con su
              propio hash sin borrar la versión previa.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Validar antes de generar ahorra tiempo
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Ejecutar la validación previa ayuda a detectar incoherencias (como montos en números que no
              coinciden con letras según el Art. 30, o falta de datos registrales) antes de emitir el documento,
              evitando versiones de borrador innecesarias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Principio de no-sobrescritura
            </h4>
            <p className="text-slate-600 leading-relaxed">
              En el ejercicio notarial la trazabilidad es vital. Por diseño, el sistema nunca sobrescribe
              archivos en disco: cada generación y cada carga de molde produce un registro inmutable con
              marca temporal y usuario autorizante.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-900 leading-relaxed">
            <strong>Recordatorio deontológico:</strong> El borrador generado es una propuesta documental
            altamente verificada, pero la calificación de legalidad, la asesoría y la fe pública pertenecen
            únicamente al Notario autorizante al momento de la firma en el protocolo.
          </p>
        </div>
      </section>
    </div>
  );
};
