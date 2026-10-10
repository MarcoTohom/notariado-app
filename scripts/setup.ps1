param(
    [string]$PythonExecutable,
    [switch]$RuntimeOnly,
    [switch]$E2E
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-NodeEnvironment
$PreviousLocation = Get-Location
$PreviousTemp = $env:TEMP
$PreviousTmp = $env:TMP
$PreviousBrowserPath = $env:PLAYWRIGHT_BROWSERS_PATH

try {
    Set-Location $ProjectRoot
    $TemporaryPath = Join-Path $BackendPath '.venv\temp'
    New-Item -ItemType Directory -Force -Path $TemporaryPath | Out-Null
    $env:TEMP = $TemporaryPath
    $env:TMP = $TemporaryPath

    if (-not (Test-Path -LiteralPath $PythonExe)) {
        if ($PythonExecutable) {
            $Launcher = $PythonExecutable
            $LauncherArguments = @()
        } elseif (Get-Command py.exe -ErrorAction SilentlyContinue) {
            $Launcher = 'py.exe'
            $LauncherArguments = @('-3')
        } elseif (Get-Command python.exe -ErrorAction SilentlyContinue) {
            $Launcher = 'python.exe'
            $LauncherArguments = @()
        } else {
            throw 'Instale Python 3.12+ o indique -PythonExecutable con su ruta.'
        }
        Invoke-CheckedCommand $Launcher ($LauncherArguments + @('-c', 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)'))
        Invoke-CheckedCommand $Launcher ($LauncherArguments + @('-m', 'venv', (Join-Path $BackendPath '.venv')))
    }
    Invoke-CheckedCommand $PythonExe @('-c', 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)')
    $Requirements = 'requirements-dev-lock.txt'
    if ($RuntimeOnly) { $Requirements = 'requirements-lock.txt' }
    Invoke-CheckedCommand $PythonExe @('-m', 'pip', 'install', '--disable-pip-version-check', '--cache-dir', (Join-Path $BackendPath '.venv\cache\pip'), '-r', (Join-Path $BackendPath $Requirements))
    Invoke-CheckedCommand $PythonExe @('-m', 'pip', 'check')

    Set-Location $FrontendPath
    Invoke-CheckedCommand 'npm.cmd' @('ci', '--cache', (Join-Path $BackendPath '.venv\cache\npm'), '--no-audit', '--no-fund')
    if ($E2E) {
        $env:PLAYWRIGHT_BROWSERS_PATH = Get-ProjectBrowserPath
        Invoke-CheckedCommand (Join-Path $FrontendPath 'node_modules\.bin\playwright.cmd') @('install', 'chromium')
    }

    $EnvironmentPath = Join-Path $ProjectRoot '.env'
    if (-not (Test-Path -LiteralPath $EnvironmentPath)) {
        $RandomBytes = New-Object byte[] 32
        $Generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $Generator.GetBytes($RandomBytes) } finally { $Generator.Dispose() }
        $LocalKey = [Convert]::ToBase64String($RandomBytes)
        $Example = [System.IO.File]::ReadAllText((Join-Path $ProjectRoot '.env.example'))
        $Content = $Example.Replace('SECRET_KEY=GENERATE_LOCAL_KEY', "SECRET_KEY=$LocalKey")
        $FileStream = [System.IO.File]::Open($EnvironmentPath, [System.IO.FileMode]::CreateNew)
        try {
            $Bytes = (New-Object System.Text.UTF8Encoding($false)).GetBytes($Content)
            $FileStream.Write($Bytes, 0, $Bytes.Length)
        } finally { $FileStream.Dispose() }
        Write-Host '[OK] .env creado con una clave local. No se imprimen sus valores.'
    } else {
        Write-Host '[OK] .env existente conservado.'
    }
    Write-Host '[OK] Dependencias preparadas. dev.ps1 aplica las migraciones; seed.ps1 agrega usuarios demo.'
} finally {
    $env:TEMP = $PreviousTemp
    $env:TMP = $PreviousTmp
    $env:PLAYWRIGHT_BROWSERS_PATH = $PreviousBrowserPath
    Set-Location $PreviousLocation
}
