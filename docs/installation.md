# GUÍA DE INSTALACIÓN Y CONFIGURACIÓN LOCAL (WINDOWS 10/11)

## 1. Requisitos Previos
- **Windows PowerShell 5.1** o **PowerShell 7+**.
- **Python 3.12+** instalado con checkbox "Add Python to PATH" marcado.
- **Node.js 22.13+** instalado (verificado con 22.16.0; requerido por las herramientas de análisis actuales).

## 2. Paso a Paso de Instalación

### Paso 1: Configurar el Backend
```powershell
Set-Location "C:\git\apps\notariado-app\backend"
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\alembic upgrade head
```

### Paso 2: Configurar el Frontend
```powershell
Set-Location "C:\git\apps\notariado-app\frontend"
npm.cmd ci
npx.cmd playwright install chromium
```

### Paso 3: Verificar la Instalación
```powershell
Set-Location "C:\git\apps\notariado-app"
.\scripts\test.ps1
# Incluye el flujo de la fase cuatro en Chromium con datos temporales:
.\scripts\test.ps1 -E2E
```
Si todas las pruebas finalizan en verde, el sistema se encuentra listo para operar.
