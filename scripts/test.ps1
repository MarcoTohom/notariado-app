param([switch]$E2E)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment
Assert-FrontendEnvironment
$PreviousLocation = Get-Location
$PreviousTemp = $env:TEMP
$PreviousTmp = $env:TMP
$PreviousBrowserPath = $env:PLAYWRIGHT_BROWSERS_PATH

try {
    $env:TEMP = Join-Path $BackendPath '.venv\temp'
    $env:TMP = $env:TEMP
    New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
    Set-Location $BackendPath
    Write-Host '1. Ruff: lint y formato' -ForegroundColor Cyan
    Invoke-CheckedCommand $PythonExe @('-m', 'ruff', 'check', 'app', 'tests')
    Invoke-CheckedCommand $PythonExe @('-m', 'ruff', 'format', '--check', 'app', 'tests')
    Write-Host '2. Pruebas backend' -ForegroundColor Cyan
    Invoke-CheckedCommand $PythonExe @('-m', 'pytest', '-v')
    Set-Location $FrontendPath
    Write-Host '3. Lint y pruebas frontend' -ForegroundColor Cyan
    Invoke-CheckedCommand 'npm.cmd' @('run', 'lint')
    Invoke-CheckedCommand 'npm.cmd' @('run', 'test')
    Write-Host '4. Tipos y compilación' -ForegroundColor Cyan
    Invoke-CheckedCommand 'npm.cmd' @('run', 'build')
    if ($E2E) {
        $env:PLAYWRIGHT_BROWSERS_PATH = Get-ProjectBrowserPath
        Write-Host '5. Navegador y servidores temporales' -ForegroundColor Cyan
        Invoke-CheckedCommand 'npm.cmd' @('run', 'test:e2e')
    }
    Write-Host '[OK] Todas las verificaciones solicitadas pasaron.' -ForegroundColor Green
} finally {
    $env:TEMP = $PreviousTemp
    $env:TMP = $PreviousTmp
    $env:PLAYWRIGHT_BROWSERS_PATH = $PreviousBrowserPath
    Set-Location $PreviousLocation
}
