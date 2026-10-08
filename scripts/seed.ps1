$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment
$PreviousLocation = Get-Location
try {
    Set-Location $BackendPath
    Invoke-CheckedCommand $PythonExe @('-m', 'alembic', 'upgrade', 'head')
    Invoke-CheckedCommand $PythonExe @('-m', 'app.utils.seed_users')
    Write-Host '[OK] Usuarios demo sembrados. El sembrador restablece sus perfiles y contraseñas demo.' -ForegroundColor Green
} finally { Set-Location $PreviousLocation }
