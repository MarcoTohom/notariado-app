export interface ProjectPhase {
  id: string;
  title: string;
  status: "DONE" | "IN_PROGRESS" | "PENDING";
  commit?: string;
  summary: string;
}

export const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: "F1",
    title: "Fase 1: Fundación Arquitectónica, Entorno y CI",
    status: "DONE",
    commit: "209c9cb",
    summary:
      "Backend FastAPI, SQLite app.db, migraciones Alembic, Pydantic v2, frontend React 18 / TypeScript / Tailwind CSS y scripts PowerShell.",
  },
  {
    id: "F2",
    title: "Fase 2: Seguridad, Roles RBAC, Usuarios y Auditoría",
    status: "DONE",
    commit: "67a67d3",
    summary:
      "Hash Argon2, tokens JWT, modelo users, 4 roles notariales, permisos granulares, bitácora de auditoría y siembra demo.",
  },
  {
    id: "F3",
    title: "Fase 3: Clientes y Expedientes Notariales",
    status: "DONE",
    commit: "5d745a5",
    summary:
      "CRUD de personas individuales (DPI 13 dígitos) y jurídicas, expedientes EXP-YYYY-##### y gestión de comparecientes con calidades.",
  },
  {
    id: "F4",
    title: "Fase 4: Campos Dinámicos Tipados",
    status: "DONE",
    commit: "a056427",
    summary:
      "Motor de 20 tipos de campos dinámicos con DynamicForm, autocompletado de clientes, listas reordenables y cálculos Decimal.",
  },
  {
    id: "F5",
    title: "Fase 5: Repositorio y Versionamiento de Plantillas DOCX",
    status: "DONE",
    commit: "5346bec",
    summary:
      "Carga de plantillas DOCX, extracción léxica de variables Jinja2, versionamiento inmutable con activación única y render de prueba verificado.",
  },
  {
    id: "F6",
    title: "Fase 6: Motor de Reglas Notariales RULE-001..020",
    status: "DONE",
    commit: "5f2cb1a",
    summary:
      "Evaluación algorítmica de 20 reglas (DPI, NIT, registro, montos en letras Art. 30) con clasificación de severidades y panel interactivo.",
  },
  {
    id: "F7",
    title: "Fase 7: Generación Verificada de Borradores DOCX",
    status: "DONE",
    commit: "1ce014b",
    summary:
      "Generación server-side con docxtpl, auditoría de cero placeholders residuales con python-docx, bloqueo por hallazgos críticos e historial inmutable.",
  },
  {
    id: "F11",
    title: "Fase 11: Experimento de Tesis (100 Casos Sintéticos)",
    status: "DONE",
    commit: "b8ca802",
    summary:
      "Generación de 100 expedientes sintéticos distribuidos en 5 tipos de escritura, cronómetro por etapas, t-Student/Wilcoxon y exportación XLSX/CSV.",
  },
  {
    id: "WP-01",
    title: "WP-01: Landing Page Profesional de Mercado Legal",
    status: "DONE",
    summary:
      "Página pública en / orientada a bufetes guatemaltecos con propuesta de valor, pilares arquitectónicos, flujo en 4 pasos y nota de cumplimiento.",
  },
  {
    id: "WP-02",
    title: "WP-02: Panel Técnico Solo-Admin y Seguimiento de Fases",
    status: "DONE",
    summary:
      "Reubicación del dashboard a /admin/proyecto con guardián RequireAuth adminOnly y visualización data-driven de todas las fases del proyecto.",
  },
  {
    id: "WP-03",
    title: "WP-03: Gestión de Usuarios (Rol, Permisos y Estado)",
    status: "PENDING",
    summary:
      "Edición de rol, overrides de permisos granulares (grant/revoke) y estado de activación con auditoría PERMISSION_CHANGE.",
  },
  {
    id: "WP-04",
    title: "WP-04: Módulo de Evaluación de Tesis Solo para Administradores",
    status: "PENDING",
    summary:
      "Restricción de permisos experiment:read/execute a rol ADMINISTRADOR en roles.py y comprobación en pruebas de integración.",
  },
  {
    id: "WP-05",
    title: "WP-05: Inventario y Verificación de Archivos + Preview en Modal",
    status: "PENDING",
    summary:
      "Vista de archivos en uploads/generated con verificación hash/size y modal de preview in-app (docx, pdf, tablas) sin descarga.",
  },
  {
    id: "WP-06",
    title: "WP-06: Guía Notarial: Plantillas vs. Borradores vs. Expedientes",
    status: "PENDING",
    summary:
      "Página in-app /guia y componentes ModuleTip con diferencias conceptuales, matriz de ciclo de vida y consejos de buenas prácticas.",
  },
  {
    id: "WP-07",
    title: "WP-07: Editor de Borradores con Formulario y Preview en Vivo",
    status: "PENDING",
    summary:
      "Editor de dos columnas (/editor) con preview HTML server-side en tiempo real y manipulación de incisos (agregar, eliminar, reordenar).",
  },
  {
    id: "WP-08",
    title: "WP-08: Atajos de Teclado en el Editor con Hints Visibles",
    status: "PENDING",
    summary:
      "Atajos de teclado (Ctrl+S, Ctrl+Enter, Alt+N, etc.), navegación con Tab y chips kbd en el editor de borradores.",
  },
];
