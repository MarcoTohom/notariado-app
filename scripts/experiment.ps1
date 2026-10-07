# ======================================================================
# experiment.ps1 - Modulo de Medicion Experimental de Tesis (Fase 11)
# ======================================================================
# Genera el corpus de 100 casos sinteticos directamente contra la base
# de datos local (sin requerir el servidor), usando el servicio oficial
# del experimento. Para registrar corridas y ver el dashboard, use el
# Modulo Tesis en la interfaz web (./scripts/dev.ps1 -> /tesis).
# ======================================================================

$RootPath = Split-Path -Parent $PSScriptRoot
$BackendPath = Join-Path $RootPath "backend"

Set-Location $BackendPath

Write-Host "=== Generando corpus experimental (100 casos sinteticos) ===" -ForegroundColor Cyan

& ".\.venv\Scripts\python.exe" -c @"
from app.db.session import SessionLocal
from app.models.user import User
from app.services import experiment_service

db = SessionLocal()
admin = db.query(User).filter(User.role == 'ADMINISTRADOR').first()
if admin is None:
    print('[ERROR] No hay usuario ADMINISTRADOR. Ejecute primero: .\\scripts\\seed.ps1')
    raise SystemExit(1)

distribution = experiment_service.generate_corpus(db, admin)
total = sum(v['total'] for v in distribution.values())
anomalous = sum(v['anomalous'] for v in distribution.values())
print(f'Corpus generado: {total} casos ({anomalous} con anomalias)')
for case_type, counts in distribution.items():
    print('  %s: %d casos (%d integros, %d anomalos)' % (case_type, counts['total'], counts['clean'], counts['anomalous']))
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en la generacion del corpus." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[OK] Corpus experimental listo. Registre corridas en /tesis (Modulo Tesis)." -ForegroundColor Green
Set-Location $RootPath
