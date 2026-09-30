# ==============================================================================
# Script de arranque del entorno de desarrollo local (Windows 10/11)
# ==============================================================================

$RootPath = Split-Path -Parent $PSScriptRoot
Write-Host "Iniciando Sistema de Borradores de Escrituras Públicas..." -ForegroundColor Cyan

# 1. Iniciar Backend FastAPI en proceso separado
$BackendPath = Join-Path $RootPath "backend"
$PythonExe = Join-Path $BackendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "Error: No se encontró el entorno virtual en $PythonExe" -ForegroundColor Red
    exit 1
}

Write-Host "Arrancando Backend FastAPI en http://127.0.0.1:8000..." -ForegroundColor Green
$backendJob = Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -WorkingDirectory $BackendPath -PassThru

# 2. Iniciar Frontend Vite en proceso actual
$FrontendPath = Join-Path $RootPath "frontend"
Write-Host "Arrancando Frontend Vite en http://127.0.0.1:5173..." -ForegroundColor Green

try {
    Set-Location $FrontendPath
    npm.cmd run dev
} finally {
    Write-Host "Deteniendo servicios en segundo plano..." -ForegroundColor Yellow
    if ($backendJob -and -not $backendJob.HasExited) {
        Stop-Process -Id $backendJob.Id -Force
    }
}