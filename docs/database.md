# ESPECIFICACIÓN DE BASE DE DATOS Y PERSISTENCIA (SQLITE)

## 1. Motor de Persistencia
- **Motor:** SQLite 3 vía SQLAlchemy 2.0.
- **Ubicación:** `backend/app.db`.
- **Estrategia de Migraciones:** Alembic en `backend/alembic/`.

## 2. Invariantes Notariales de Base de Datos
- **DPI:** Almacenado como `String(13)` sin convertir a número entero.
- **NIT:** Almacenado como `String(15)` para permitir formatos con guión (`1234567-8`) o `CF`.
- **Valores Monetarios:** Procesados estrictamente como `Numeric(12, 2)` o `Decimal`.
- **Identificadores Únicos:** UUID v4 en formato `String(36)` para desacoplar de enteros secuenciales.
- **Trazabilidad:** Todos los modelos heredan `created_at` y `updated_at` con marcas de tiempo UTC.