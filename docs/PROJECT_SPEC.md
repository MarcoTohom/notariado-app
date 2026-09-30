# ESPECIFICACIÓN MAESTRA PARA ANTIGRAVITY
## Sistema de borradores de escrituras públicas en Python

> **Propósito:** utilizar este archivo como especificación técnica y funcional principal para que Antigravity construya el proyecto completo, no solamente el scaffolding.
>
> **Contexto académico:** proyecto de tesis de Ingeniería de Sistemas de la Universidad Mariano Gálvez de Guatemala (UMG).
>
> **Objetivo de investigación:** desarrollar un sistema que apoye la elaboración estructurada de borradores de escrituras públicas y la detección de inconsistencias documentales, buscando reducir el tiempo de revisión desde una línea base de **240 minutos a una meta de 60 minutos**.
>
> **Importante:** 240 → 60 minutos es una meta experimental, no un resultado que deba asumirse. El sistema debe registrar y demostrar el tiempo real obtenido.

---

# 1. INSTRUCCIÓN PRINCIPAL PARA ANTIGRAVITY

Actúa como un equipo de desarrollo senior compuesto por:

- arquitecto de software;
- desarrollador backend Python;
- desarrollador frontend React/TypeScript;
- especialista en bases de datos;
- especialista en generación de documentos DOCX;
- ingeniero QA;
- especialista en seguridad de aplicaciones;
- ingeniero DevOps para ejecución local;
- analista de datos para las pruebas experimentales.

Construye el proyecto completo siguiendo esta especificación.

## Reglas de ejecución

1. No te limites a crear carpetas o archivos vacíos.
2. Implementa código funcional.
3. No utilices pseudocódigo en funcionalidades que deban ejecutarse.
4. No dejes `TODO`, `pass`, mocks incompletos o endpoints ficticios en funcionalidades P0/P1.
5. Cada módulo debe incluir backend, persistencia, API, validación, frontend y pruebas cuando corresponda.
6. Ejecuta las pruebas después de implementar cada bloque importante.
7. Cuando una prueba falle, diagnostica la causa, corrige el código y vuelve a ejecutar las pruebas.
8. No marques una tarea como terminada si su prueba correspondiente falla.
9. Mantén el código ejecutable en Windows 10/11.
10. El sistema debe funcionar localmente sin depender de servicios cloud obligatorios.
11. No incorporar inteligencia artificial, OCR, firma electrónica ni servicios externos como requisitos del MVP.
12. Los datos de pruebas deben ser sintéticos.
13. No registrar DPI, contraseñas, tokens ni datos sensibles completos en logs.
14. Utiliza migraciones de base de datos.
15. Mantén separación clara entre modelos ORM, esquemas Pydantic, servicios, reglas de negocio y rutas API.
16. No mezcles lógica de negocio compleja dentro de los componentes React.
17. No generar documentos DOCX directamente desde la interfaz; la generación debe realizarse en backend.
18. No sobrescribas versiones anteriores de plantillas o documentos.
19. Toda modificación importante debe quedar trazable.
20. Al finalizar, ejecuta una verificación integral de backend, frontend, E2E y generación DOCX.
21. Genera documentación técnica suficiente para que otro desarrollador pueda instalar y ejecutar el proyecto.

---

# 2. STACK OBLIGATORIO

## Backend

- Python 3.12+ compatible con una versión estable actual.
- FastAPI.
- Pydantic v2.
- SQLAlchemy 2.x.
- Alembic.
- SQLite.
- python-multipart para cargas de archivos.
- PyJWT o equivalente actual para autenticación JWT.
- Argon2 mediante una biblioteca actual para hash de contraseñas.
- python-docx.
- docxtpl.
- Jinja2.
- pandas.
- openpyxl.
- pypdf para extracción de texto de PDF digital, sin OCR en el MVP.
- Faker.
- pytest.
- pytest-asyncio.
- httpx.
- pytest-cov.
- Ruff.
- mypy cuando sea razonable.

## Frontend

- React.
- TypeScript.
- Vite.
- React Router.
- React Hook Form.
- Zod.
- TanStack Query.
- Axios o cliente HTTP equivalente.
- Tailwind CSS.
- shadcn/ui o una librería de componentes equivalente basada en React.
- Lucide Icons.
- Vitest + React Testing Library.

## E2E

- Playwright para Python o integración Playwright equivalente.
- Chromium como navegador principal de pruebas.

## Control de versiones

- Git.
- GitHub compatible.

No fijar versiones arbitrarias antiguas. Utilizar versiones estables y compatibles entre sí y registrar las versiones realmente instaladas en el proyecto.

---

# 3. ARQUITECTURA

Usar **monolito modular**, no microservicios.

