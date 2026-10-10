# Genera casos sintéticos. Los tiempos se registran desde el módulo Tesis.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-BackendEnvironment
$PreviousLocation = Get-Location
try {
    Set-Location $BackendPath
    Invoke-CheckedCommand $PythonExe @('-c', @'
from app.db.session import SessionLocal
from app.models.user import User
from app.services import experiment_service

with SessionLocal() as db:
    admin = db.query(User).filter(User.role == 'ADMINISTRADOR').first()
    if admin is None:
        raise SystemExit('No hay administrador. Ejecute scripts/seed.ps1 primero.')
    distribution = experiment_service.generate_corpus(db, admin)
    total = sum(values['total'] for values in distribution.values())
    anomalous = sum(values['anomalous'] for values in distribution.values())
    print(f'Corpus generado: {total} casos ({anomalous} con anomalias)')
    for case_type, counts in distribution.items():
        print('%s: %d casos (%d integros, %d anomalos)' % (case_type, counts['total'], counts['clean'], counts['anomalous']))
'@)
    Write-Host '[OK] Corpus listo. Registre tiempos reales en /tesis.' -ForegroundColor Green
} finally { Set-Location $PreviousLocation }
