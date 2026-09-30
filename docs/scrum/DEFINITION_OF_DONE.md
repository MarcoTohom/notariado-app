# DEFINICIÓN GLOBAL DE TERMINADO (DEFINITION OF DONE - DoD)
**Sistema de Borradores de Escrituras Públicas en Python**  
**Facultad de Ingeniería en Sistemas - UMG**

---

## 1. Definición Global de Terminado (Global DoD)

Una funcionalidad, historia de usuario o incremento de software solo se considerará **DONE** cuando cumpla rigurosamente con los siguientes diez puntos:

```text
[ ] 1. CÓDIGO IMPLEMENTADO:
       Funcionalidad completamente programada sin stubs, sin funciones vacías (`pass`),
       ni comentarios `TODO` pendientes en funcionalidades P0 y P1.

[ ] 2. PERSISTENCIA EN BASE DE DATOS:
       Modelos SQLAlchemy 2.0 y migraciones de Alembic creadas y ejecutadas sobre SQLite
       sin errores de integridad referencial.

[ ] 3. VALIDACIÓN EN BACKEND:
       Esquemas Pydantic v2 validando tipos, rangos, obligatoriedad y reglas de negocio.
       Manejo de excepciones centralizado sin exponer trazas internas (`500`) al cliente.

[ ] 4. INTERFAZ DE USUARIO FUNCIONAL:
       Componentes React/TypeScript integrados con validación en cliente (Zod + RHF),
       estados de carga (spinners), manejo visual de errores y diseño responsivo accesible.

[ ] 5. VERIFICACIÓN Y CERO PLACEHOLDERS (MÓDULOS DE DOCUMENTO):
       Para generación de DOCX, comprobación obligatoria mediante `python-docx` de que
       no existe ninguna variable `{{ ... }}` residual antes de permitir la descarga.

[ ] 6. PRUEBAS AUTOMATIZADAS APROBADAS:
       Pruebas unitarias y de integración asociadas escritas en `pytest` o `vitest`,
       ejecutadas y pasando al 100% de éxito.

[ ] 7. ANÁLISIS ESTÁTICO Y FORMATEO:
       Código verificado mediante `ruff check`, `ruff format` en backend y `npm run lint`
       en frontend sin advertencias críticas ni errores de sintaxis.

[ ] 8. SEGURIDAD Y PRIVACIDAD:
       Verificación de control de accesos RBAC; ausencia de contraseñas, tokens
       o datos personales reales en registros de log o archivos sembradores.

[ ] 9. COMPATIBILIDAD CON WINDOWS:
       Ejecución comprobada en el sistema operativo Windows 10/11 utilizando las rutas
       y scripts de PowerShell provistos (`scripts/*.ps1`).

[ ] 10. DOCUMENTACIÓN TÉCNICA:
        Endpoints documentados en Swagger/OpenAPI y actualización de las guías de
        referencia en la carpeta `docs/`.
```

---

## 2. Criterios Específicos de Aceptación por Módulo

### Módulo 1: Seguridad y Usuarios
- Las contraseñas se almacenan mediante hash **Argon2**.
- Los tokens JWT tienen tiempo de expiración y clave secreta configurable en `.env`.
- Los roles restringen las acciones de lectura, creación, edición y eliminación de acuerdo a la matriz de permisos.

### Módulo 2: Sujetos de Derecho y Clientes
- Los campos **DPI** y **NIT** se almacenan estrictamente como texto (`string`).
- El DPI de 13 dígitos numéricos valida longitud y estructura territorial de Guatemala.
- El nombre completo preserva caracteres del español (tildes, `ñ`) y normaliza espacios en blanco duplicados.

### Módulo 3: Formularios Dinámicos
- Cada uno de los 20 tipos de campos cuenta con su control especializado en frontend.
- Los campos monetarios operan internamente con precisión fija `Decimal`, no con `float`.
- Los campos de tipo lista (`compradores`, `vendedores`, `accionistas`) permiten agregar, eliminar y editar elementos de forma dinámica y validada.

### Módulo 4: Plantillas y Generación DOCX
- Al cargar un DOCX, el motor extrae todas las variables Jinja2 sin corromper el formato del archivo Word.
- El versionamiento es inmutable: nunca se sobrescriben archivos o registros de versiones pasadas.
- La generación de un documento borrador produce un archivo válido que puede abrirse nativamente en Microsoft Word o LibreOffice.

### Módulo 5: Motor de Reglas Notariales
- El motor detecta las discrepancias configuradas (RULE-001 a RULE-020).
- Cada inconsistencia identificada reporta severidad, mensaje amigable, valor actual, valor esperado y ubicación en la cláusula o inciso.
- El panel visual permite navegar directamente al campo afectado para corregir el error.

### Módulo 6: Módulo Experimental de Tesis
- Generación exitosa de los 100 casos sintéticos distribuidos (20 por cada tipo de escritura).
- El sistema cronometra y registra la duración exacta de revisión y número de errores encontrados.
- La tasa de reducción temporal se calcula matemáticamente con base en datos reales generados, no en valores ficticios hardcodeados.
