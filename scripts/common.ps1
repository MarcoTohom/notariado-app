# Utilidades compartidas por los scripts Windows del proyecto.
$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$BackendPath = Join-Path $ProjectRoot 'backend'
$FrontendPath = Join-Path $ProjectRoot 'frontend'
$PythonExe = Join-Path $BackendPath '.venv\Scripts\python.exe'

function Invoke-CheckedCommand {
    param([string]$FilePath, [string[]]$Arguments = @())
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "El comando $FilePath terminó con código $LASTEXITCODE."
    }
}

function Assert-BackendEnvironment {
    if (-not (Test-Path -LiteralPath $PythonExe)) {
        throw 'Falta backend/.venv. Ejecute scripts/setup.ps1.'
    }
}

function Assert-NodeEnvironment {
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue) -or
        -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'Instale Node.js 22.13 o superior con npm disponible en PATH.'
    }
    $NodeVersion = (Invoke-CheckedCommand 'node.exe' @('--version')).Trim().TrimStart('v')
    if ([version]$NodeVersion -lt [version]'22.13.0') {
        throw 'Se requiere Node.js 22.13 o superior.'
    }
}

function Assert-FrontendEnvironment {
    Assert-NodeEnvironment
    if (-not (Test-Path -LiteralPath (Join-Path $FrontendPath 'node_modules\.bin\vite.cmd'))) {
        throw 'Faltan dependencias frontend. Ejecute scripts/setup.ps1.'
    }
}

function Get-ProjectBrowserPath {
    if ($env:PLAYWRIGHT_BROWSERS_PATH) { return $env:PLAYWRIGHT_BROWSERS_PATH }
    return (Join-Path $FrontendPath '.cache\ms-playwright')
}

function Stop-ProjectProcess {
    param([System.Diagnostics.Process]$Process)
    if ($Process -and -not $Process.HasExited) {
        # Incluye los hijos de uvicorn --reload y npm, usando solo el PID propio.
        & taskkill.exe /PID $Process.Id /T /F 2>&1 | Out-Null
    }
}
