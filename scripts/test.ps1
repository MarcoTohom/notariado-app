$RootPath = Split-Path -Parent $PSScriptRoot
$BackendPath = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"

Write-Host "=== 1. Ejecutando Ruff (Linter & Format Check) ===" -ForegroundColor Cyan
Set-Location $BackendPath
& ".\.venv\Scripts\ruff.exe" check app tests
& ".\.venv\Scripts\ruff.exe" format --check app tests

Write-Host "`n=== 2. Ejecutando Pruebas Unitarias e Integracion Backend (pytest) ===" -ForegroundColor Cyan
& ".\.venv\Scripts\pytest.exe" -v tests

if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en pruebas backend." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n=== 3. Pruebas Unitarias Frontend (Vitest + React Testing Library) ===" -ForegroundColor Cyan
Set-Location $FrontendPath
npm.cmd run test

if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en pruebas frontend." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n=== 4. Compilacion y Verificacion de Tipos Frontend (tsc & vite) ===" -ForegroundColor Cyan
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en verificacion frontend." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[OK] Todas las pruebas de backend y frontend pasaron exitosamente." -ForegroundColor Green
Set-Location $RootPath