```text
sistema-borradores-escrituras/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/
│   │   ├── rules/
│   │   ├── repositories/
│   │   └── utils/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── uploads/
│   ├── generated/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── types/
│   │   └── routes/
│   ├── tests/
│   └── package.json
│
├── scripts/
│   ├── dev.ps1
│   ├── test.ps1
│   ├── seed.ps1
│   └── backup.ps1
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── templates.md
│   ├── validation-rules.md
│   ├── testing.md
│   └── installation.md
│
├── data/
│   ├── seeds/
│   └── synthetic/
│
├── .agents/
│   ├── rules/
│   └── skills/
│
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

---

# 4. REGLAS PARA ANTIGRAVITY

Crear un `AGENTS.md` raíz con las reglas permanentes del proyecto.

Crear además, cuando sea útil:

```text
.agents/rules/backend.md
.agents/rules/frontend.md
.agents/rules/documents.md
.agents/rules/testing.md
.agents/rules/security.md
```

Crear skills locales para procesos repetibles, especialmente:

```text
.agents/skills/backend-testing/
.agents/skills/docx-template/
.agents/skills/frontend-form-fields/
.agents/skills/e2e-testing/
.agents/skills/synthetic-data/
```

Las reglas deben contener restricciones e invariantes. Las skills deben contener procedimientos repetibles.

---

# 5. MÓDULOS FUNCIONALES

El sistema debe contener como mínimo:

1. Autenticación y usuarios.
2. Roles y permisos.
3. Clientes.
4. Expedientes.
5. Tipos de escritura.
6. Plantillas.
7. Campos dinámicos tipados.
8. Importación de archivos.
9. Validación de datos.
10. Validación de consistencia documental.
11. Generación DOCX.
12. Versionamiento.
13. Cotizaciones.
14. Presupuestos.
15. Cobros.
16. Pagos.
17. Auditoría.
18. Dashboard.
19. Datos sintéticos.
20. Medición experimental.
21. Pruebas automatizadas.

---

# 6. USUARIOS, ROLES Y SEGURIDAD

## 6.1 Usuarios

Entidad mínima:

```text
id
username
email
full_name
password_hash
status
created_at
updated_at
last_login
```

## 6.2 Roles

Crear:

- ADMINISTRADOR
- ABOGADO_NOTARIO
- AUXILIAR
- ADMINISTRACION

## 6.3 Permisos

Implementar permisos granulares:

```text
users.read
users.create
users.update
users.delete

clients.read
clients.create
clients.update
clients.delete

cases.read
cases.create
cases.update
cases.delete

templates.read
templates.create
templates.update
templates.delete
templates.activate

documents.read
documents.create
documents.update
documents.generate

validations.read
validations.execute

quotes.read
quotes.create
quotes.update
quotes.delete

budgets.read
budgets.create
budgets.update

charges.read
charges.create
charges.update

payments.read
payments.create

