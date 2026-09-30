# REGLAS PERMANENTES DEL PROYECTO: SISTEMA DE BORRADORES DE ESCRITURAS PÚBLICAS

## Contexto Académico e Investigación
- **Proyecto de Tesis:** Universidad Mariano Gálvez de Guatemala (UMG).
- **Objetivo de Investigación:** Desarrollar un sistema de borradores de escrituras públicas en Python para reducir el tiempo de revisión de la organización de incisos, datos y consistencia documental de una **línea base de 240 minutos a una meta experimental de 60 minutos** por escritura pública en un bufete jurídico guatemalteco.
- **Principio Fundamental:** El sistema es una herramienta de apoyo para estructurar datos, reutilizar plantillas, reducir transcripción manual y detectar inconsistencias. **No sustituye al Notario, al abogado ni a los registros públicos (RGP, SAT, RENAP)**.
- **Métricas:** La reducción temporal de 240 a 60 minutos es una meta experimental; nunca debe asumirse a priori, sino registrarse y calcularse mediante el módulo de medición con 100 casos sintéticos.

---

## Reglas de Implementación y Ejecución
1. **Código Funcional:** Prohibido dejar `TODO`, `pass`, mocks incompletos o stubs en funcionalidades P0 y P1. Cada funcionalidad debe contar con persistencia, backend, API, frontend y pruebas.
2. **Entorno Local Offline:** El sistema debe operar localmente en **Windows 10/11** sin dependencias obligatorias de servicios cloud ni bases de datos remotas.
3. **Pila Tecnológica:**
   - **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.x, Alembic, SQLite, Pydantic v2, PyJWT, Argon2, docxtpl, python-docx, pandas, openpyxl, pypdf, pytest.
   - **Frontend:** React, TypeScript, Vite, Tailwind CSS, componentes accesibles (estilo shadcn/ui), React Hook Form, Zod, TanStack Query.
4. **Alcance del MVP:**
   - No integrar Inteligencia Artificial generativa externa ni OCR en el MVP.
   - La lectura de PDF se limita a extracción de texto de documentos digitales nativos con `pypdf`.
5. **Generación DOCX:**
   - Debe ejecutarse estrictamente en backend utilizando `docxtpl` con plantillas Jinja2 (`{{ variable }}`).
   - Toda generación debe verificar con `python-docx` que no queden variables sin sustituir antes de marcar la versión como válida.
   - No sobrescribir versiones previas; almacenar siempre el historial en `template_versions` y `document_versions`.
6. **Integridad de Datos Notariales (Guatemala):**
   - **DPI (CUI):** Guardar siempre como `string` de 13 dígitos numéricos. Prohibido convertir a entero.
   - **NIT:** Guardar siempre como `string`. Prohibido convertir a entero.
   - **Valores Monetarios:** Procesar obligatoriamente con `Decimal`, nunca con `float`.
7. **Privacidad y Datos de Prueba:**
   - Usar únicamente datos sintéticos para pruebas y demostraciones.
   - No imprimir en logs ni almacenar en texto plano contraseñas, DPIs reales ni tokens.
8. **Scripts Windows:** Mantener y usar scripts PowerShell en `scripts/` (`dev.ps1`, `test.ps1`, `seed.ps1`, `backup.ps1`).
