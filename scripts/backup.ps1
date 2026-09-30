$RootPath = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $RootPath "backups\backup_$Timestamp"

Write-Host "Generando respaldo del sistema en $BackupDir..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$DbPath = Join-Path $RootPath "backend\app.db"
if (Test-Path $DbPath) {
    Copy-Item -Path $DbPath -Destination (Join-Path $BackupDir "app.db") -Force
    Write-Host "[OK] Base de datos SQLite respaldada." -ForegroundColor Green
} else {
    Write-Host "[!] Base de datos app.db no encontrada, omitiendo." -ForegroundColor Yellow
}

$UploadsPath = Join-Path $RootPath "backend\uploads"
if (Test-Path $UploadsPath) {
    Copy-Item -Path $UploadsPath -Destination (Join-Path $BackupDir "uploads") -Recurse -Force
    Write-Host "[OK] Archivos y plantillas respaldados." -ForegroundColor Green
}

Write-Host "Respaldo completado exitosamente en $BackupDir" -ForegroundColor Green