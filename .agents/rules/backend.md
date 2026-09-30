# DIRECTRICES ARQUITECTÓNICAS DE BACKEND

## 1. Stack Técnico
- **Lenguaje:** Python 3.12+ compatible con Windows 10/11.
- **Framework Web:** FastAPI (con Pydantic v2).
- **ORM y Migraciones:** SQLAlchemy 2.x (declarative base tipado) y Alembic.
- **Base de Datos:** SQLite local (fichero `backend/app.db`).
- **Motor DOCX:** `python-docx` y `docxtpl` con plantillas Jinja2.
- **Archivos y Hojas de Cálculo:** `openpyxl`, `pandas`, `python-multipart`.
- **Lectura PDF:** `pypdf` exclusivamente para PDFs con texto digital nativo (sin OCR).
- **Pruebas:** `pytest`, `pytest-asyncio`, `pytest-cov`, `httpx`.

## 2. Estructura de Directorios Backend
```text
backend/
├── app/
│   ├── main.py
│   ├── core/           # Configuración, seguridad, hashing, tokens
│   ├── db/             # Conexión SQLite, sesión SQLAlchemy, base
│   ├── models/         # Modelos ORM relacionales
│   ├── schemas/        # Esquemas Pydantic v2 de entrada y salida
│   ├── api/            # Rutas y controladores API REST
│   ├── services/       # Lógica de negocio y orquestación
│   ├── rules/          # Motor de reglas y validaciones notariales (RULE-001..RULE-020)
│   ├── repositories/   # Acceso a datos desacoplado
│   └── utils/          # Sembradores, generador sintético, helpers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── uploads/            # Archivos temporales de importación y plantillas base
├── generated/          # Documentos DOCX generados por versión
├── alembic/
├── alembic.ini
└── requirements.txt
```

## 3. Principios de Implementación
1. **Separación Estricta:** La capa API solo recibe schemas Pydantic, invoca servicios y retorna respuestas HTTP. Las reglas de validación documental residen en `services/` y `rules/`.
2. **Sin Placeholders en Salida:** Toda generación de DOCX mediante `docxtpl` debe ser verificada abriendo el archivo con `python-docx` para comprobar que no existan variables `{{ ... }}` residuales.
3. **Manejo de Transacciones:** Las importaciones de archivos y la creación de versiones documentales deben ejecutarse en transacciones atómicas; ante errores de validación crítica, no persistir datos corruptos.
4. **Validaciones Tipadas:** Validar fechas, DPIs, NITs y montos tanto a nivel Pydantic como en las reglas de coherencia cruzada.
