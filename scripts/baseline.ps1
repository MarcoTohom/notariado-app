param([Parameter(Mandatory = $true)][string]$OutputDirectory)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment

$PreviousLocation = Get-Location
try {
    Set-Location $ProjectRoot
    Invoke-CheckedCommand $PythonExe @((Join-Path $PSScriptRoot 'capture_baseline.py'), '--output-directory', $OutputDirectory)
} finally {
    Set-Location $PreviousLocation
}