reports.read
audit.read
```

## 6.4 Seguridad

- Contraseñas con hash seguro.
- JWT con expiración.
- Protección de endpoints.
- Control por rol/permisos.
- No almacenar contraseñas en texto plano.
- No exponer excepciones internas al cliente.
- Validar todos los archivos.
- Limitar tamaño de archivos.
- Sanitizar nombres de archivo.
- Usar rutas internas controladas para almacenamiento.
- No guardar secretos en Git.
- `.env.example` sin secretos reales.
- No incluir datos personales reales en seeds.
- Auditoría de operaciones importantes.

---

# 7. CLIENTES

## 7.1 Persona individual

Campos:

```text
id
tipo_cliente
nombres
apellidos
nombre_completo
dpi
nit
fecha_nacimiento
nacionalidad
estado_civil
profesion
direccion
departamento
municipio
telefono
correo
observaciones
status
created_at
updated_at
```

### Reglas

- DPI y NIT son identificadores y se almacenan como texto.
- El nombre completo puede calcularse.
- Los campos obligatorios deben configurarse.
- DPI y NIT deben poder normalizarse.
- La información debe reutilizarse en formularios de escrituras.

## 7.2 Persona jurídica

Campos:

```text
razon_social
nombre_comercial
nit
tipo_sociedad
numero_inscripcion
datos_registrales
direccion
departamento
municipio
telefono
correo
representante_legal
cargo_representante
observaciones
```

---

# 8. EXPEDIENTES

Entidad:

```text
id
numero_expediente
cliente_id
tipo_operacion
responsable_id
estado
fecha_apertura
fecha_cierre
observaciones
created_at
updated_at
```

Estados:

```text
ABIERTO
EN_REVISION
PENDIENTE
FINALIZADO
CANCELADO
```

Cada expediente debe poder contener:

- personas participantes;
- documentos;
- archivos;
- plantillas utilizadas;
- borradores;
- validaciones;
- cotizaciones;
- presupuesto;
- cobros;
- pagos;
- auditoría.

---

# 9. TIPOS DE ESCRITURA

Crear catálogo inicial:

1. COMPRAVENTA_INMUEBLE.
2. DONACION_ENTRE_VIVOS.
3. ARRENDAMIENTO.
4. PROTOCOLACION_MATRIMONIO.
5. CONSTITUCION_SOCIEDAD.

Permitir posteriormente nuevos tipos sin modificar la arquitectura.

---

# 10. MOTOR DE CAMPOS DINÁMICOS

Este es uno de los componentes principales del proyecto.

Cada plantilla puede declarar sus campos.

Entidad `template_fields`:

```text
id
template_version_id
key
label
field_type
required
nullable
default_value
min_length
max_length
min_value
max_value
regex
mask
format
options_json
source
source_reference
readonly
calculated
calculation_expression
docx_variable
display_order
help_text
active
created_at
updated_at
```

---

# 11. TIPOS DE CAMPO OBLIGATORIOS

Implementar como mínimo:

```text
text
textarea
name
dpi
nit
phone
email
integer
decimal
currency
percentage
date
datetime
boolean
select
relation
file
list
computed
richtext
```

---

# 12. COMPORTAMIENTO DETALLADO DE CADA CAMPO

## text

Frontend: TextBox.

Debe soportar:

- requerido/opcional;
- longitud mínima/máxima;
- normalización de espacios;
- regex;
- ayuda contextual.

Backend: `str`.

## textarea

Para observaciones y texto largo.

Backend: `str`.

Funciones:

- número máximo de caracteres;
- contador;
- requerido/opcional.

## name

Debe:

- permitir letras, tildes y espacios;
- normalizar espacios;
- permitir apellidos compuestos;
- conservar caracteres del español;
- permitir comparación normalizada.

## dpi

Debe ser `string`.

Funciones:

- máscara configurable;
- normalización;
- longitud configurable;
- caracteres permitidos;
- comparación de consistencia;
- estado válido/inválido.

Nunca convertir DPI a entero.

## nit

Debe ser `string`.

Funciones:

- aceptar el formato configurado;
- normalizar separadores;
- regex;
- comparación de consistencia.

Nunca convertir NIT a entero.

## phone

Debe ser `string`.

Funciones:

- máscara;
- longitud;
- caracteres;
- normalización.

## email

Backend: Pydantic `EmailStr` o equivalente.

Funciones:

- validar formato;
- trim;
- lowercase opcional.

## integer

Solo números enteros.

Validar:

- mínimo;
- máximo.

## decimal

Usar `Decimal`, no `float`, para cálculos que afecten valores documentales.

## currency

Usar `Decimal`.

Funciones:

- separador visual;
- dos decimales;
- mínimo;
- máximo;
- subtotal;
- total;
- conversión de formato.

## percentage

Usar `Decimal`.

Validar rango configurable, por defecto 0–100.

## date

Frontend: DatePicker.

Backend: `date`.

Funciones:

- fecha mínima;
- fecha máxima;
- formato;
- comparación con otros campos.

## datetime

Backend: `datetime`.

## boolean

Checkbox/Switch.

## select

Debe cargar un catálogo:

```text
label
value
active
order
```

## relation

Campo tipo autocomplete.

Ejemplo:

```text
Cliente → Juan Pérez López
```

Al seleccionar un cliente, se pueden autocompletar:

```text
dpi
nit
direccion
telefono
correo
estado_civil
```

El frontend nunca debe copiar manualmente la relación como texto si existe el registro relacionado.

## file

Debe permitir:

- seleccionar archivo;
- validar extensión;
- validar tamaño;
- asociar archivo;
- descargar mediante endpoint autorizado.

## list

Debe permitir múltiples objetos.

Casos:

```text
compradores[]
vendedores[]
comparecientes[]
accionistas[]
representantes[]
bienes[]
```

Debe permitir:

- agregar;
- editar;
- eliminar;
- reordenar;
- validar cada elemento.

## computed

Campo calculado.

Debe ser de solo lectura.

Ejemplo:

```text
subtotal = suma(items)
```

## richtext

Utilizar únicamente cuando sea realmente necesario.

Debe sanitizar contenido y evitar ejecución de HTML/JS.

---

# 13. FORMULARIO DINÁMICO

Crear un componente principal:

```text
DynamicForm
```

y componentes especializados:

```text
TextInput
TextArea
NameInput
DpiInput
NitInput
PhoneInput
EmailInput
IntegerInput
DecimalInput
CurrencyInput
PercentageInput
DateInput
DateTimeInput
BooleanInput
SelectInput
RelationInput
FileInput
ListInput
ComputedInput
RichTextInput
```

El backend debe devolver la definición de campos y el frontend debe renderizar el control según `field_type`.

No crear cinco formularios totalmente independientes cuando el mismo motor pueda reutilizarse.

---

# 14. PLANTILLAS DOCX

## 14.1 Modelo

Entidades:

```text
templates
template_versions
template_fields
```

Una plantilla tiene múltiples versiones.

Ejemplo:

```text
Compraventa inmueble
 ├── v1
 ├── v2
 └── v3
```

Solo una versión activa por plantilla.

---

# 15. TOMA DE PLANTILLAS

Implementar el siguiente flujo:

```text
Subir DOCX
    ↓
Validar archivo
    ↓
Crear plantilla
    ↓
Crear versión
    ↓
Analizar contenido
    ↓
Detectar variables explícitas
    ↓
Permitir registro/mapeo manual
    ↓
Configurar campos
    ↓
Configurar reglas
    ↓
Vista previa
    ↓
Documento de prueba
    ↓
