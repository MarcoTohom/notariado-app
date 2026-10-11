# Semilla de demostración con archivos (`seed_demo`)

Módulo opcional que siembra **datos 100% sintéticos y archivos reales en disco** para poder
recorrer la interfaz sin carga manual: las plantillas se ven en `Plantillas`, los borradores
en `Documentos`, los adjuntos y archivos generados en `Archivos`, y el editor con vista previa
en `/editor` tiene contenido con el que trabajar.

```powershell
.\scripts\seed_demo.ps1
```

Equivalente directo:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.utils.seed_demo
```

## Qué genera

| Contenido | Cantidad | Cómo se crea |
|---|---:|---|
| Plantillas DOCX | 5 | Servicio real de ingesta `create_template_from_docx` + `activate_version` |
| Versiones de plantilla activadas | 5 | Una `ACTIVA` por plantilla (única vigente) |
| Expedientes | 3 | `case_service.create_case` con comparecientes y ficha maestra |
| Borradores | 20 versiones en 4 documentos | `document_generation_service.generate_draft` |
| Adjuntos | 30 | Escritos en `uploads/attachments/` con `verify_file` |

Las 5 plantillas cubren los cinco tipos de escritura: dos variantes de compraventa (una con
datos registrales), donación, arrendamiento y protocolación de matrimonio.

Los 20 borradores se reparten como historial inmutable: 4 versiones del documento de compraventa
principal, 4 de su variante registral, 6 de donación y 6 de arrendamiento. Todos quedan con
`placeholders_free=True` porque la verificación posterior al render no encuentra residuales.

Los 30 adjuntos se reparten en 10 por expediente alternando formato, para ejercitar las tres
rutas de la vista previa en modal: texto (DOCX y PDF con capa de texto), tabla (CSV y XLSX) y
el estado sin capa de texto (PDF "escaneado"), que el MVP no puede extraer sin OCR.

## Idempotencia

Se puede ejecutar cuántas veces se quiera sin duplicar nada:

- Las plantillas se buscan por nombre exacto; si existen, se reutilizan.
- Los expedientes se buscan por título; si existen, no se recrean.
- Los borradores se completan hasta la cuota objetivo de versiones por documento.
- Los adjuntos respetan la cuota de 10 por expediente antes de insertar.

## Invariantes del proyecto

- **DPI y NIT siempre como `string`.** Se generan con `synthetic_dpi`/`synthetic_nit` y se
  escriben como texto de 13 dígitos; nunca se convierten a entero. Cubierto por prueba.
- **Montos con `Decimal`.** El precio se serializa con `str(Decimal)` y el monto en letras se
  genera con el conversor real del motor de reglas (`amount_to_words`, RULE-008). Sin `float`.
- **DOCX solo en backend.** Los borradores se renderizan con `docxtpl` en el servicio de
  generación; la interfaz solo solicita.
- **Placeholders residuales.** La generación se rechaza si el motor de reglas encuentra
  hallazgos CRITICAL y el estado final se verifica con `python-docx`.

## PDF sin dependencias

El generador de PDF (`build_pdf`) escribe un PDF 1.4 válido conxref y capa de texto en
Helvetica/WinAnsi, sin añadir librerías al proyecto. Se verificó con `pypdf`: el texto se extrae
correctamente y `verify_file` lo acepta. La variante sin capa de texto se genera con una página
sin operadores de texto, que es lo que reproduce un documento escaneado.

## Limpieza

Para volver a empezar desde cero:

```powershell
# Detener los servidores primero
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Después, eliminar `backend/app.db` y las carpetas `backend/uploads/` y `backend/generated/`, y
volver a ejecutar `.\scripts\seed.ps1` y `.\scripts\seed_demo.ps1`.

## Pruebas

`backend/tests/unit/test_seed_demo.py` cubre el generador de PDF (validez, extracción de texto,
variante sin capa de texto, múltiples páginas y escapado de paréntesis), los generadores CSV y
XLSX, la presencia de marcadores Jinja2 y bucles `{% for %}` en las plantillas, la cobertura de
los cinco tipos de escritura y la coherencia de los valores con la ficha maestra.

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/unit/test_seed_demo.py -q
```
