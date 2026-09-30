# Sistema de Borradores de Escrituras Públicas y Validación Documental Notarial

> **Proyecto de Graduación 2**  
> **Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
> **Universidad Mariano Gálvez de Guatemala (UMG)**  
> **Investigador:** Marco Antonio Lares Tohom  
> **Línea Base:** 240 minutos → **Meta Experimental:** 60 minutos por escritura

---

## 1. Descripción y Objetivo

Este sistema es una solución tecnológica integral orientada a bufetes jurídicos y notariales de la Ciudad de Guatemala. Permite estructurar datos de clientes y expedientes, reutilizar plantillas notariales en formato DOCX mediante marcadores Jinja2, ejecutar un **motor de reglas de consistencia jurídica (RULE-001 a RULE-020)** y generar borradores limpios sin placeholders residuales, todo bajo un entorno local offline sin costos de licenciamiento ($0).

---

## 2. Pila Tecnológica (Stack)

* **Backend:** Python 3.12+ (probado en Python 3.14), FastAPI, SQLAlchemy 2.x, Alembic, SQLite, Pydantic v2, python-docx, docxtpl, pytest, Ruff.
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios.
* **Automatización:** Scripts PowerShell nativos para Windows 10/11 (`dev.ps1`, `test.ps1`, `backup.ps1`).

---

## 3. Requisitos del Sistema

1. **Sistema Operativo:** Windows 10 o Windows 11 (64-bit).
2. **Python:** 3.12 o superior instalado y disponible en el PATH del sistema.
3. **Node.js:** Versión 18 o superior con `npm`.
4. **Git:** Para control de versiones local.

---

## 4. Instalación Rápida

1. **Clonar o abrir el repositorio:**
   ```powershell
   cd C:\git\apps\notariado-app
   ```

2. **Configurar el Backend:**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   .\.venv\Scripts\alembic upgrade head
   cd ..
   ```

3. **Configurar el Frontend:**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

---

## 5. Ejecución del Sistema

Para arrancar el backend y frontend en un solo comando:
```powershell
.\scripts\dev.ps1
```
* **Frontend:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
* **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Documentación Swagger / OpenAPI:** [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
* **Endpoint de Salud:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 6. Pruebas Automatizadas y Calidad

Para ejecutar la suite completa de pruebas unitarias, de integración, análisis estático y verificación de tipos:
```powershell
.\scripts\test.ps1
```

---

## 7. Estructura del Repositorio

```text
notariado-app/
├── .agents/                    # Reglas e invariantes locales Antigravity
│   ├── rules/                  # Reglas notariales, de tesis y arquitectura
│   └── skills/                 # Skills para DOCX, validación y experimentación
├── backend/                    # API FastAPI, SQLAlchemy, SQLite
│   ├── app/                    # Código fuente modular (core, db, models, api, rules)
│   ├── tests/                  # Pruebas unitarias e integración (pytest)
│   ├── uploads/                # Plantillas y archivos de carga
│   └── generated/              # Borradores DOCX generados
├── frontend/                   # Interfaz de usuario React + TypeScript + Vite
│   └── src/                    # Componentes, servicios, hooks y vistas
├── docs/                       # Documentación formal de arquitectura, scrum y tesis
├── scripts/                    # Scripts PowerShell (dev.ps1, test.ps1, backup.ps1)
├── AGENTS.md                   # Reglas maestras del proyecto
└── README.md                   # Guía de inicio rápido
```