Activar versión
```

## Regla importante

La sintaxis principal de variables será:

```text
{{ variable }}
```

Ejemplos:

```text
{{ numero_escritura }}
{{ fecha_escritura }}
{{ comprador.nombre_completo }}
{{ comprador.dpi }}
{{ vendedor.nombre_completo }}
{{ precio }}
```

Para listas:

```jinja2
{% for comprador in compradores %}
{{ comprador.nombre_completo }}
{% endfor %}
```

Para condiciones:

```jinja2
{% if comprador.nit %}
NIT: {{ comprador.nit }}
{% endif %}
```

No permitir ejecución arbitraria de código Python dentro de las plantillas.

---

# 16. DETECCIÓN DE CAMPOS EN PLANTILLAS

Implementar dos mecanismos:

## Primario

Detectar variables explícitas `{{ ... }}`.

## Asistido

Detectar posibles espacios, guiones o marcadores de captura en documentos existentes y mostrar una propuesta de campo.

Nunca convertir automáticamente una inferencia ambigua en variable definitiva. El usuario debe poder confirmar el mapeo.

---

# 17. GENERACIÓN DOCX

Crear servicio:

```text
DocumentGenerationService
```

Proceso:

```text
cargar plantilla
↓
cargar datos
↓
validar contexto
↓
renderizar
↓
generar DOCX
↓
validar resultado
↓
guardar archivo
↓
crear document_version
```

El generador debe procesar:

- párrafos;
- tablas;
- listas;
- campos calculados;
- condiciones;
- valores de clientes;
- múltiples comparecientes.

Después de generar:

- verificar que el archivo exista;
- abrirlo con `python-docx`;
- comprobar que no queden variables `{{ ... }}`;
- registrar versión;
- guardar fecha y usuario.

---

# 18. IMPORTACIÓN DE ARCHIVOS

Soportar:

```text
DOCX
XLSX
CSV
PDF digital como fuente de consulta
```

PDF escaneado sin texto detectable debe quedar marcado como:

```text
EXTRACCION_NO_DISPONIBLE_SIN_OCR
```

No incorporar OCR al MVP.

## XLSX/CSV

Flujo:

```text
Subir
↓
Detectar columnas
↓
Vista previa
↓
Mapear columnas
↓
Transformar tipos
↓
Validar
↓
Mostrar errores
↓
Confirmar
↓
Guardar mediante transacción
```

Ejemplo:

```text
Nombres     → nombres
Apellidos   → apellidos
DPI         → dpi
NIT         → nit
Teléfono    → telefono
```

Registrar errores con:

```text
fila
columna
valor
tipo_error
mensaje
```

---

# 19. MOTOR DE VALIDACIÓN

Crear:

```text
ValidationService
RuleEngine
```

Separar:

## Validaciones estructurales

- requerido;
- tipo;
- longitud;
- regex;
- rango;
- fecha;
- catálogo.

## Validaciones de consistencia

- nombres;
- DPI;
- NIT;
- fechas;
- montos;
- finca;
- folio;
- libro;
- ubicación;
- comparecientes;
- incisos;
- variables sin reemplazar.

---

# 20. REGLAS INICIALES

Crear identificadores:

```text
RULE-001 campo requerido
RULE-002 formato DPI
RULE-003 formato NIT
RULE-004 consistencia DPI
RULE-005 consistencia NIT
RULE-006 consistencia nombre
RULE-007 consistencia fecha
RULE-008 consistencia monto
RULE-009 finca
RULE-010 folio
RULE-011 libro
RULE-012 departamento
RULE-013 municipio
RULE-014 inciso faltante
RULE-015 inciso duplicado
RULE-016 numeración incorrecta
RULE-017 variable sin sustituir
RULE-018 cálculo inconsistente
RULE-019 archivo no válido
RULE-020 registro duplicado
```

Cada regla debe devolver:

```text
rule_id
severity
field_key
message
current_value
expected_value
location
```

Severidades:

```text
CRITICAL
ERROR
WARNING
INFO
```

---

# 21. VALIDACIÓN DE ESCRITURAS

## Compraventa

Debe poder validar:

```text
comprador
vendedor
DPI
NIT
finca
folio
libro
departamento
municipio
precio
```

## Donación

Validar:

```text
donante
donatario
identidad
relaciones requeridas
fecha
bienes
```

## Arrendamiento

Validar:

```text
arrendador
arrendatario
inmueble
plazo
fecha_inicio
fecha_fin
renta
```

## Protocolación de matrimonio

Validar:

```text
comparecientes
identidad
fechas
referencias del matrimonio
```

## Constitución de sociedad

Validar:

```text
socios/accionistas
aportes
porcentajes
capital
representante
datos societarios
```

---

# 22. PANEL DE INCONSISTENCIAS

La interfaz debe mostrar:

```text
┌────────────────────────────────────────┐
│ ERROR CRÍTICO                           │
│ DPI del comprador no coincide.         │
│                                        │
│ Documento: 1234567890102               │
│ Expediente: 1234567890101              │
│                                        │
│ [Ir al campo] [Corregir]               │
└────────────────────────────────────────┘
```

El usuario debe poder:

- filtrar por severidad;
- filtrar por campo;
- ver valor encontrado;
- ver valor esperado;
- ir directamente al control afectado;
- marcar como revisada cuando la regla lo permita;
- registrar la corrección.

---

# 23. VERSIONAMIENTO

No sobrescribir:

```text
template_versions
document_versions
```

Cada versión registra:

```text
version_number
created_by
created_at
source_template_id
data_snapshot
validation_status
file_path
notes
```

La generación debe poder reconstruir qué plantilla y qué datos produjeron una versión.

---

# 24. COTIZACIONES

Entidad:

```text
quotes
quote_items
```

Cabecera:

```text
id
numero
cliente_id
expediente_id
fecha
fecha_vencimiento
estado
subtotal
descuento
total
observaciones
created_by
```

Detalle:

```text
descripcion
cantidad
precio_unitario
subtotal
```

Estados:

```text
BORRADOR
ENVIADA
ACEPTADA
RECHAZADA
VENCIDA
CANCELADA
```

Funciones:

- crear;
- editar;
- duplicar;
- calcular totales;
- cambiar estado;
- consultar historial.

---

# 25. PRESUPUESTOS

Entidad:

```text
budgets
budget_items
```

Permitir:

- ingresos estimados;
- gastos estimados;
- otros costos;
- subtotales;
- total;
- margen proyectado;
- asociación al expediente.

No implementar contabilidad empresarial completa.

---

# 26. COBROS Y PAGOS

## Cobro

Campos:

```text
id
cliente_id
expediente_id
concepto
monto
fecha_emision
fecha_vencimiento
estado
```

Estados:

```text
PENDIENTE
PARCIAL
PAGADO
VENCIDO
ANULADO
```

## Pago

Campos:

```text
id
charge_id
fecha
monto
medio_pago
referencia
observaciones
created_by
```

Recalcular automáticamente:

```text
monto_cobro
- pagos
= saldo
```

No utilizar `float` para valores monetarios.

---

# 27. AUDITORÍA

Registrar al menos:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE_LOGICAL
IMPORT
VALIDATE
GENERATE_DOCUMENT
CREATE_VERSION
PAYMENT
PERMISSION_CHANGE
```

