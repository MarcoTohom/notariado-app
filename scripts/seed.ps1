# ==============================================================================
# Script para sembrar datos demo en base de datos local SQLite
# ==============================================================================

$RootPath = Split-Path -Parent $PSScriptRoot
$BackendPath = Join-Path $RootPath "backend"
$PythonExe = Join-Path $BackendPath ".venv\Scripts\python.exe"

Write-Host "Sembrando usuarios demo y datos iniciales en SQLite..." -ForegroundColor Cyan
Set-Location $BackendPath
& $PythonExe -m app.utils.seed_users

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Base de datos sembrada con éxito." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falló la siembra de datos." -ForegroundColor Red
}
Set-Location $RootPath