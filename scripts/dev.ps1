param(
    [ValidateRange(0, 65535)][int]$BackendPort = 0,
    [ValidateRange(1, 65535)][int]$FrontendPort = 5173,
    [switch]$NoReload,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment
Assert-FrontendEnvironment
$PreviousLocation = Get-Location
$PreviousProxy = $env:VITE_API_PROXY
$BackendProcess = $null
$FrontendProcess = $null

function Wait-LocalService {
    param([string]$Url, [System.Diagnostics.Process]$Process)
    $Deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $Deadline) {
        if ($Process.HasExited) { throw 'El servidor terminó antes de estar disponible.' }
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($Response.StatusCode -eq 200) { return }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }
    throw "El servicio no estuvo disponible a tiempo: $Url"
}

try {
    Set-Location $BackendPath
    $ServerSettings = (Invoke-CheckedCommand $PythonExe @('-c', 'import json; from app.core.config import settings; print(json.dumps(dict(host=settings.HOST, port=settings.PORT, api=settings.API_V1_STR)))') | Out-String) | ConvertFrom-Json
    if ($BackendPort -eq 0) { $BackendPort = $ServerSettings.port }
    $ListenHost = $ServerSettings.host
    $ConnectHost = $ListenHost
    if ($ListenHost -eq '0.0.0.0') { $ConnectHost = '127.0.0.1' }
    $BackendUrl = "http://${ConnectHost}:$BackendPort"
    Invoke-CheckedCommand $PythonExe @('-m', 'alembic', 'upgrade', 'head')
    $BackendArguments = @('-m', 'uvicorn', 'app.main:app', '--host', $ListenHost, '--port', $BackendPort)
    if (-not $NoReload -and -not $Check) { $BackendArguments += '--reload' }
    $BackendProcess = Start-Process -FilePath $PythonExe -ArgumentList $BackendArguments -WorkingDirectory $BackendPath -WindowStyle Hidden -PassThru
    Wait-LocalService "$BackendUrl$($ServerSettings.api)/health" $BackendProcess
    $env:VITE_API_PROXY = $BackendUrl
    Write-Host "Backend disponible: $BackendUrl" -ForegroundColor Green
    Set-Location $FrontendPath
    $FrontendArguments = @('run', 'dev', '--', '--host', '127.0.0.1', '--port', $FrontendPort, '--strictPort')
    if ($Check) {
        $FrontendProcess = Start-Process -FilePath (Get-Command npm.cmd).Source -ArgumentList $FrontendArguments -WorkingDirectory $FrontendPath -WindowStyle Hidden -PassThru
        Wait-LocalService "http://127.0.0.1:$FrontendPort" $FrontendProcess
        $ProxyResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort$($ServerSettings.api)/health" -UseBasicParsing -TimeoutSec 5
        if ($ProxyResponse.StatusCode -ne 200) { throw 'El proxy frontend no pudo consultar la API.' }
        Write-Host '[OK] Backend, frontend y proxy disponibles. Cerrando la comprobación.' -ForegroundColor Green
    } else {
        Write-Host "Frontend: http://127.0.0.1:$FrontendPort. Ctrl+C detiene los servicios."
        Invoke-CheckedCommand 'npm.cmd' $FrontendArguments
    }
} finally {
    Stop-ProjectProcess $FrontendProcess
    Stop-ProjectProcess $BackendProcess
    $env:VITE_API_PROXY = $PreviousProxy
    Set-Location $PreviousLocation
}