Guardar:

```text
usuario
accion
modulo
registro_id
fecha
resultado
```

Evitar guardar información sensible completa dentro del mensaje de log.

---

# 28. DASHBOARD

Mostrar como mínimo:

```text
clientes activos
expedientes activos
borradores
validaciones pendientes
cotizaciones abiertas
cobros pendientes
```

Agregar sección de tesis:

```text
casos evaluados
tiempo tradicional promedio
tiempo con sistema promedio
reducción porcentual
inconsistencias detectadas
```

El dashboard experimental debe mostrar valores calculados desde datos reales de prueba, nunca valores fijos.

---

# 29. MEDICIÓN EXPERIMENTAL

Crear entidades:

```text
test_cases
test_executions
time_measurements
```

Cada medición:

```text
test_case_id
method
started_at
finished_at
duration_seconds
duration_minutes
errors_found
errors_missed
corrections
notes
```

Métodos:

```text
TRADITIONAL
SYSTEM
```

Calcular:

```text
reduction_percentage =
((traditional_minutes - system_minutes) /
 traditional_minutes) * 100
```

No insertar artificialmente 60 minutos como resultado.

---

# 30. DATOS SINTÉTICOS

Crear script:

```text
backend/app/utils/seed_synthetic.py
```

Generar 100 casos:

| Tipo | Casos |
|---|---:|
| Compraventa de inmueble | 20 |
| Donación entre vivos | 20 |
| Arrendamiento | 20 |
| Protocolación de matrimonio | 20 |
| Constitución de sociedad | 20 |

Distribuir casos:

- válidos;
- DPI inconsistente;
- NIT inconsistente;
- nombre inconsistente;
- fecha inconsistente;
- monto inconsistente;
- finca/folio/libro inconsistente;
- inciso faltante;
- inciso duplicado;
- campo obligatorio vacío.

Los datos deben ser claramente sintéticos.

---

# 31. PRUEBAS BACKEND

## Unitarias

Crear pruebas para:

```text
DPI
NIT
nombres
correo
teléfono
fecha
Decimal
porcentaje
campos requeridos
listas
relaciones
cálculos
reglas de validación
```

## Integración

Probar:

```text
usuarios
clientes
expedientes
plantillas
campos
importaciones
validaciones
documentos
cotizaciones
presupuestos
cobros
pagos
```

## Documentos

Cada generación debe comprobar:

1. existe;
2. es `.docx`;
3. puede abrirse;
4. variables sustituidas;
5. no quedan placeholders;
6. datos esperados presentes;
7. versión registrada.

## Importación

Probar:

- XLSX válido;
- XLSX vacío;
- CSV válido;
- columnas faltantes;
- datos incorrectos;
- duplicados;
- extensiones no permitidas;
- archivos demasiado grandes.

---

# 32. PRUEBAS FRONTEND

Con Vitest + React Testing Library probar:

- login;
- protección de rutas;
- formulario dinámico;
- DPI input;
- NIT input;
- currency input;
- date input;
- select;
- relation input;
- list/repeater;
- mensajes de validación;
- panel de inconsistencias;
- tablas;
- formularios de cotización;
- formularios de cobros.

