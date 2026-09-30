# NORMAS DE SEGURIDAD Y PROTECCIÓN DE DATOS

## 1. Gestión de Credenciales y Autenticación
- Hash de contraseñas mediante **Argon2** (nunca almacenar en texto plano ni usar algoritmos obsoletos como MD5 o SHA1).
- Tokens de acceso basados en **JWT** con tiempo de vida limitado y revocación básica.
- Control de acceso basado en roles (**RBAC**): `ADMINISTRADOR`, `ABOGADO_NOTARIO`, `AUXILIAR`, `ADMINISTRACION`.
- Verificación de permisos en cada endpoint de la API.

## 2. Manejo Seguro de Archivos
- Validar tipo MIME y extensión de archivo permitida (`.docx`, `.xlsx`, `.csv`, `.pdf`).
- Limitar el tamaño máximo de carga (10 MB por archivo).
- Sanitizar nombres de archivo para evitar ataques de directory traversal (`Path Traversal`).
- Guardar archivos en rutas internas controladas (`backend/uploads/` y `backend/generated/`) con identificadores UUID únicos.

## 3. Privacidad y Registro de Auditoría
- Prohibido registrar datos personales completos (como DPIs reales) o contraseñas en logs del sistema.
- Las tablas de auditoría (`audit_logs`) registrarán: `usuario`, `accion`, `modulo`, `registro_id`, `fecha` y `resultado` sin incluir información sensible íntegra en los mensajes de detalle.
- Cumplimiento de principios de Habeas Data (Art. 31 CPRG).
