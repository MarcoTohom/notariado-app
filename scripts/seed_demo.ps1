# =============================================================================
# Semilla de demostracion con archivos reales (plantillas, borradores, adjuntos)
# Datos 100% sinteticos. Es idempotente: puede ejecutarse varias veces.
# =============================================================================

$RootPath = Split-Path -Parent $PSScriptRoot
$BackendPath = Join-Path $RootPath "backend"
$PythonExe = Join-Path $BackendPath ".venv\Scripts\python.exe"

Write-Host "Sembrando datos de demostracion con archivos (sinteticos)..." -ForegroundColor Cyan
Set-Location $BackendPath

# Requiere las cuentas demo (permisos, authorship de plantillas y borradores).
& $PythonExe -m app.utils.seed_users
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo la siembra de usuarios demo." -ForegroundColor Red
    Set-Location $RootPath
    exit 1
}

& $PythonExe -m app.utils.seed_demo
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Datos de demostracion listos." -ForegroundColor Green
    Write-Host "     Revise /plantillas, /expedientes, /documentos y /archivos." -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Fallo la siembra de demostracion." -ForegroundColor Red
}
Set-Location $RootPath