---

# 33. PRUEBAS E2E

Crear al menos estos escenarios:

## E2E-001

```text
Login
→ crear cliente
→ crear expediente
→ seleccionar plantilla
→ completar formulario
→ validar
→ generar DOCX
```

## E2E-002

```text
Importar XLSX
→ revisar errores
→ corregir
→ confirmar
```

## E2E-003

```text
Crear plantilla
→ definir campos
→ probar generación
→ activar versión
```

## E2E-004

```text
Crear cotización
→ agregar servicios
→ calcular total
→ cambiar estado
```

## E2E-005

```text
Crear cobro
→ registrar pago
→ verificar saldo
```

## E2E-006

```text
Usuario sin permiso
→ intenta acceder a función restringida
→ sistema rechaza
```

---

# 34. PRUEBA E2E PRINCIPAL DE TESIS

Debe quedar automatizada:

```text
Login
 ↓
Cliente
 ↓
Expediente
 ↓
Plantilla
 ↓
Campos
 ↓
Datos
 ↓
Validación
 ↓
Detectar inconsistencias
 ↓
Corregir
 ↓
Generar DOCX
 ↓
Crear versión
 ↓
Registrar medición
```

---

# 35. CALIDAD DE CÓDIGO

Backend:

```text
ruff check
ruff format
pytest
pytest --cov
mypy
```

Frontend:

```text
npm run lint
npm run test
npm run build
```

E2E:

```text
pytest tests/e2e
```

Crear scripts PowerShell para facilitar:

```text
.\scripts\dev.ps1
.\scripts\test.ps1
.\scripts\seed.ps1
.\scripts\backup.ps1
```

---

# 36. API REST

Prefijo:

```text
/api/v1
```

Endpoints mínimos:

```text
POST   /auth/login
GET    /users
POST   /users
PUT    /users/{id}

GET    /clients
POST   /clients
GET    /clients/{id}
PUT    /clients/{id}

GET    /cases
POST   /cases
GET    /cases/{id}
PUT    /cases/{id}

GET    /deed-types
GET    /templates
POST   /templates
GET    /templates/{id}
POST   /templates/{id}/versions
POST   /templates/{id}/activate

GET    /template-fields
POST   /template-fields

POST   /imports
GET    /imports/{id}
POST   /imports/{id}/preview
POST   /imports/{id}/confirm

POST   /documents
GET    /documents/{id}
POST   /documents/{id}/validate
POST   /documents/{id}/generate
GET    /documents/{id}/versions

GET    /validations/{document_id}

GET    /quotes
POST   /quotes
GET    /quotes/{id}
PUT    /quotes/{id}

GET    /budgets
POST   /budgets
PUT    /budgets/{id}

GET    /charges
POST   /charges
GET    /charges/{id}
PUT    /charges/{id}

POST   /payments
GET    /payments/{id}

GET    /dashboard
GET    /reports/experimental
```

Cada endpoint debe tener:

- esquema de entrada;
- esquema de salida;
- validación;
- autorización;
- errores HTTP apropiados;
- pruebas.

---

# 37. BASE DE DATOS

Crear como mínimo estas entidades:

```text
roles
permissions
users
role_permissions
audit_logs

clients
persons
legal_entities
client_contacts

cases
case_parties
deed_types

templates
template_versions
template_fields
validation_rules

files
imports
import_rows

documents
document_versions
validation_results

services
quotes
quote_items

budgets
budget_items

charges
payments

test_cases
test_executions
time_measurements
```

Utilizar claves foráneas y restricciones apropiadas.

Aplicar eliminación lógica en registros donde la eliminación física pueda comprometer trazabilidad.

---

# 38. FRONTEND

Crear un layout principal:

```text
Sidebar
Topbar
Content
Notifications
```

Rutas mínimas:

```text
/login
/dashboard
/users
/clients
/cases
/templates
/templates/:id
/documents
/documents/:id
/imports
/quotes
/budgets
/charges
/payments
/reports
/settings
```

## Formularios

Usar React Hook Form + Zod.

## API

Usar TanStack Query.

## Estado

No duplicar innecesariamente el estado del servidor en estado global.

---

# 39. UX DEL GENERADOR

Pantalla:

```text
┌────────────────────────────────────────────────┐
│ EXPEDIENTE 2026-0001                           │
├────────────────────────────────────────────────┤
│ Tipo: Compraventa de inmueble                  │
│ Plantilla: Compraventa v3                      │
├────────────────────────────────────────────────┤
│ DATOS                                          │
│                                                │
│ Comprador                                      │
│ [Nombre____________________]                   │
│ [DPI_______________________]                   │
│                                                │
│ Vendedor                                       │
│ [Nombre____________________]                   │
│ [DPI_______________________]                   │
│                                                │
│ Precio                                         │
│ [Q ________________]                           │
├────────────────────────────────────────────────┤
│ VALIDACIÓN                                     │
│ ✓ 28 campos válidos                            │
│ ⚠ 2 advertencias                               │
│ ✕ 1 error                                      │
├────────────────────────────────────────────────┤
│ [Guardar] [Validar] [Generar DOCX]             │
└────────────────────────────────────────────────┘
```

