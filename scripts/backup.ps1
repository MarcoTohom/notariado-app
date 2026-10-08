param([string]$Destination)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment
$PreviousLocation = Get-Location
if (-not $Destination) { $Destination = Join-Path $ProjectRoot 'backups' }
elseif (-not [System.IO.Path]::IsPathRooted($Destination)) {
    $Destination = Join-Path $ProjectRoot $Destination
}
try {
    Set-Location $BackendPath
    Invoke-CheckedCommand $PythonExe @((Join-Path $PSScriptRoot 'backup.py'), '--destination-root', $Destination)
} finally { Set-Location $PreviousLocation }
