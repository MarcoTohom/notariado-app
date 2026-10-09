$ErrorActionPreference = 'Stop'
$TaskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
$FixtureRoot = Join-Path $TaskRoot ('backend\.venv\temp\phase7 operations ' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $FixtureRoot | Out-Null
$PreviousLocation = Get-Location
$PreviousDatabase = $env:DATABASE_URL
$PreviousUploads = $env:UPLOAD_DIR
$PreviousGenerated = $env:GENERATED_DIR
$PreviousEnvironment = $env:ENVIRONMENT
$PreviousTemp = $env:TEMP
$PreviousTmp = $env:TMP
$PythonExe = Join-Path $TaskRoot 'backend\.venv\Scripts\python.exe'
try {
    $env:TEMP = Join-Path $TaskRoot 'backend\.venv\temp'
    $env:TMP = $env:TEMP
    $env:DATABASE_URL = 'sqlite:///' + (Join-Path $FixtureRoot 'custom.sqlite').Replace('\', '/')
    $env:UPLOAD_DIR = Join-Path $FixtureRoot 'uploads'
    $env:GENERATED_DIR = Join-Path $FixtureRoot 'generated'
    $env:ENVIRONMENT = 'testing'
    Set-Location (Join-Path $TaskRoot 'docs')
    $CallerDirectory = (Get-Location).Path
    & (Join-Path $TaskRoot 'scripts\seed.ps1')
    & (Join-Path $TaskRoot 'scripts\dev.ps1') -Check -BackendPort 8012 -FrontendPort 5175
    & (Join-Path $TaskRoot 'scripts\experiment.ps1')
    & $PythonExe (Join-Path $PSScriptRoot 'verify-experiment.py')
    if ($LASTEXITCODE -ne 0) { throw 'Fallo al verificar el corpus y las exportaciones.' }
    & $PythonExe -c "import os; from pathlib import Path; from docx import Document; document=Document(); document.add_paragraph('Contenido sintetico para comprobar el respaldo'); document.save(Path(os.environ['UPLOAD_DIR'])/'template-v1.docx'); document.save(Path(os.environ['GENERATED_DIR'])/'draft-v1.docx')"
    if ($LASTEXITCODE -ne 0) { throw 'Fallo al preparar documentos sinteticos.' }
    $Files = @((Join-Path $TaskRoot '.env'), (Join-Path $TaskRoot 'frontend\package-lock.json'), (Join-Path $FixtureRoot 'custom.sqlite'), (Join-Path $FixtureRoot 'uploads\template-v1.docx'), (Join-Path $FixtureRoot 'generated\draft-v1.docx'))
    $Hashes = @{}
    foreach ($FilePath in $Files) { $Hashes[$FilePath] = (Get-FileHash -LiteralPath $FilePath).Hash }
    & (Join-Path $TaskRoot 'scripts\setup.ps1') -E2E
    foreach ($FilePath in $Files) {
        if ((Get-FileHash -LiteralPath $FilePath).Hash -ne $Hashes[$FilePath]) { throw 'La preparacion altero configuracion, datos o documentos.' }
    }
    $Destination = Join-Path $FixtureRoot 'backups'
    & (Join-Path $TaskRoot 'scripts\backup.ps1') -Destination $Destination
    & (Join-Path $TaskRoot 'scripts\backup.ps1') -Destination $Destination
    $Copies = @(Get-ChildItem -LiteralPath $Destination -Directory)
    if ($Copies.Count -ne 2) { throw 'No se conservaron ambas copias.' }
    foreach ($Copy in $Copies) {
        $Manifest = Get-Content -LiteralPath (Join-Path $Copy.FullName 'manifest.json') -Raw | ConvertFrom-Json
        if ($Manifest.status -ne 'complete') { throw 'Respaldo incompleto.' }
        foreach ($RelativePath in @('uploads\template-v1.docx', 'generated\draft-v1.docx')) {
            if ((Get-FileHash -LiteralPath (Join-Path $FixtureRoot $RelativePath)).Hash -ne (Get-FileHash -LiteralPath (Join-Path $Copy.FullName $RelativePath)).Hash) { throw 'Documento alterado en respaldo.' }
        }
        & $PythonExe -c "import sqlite3,sys; connection=sqlite3.connect(sys.argv[1]); assert connection.execute('PRAGMA integrity_check').fetchone()[0]=='ok'; assert connection.execute('SELECT COUNT(*) FROM test_cases').fetchone()[0]==100; assert connection.execute('SELECT COUNT(*) FROM test_executions').fetchone()[0]==0; connection.close()" (Join-Path $Copy.FullName 'app.db')
        if ($LASTEXITCODE -ne 0) { throw 'Fallo en la integridad de SQLite respaldada.' }
    }
    if ((Get-Location).Path -ne $CallerDirectory) { throw 'Los scripts no restauraron la carpeta.' }
    $Result = @{ powershell = $PSVersionTable.PSVersion.ToString(); seed = 'passed'; startup_and_proxy = 'passed'; repeat_setup = 'passed'; configuration_database_documents_preserved = $true; corpus_cases = 100; backups = 2; document_hashes = 'equal'; backup_integrity = 'ok'; caller_location_restored = $true; status = 'passed' }
    $Result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'operations-verification.json') -Encoding UTF8
    Write-Output '[OK] Preparacion, arranque, corpus, exportaciones y respaldos verificados en almacenamiento aislado.'
} finally {
    $env:DATABASE_URL = $PreviousDatabase
    $env:UPLOAD_DIR = $PreviousUploads
    $env:GENERATED_DIR = $PreviousGenerated
    $env:ENVIRONMENT = $PreviousEnvironment
    $env:TEMP = $PreviousTemp
    $env:TMP = $PreviousTmp
    Set-Location $PreviousLocation
}