El botón **Generar DOCX** debe requerir que no existan errores críticos.

---

# 40. PREVISIÓN DE PLANTILLAS DE TESIS

Crear ejemplos funcionales para:

1. Compraventa.
2. Donación.
3. Arrendamiento.
4. Protocolación de matrimonio.
5. Constitución de sociedad.

No utilizar textos legales reales completos ni información personal real en los datos de demostración. Crear plantillas académicas sintéticas con estructura suficiente para probar variables, listas, condiciones y validaciones.

---

# 41. RENDIMIENTO

Objetivos del MVP local:

- API CRUD simple: respuesta razonablemente inmediata en entorno local.
- Validación de un expediente: sin esperas innecesarias.
- Generación DOCX: mostrar indicador de progreso cuando sea necesario.
- Importación: procesar archivos de prueba sin bloquear la interfaz.
- Búsquedas con paginación.
- Evitar consultas N+1 evidentes.
- No cargar todos los clientes o expedientes de golpe.

No introducir Redis, Celery, RabbitMQ u otros componentes de infraestructura mientras no exista una necesidad demostrada.

---

# 42. ARCHIVOS Y ALMACENAMIENTO

Usar almacenamiento local:

```text
backend/uploads/
backend/generated/
```

Separar:

```text
templates/
imports/
attachments/
generated_documents/
```

Generar nombres internos seguros.

No utilizar directamente el nombre enviado por el navegador como nombre final de almacenamiento.

---

# 43. RESPALDOS

Crear:

```text
scripts/backup.ps1
```

Debe poder:

- copiar SQLite;
- copiar archivos necesarios;
- crear carpeta con fecha;
- informar éxito/error.

Agregar instrucciones en `docs/installation.md`.

---

# 44. DOCUMENTACIÓN OBLIGATORIA

Crear:

```text
README.md
docs/architecture.md
docs/database.md
docs/api.md
docs/templates.md
docs/validation-rules.md
docs/testing.md
docs/installation.md
docs/user-manual.md
```

README debe incluir:

- objetivo;
- stack;
- requisitos;
- instalación;
- ejecución;
- pruebas;
- credenciales demo;
- seed;
- estructura.

Nunca incluir secretos reales.

---

# 45. DATOS DEMO

Crear usuario administrador de desarrollo:

```text
usuario: admin
contraseña: Admin123!
```

Usarlo solamente como credencial de desarrollo local y documentar que debe cambiarse.

Crear además:

```text
notario.demo
auxiliar.demo
adminfin.demo
```

Todos con contraseñas de desarrollo claramente identificadas y nunca destinadas a producción.

---

# 46. CRITERIOS DE ACEPTACIÓN POR MÓDULO

## Usuarios

- Login funciona.
- Contraseña no se almacena en texto plano.
- Roles limitan acciones.
- Pruebas pasan.

## Clientes

- Se puede crear y editar.
- DPI/NIT se almacenan como texto.
- Búsqueda funciona.
- Datos pueden reutilizarse en documentos.

## Expedientes

- Se asocian clientes.
- Se agregan participantes.
- Se agregan documentos.

## Plantillas

- Se puede subir DOCX.
- Se puede versionar.
- Se pueden registrar variables.
- Se puede probar.

## Campos

- Cada tipo tiene control propio.
- Frontend valida.
- Backend valida.
- Los errores son claros.

## Importación

- XLSX/CSV funcionan.
- Se muestra preview.
- Se mapean columnas.
- Se muestran errores.
- Se confirma transaccionalmente.

## Validación

- Detecta inconsistencias configuradas.
- Clasifica severidad.
- Muestra ubicación.
- Permite corregir.

## DOCX

- Se genera archivo válido.
- No quedan placeholders.
- Versiones quedan registradas.

## Cotizaciones

- CRUD funciona.
- Totales se calculan correctamente.

## Presupuestos

- Ingresos, gastos y margen se calculan.

## Cobros/Pagos

- Saldo se actualiza correctamente.
- Estados se calculan.

## Tesis

- Se pueden generar 100 casos.
- Se pueden ejecutar mediciones.
- Se calcula reducción real.

---

# 47. DEFINICIÓN GLOBAL DE DONE

Una funcionalidad sólo puede marcarse como DONE cuando:

```text
[ ] Implementada
[ ] Persistencia funcionando
[ ] Validación backend
[ ] UI funcional cuando corresponda
[ ] Error handling
[ ] Prueba unitaria o integración
[ ] Documentada
[ ] Formateada/lint
[ ] Sin TODO pendiente
[ ] Prueba ejecutada y aprobada
```

Para una funcionalidad crítica de extremo a extremo:

```text
[ ] Backend
[ ] Database
[ ] API
[ ] Frontend
[ ] Test unit
[ ] Test integration
[ ] Test E2E
```

---

# 48. ORDEN DE IMPLEMENTACIÓN

No desarrollar todo simultáneamente.

## Fase 1 — Base

1. Repositorio.
2. Backend.
3. Frontend.
4. SQLite.
5. Alembic.
6. Configuración.
7. CI local.
8. README inicial.

## Fase 2 — Seguridad

1. Usuarios.
2. Roles.
3. JWT.
4. Auditoría.

## Fase 3 — Información jurídica

1. Clientes.
2. Personas.
3. Expedientes.
4. Tipos de escritura.

## Fase 4 — Motor de formularios

1. Definición de campos.
2. Componentes tipados.
3. Validación Zod.
4. Validación Pydantic.
5. Relaciones.
6. Listas.
7. Campos calculados.

## Fase 5 — Plantillas

1. Upload DOCX.
2. Versionamiento.
3. Variables.
4. Mapeo.
5. Prueba de plantilla.

## Fase 6 — Validación documental

1. Rule engine.
2. Reglas estructurales.
3. Reglas de consistencia.
4. Panel de errores.

## Fase 7 — Generación

1. docxtpl.
2. render.
3. verificación.
4. versionamiento.

## Fase 8 — Importación

1. CSV.
2. XLSX.
3. DOCX.
4. PDF digital.
5. validación/mapeo.

## Fase 9 — Administración

1. Cotizaciones.
2. Presupuestos.
3. Cobros.
4. Pagos.

## Fase 10 — QA

1. Unit tests.
2. Integration tests.
3. Frontend tests.
4. E2E.
5. Cobertura.
6. Corrección de fallos.

## Fase 11 — Experimento

1. Generar 100 casos.
2. Introducir inconsistencias controladas.
3. Ejecutar mediciones.
4. Calcular estadísticas.
5. Generar reporte.

---

# 49. VERIFICACIÓN FINAL OBLIGATORIA

Antes de declarar el proyecto terminado, Antigravity debe ejecutar y documentar:

```text
Backend:
pytest
pytest --cov
ruff check
ruff format --check

Frontend:
npm run lint
npm run test
npm run build

E2E:
pytest tests/e2e
```

Después:

1. Arrancar backend.
2. Arrancar frontend.
3. Crear/sembrar base de datos.
4. Iniciar sesión.
5. Crear cliente.
6. Crear expediente.
7. Crear/tomar plantilla.
8. Completar campos.
9. Introducir deliberadamente una inconsistencia.
10. Ejecutar validación.
11. Confirmar detección.
12. Corregir.
13. Generar DOCX.
14. Abrir el DOCX mediante `python-docx`.
15. Confirmar ausencia de placeholders.
16. Crear segunda versión.
17. Crear cotización.
18. Crear presupuesto.
19. Crear cobro.
20. Registrar pago.
21. Generar/consultar reporte experimental.
22. Ejecutar nuevamente toda la suite.

---

# 50. ENTREGABLE FINAL ESPERADO

El proyecto terminado debe contener:

```text
[OK] Backend FastAPI
[OK] Frontend React/TypeScript
[OK] SQLite
[OK] Migraciones
[OK] Autenticación
[OK] Roles y permisos
[OK] Clientes
[OK] Expedientes
[OK] Plantillas DOCX
[OK] Campos dinámicos tipados
[OK] Importación
[OK] Validación
[OK] Generación DOCX
[OK] Versionamiento
[OK] Cotizaciones
[OK] Presupuestos
[OK] Cobros
[OK] Pagos
[OK] Auditoría
[OK] Dashboard
[OK] Datos sintéticos
[OK] Medición
[OK] Pruebas unitarias
[OK] Pruebas integración
[OK] Pruebas frontend
[OK] Pruebas E2E
[OK] Documentación
[OK] Scripts Windows
```

---

# 51. REGLA ESPECIAL SOBRE EL OBJETIVO DE LA TESIS

El sistema no debe presentarse como sustituto del notario, abogado o registro oficial.

Su propósito técnico es:

```text
estructurar datos
→ reutilizar plantillas
→ reducir transcripción
→ detectar inconsistencias
→ acelerar la revisión
→ generar un borrador DOCX
```

El éxito de la investigación debe demostrarse mediante medición.

No escribir afirmaciones como:

> "El sistema reduce el tiempo a 60 minutos"

antes de ejecutar el experimento.

Usar:

> "La meta experimental es evaluar si el sistema permite reducir el tiempo de revisión desde la línea base de 240 minutos hasta aproximadamente 60 minutos."

---

# 52. INSTRUCCIÓN FINAL PARA EL AGENTE

No finalices después de crear el primer prototipo.

Continúa hasta que:

1. el proyecto ejecute;
2. los módulos P0 estén completos;
3. los módulos P1 estén funcionales;
4. la base de datos pueda migrarse desde cero;
5. los datos sintéticos puedan generarse;
6. las plantillas puedan cargarse;
7. los formularios dinámicos funcionen;
8. las reglas detecten inconsistencias;
9. los DOCX puedan generarse;
10. las pruebas automatizadas pasen;
11. el flujo E2E principal pase;
12. exista documentación de instalación y uso.

Cuando encuentres ambigüedades menores, selecciona la alternativa técnicamente más sencilla y coherente con esta arquitectura, documenta la decisión y continúa.

No reemplaces el objetivo de tesis por funcionalidades secundarias.

Prioridad absoluta:

**CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN.**
