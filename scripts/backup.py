"""Back up configured local SQLite and document storage without replacing history."""

import argparse
import json
import shutil
import sqlite3
import sys
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from sqlalchemy.engine import make_url


def create_backup(
    database_url: str,
    uploads: Path,
    generated: Path,
    destination_root: Path,
) -> Path:
    url = make_url(database_url)
    if url.get_backend_name() != "sqlite" or not url.database:
        raise ValueError("El respaldo requiere una base SQLite local en archivo.")
    if url.database == ":memory:":
        raise ValueError("No se puede respaldar una base SQLite en memoria.")
    source = Path(url.database).resolve()
    if not source.is_file():
        raise FileNotFoundError(
            "La base configurada no existe; no se creó un respaldo."
        )

    destination_root = destination_root.resolve()
    storage = {"uploads": uploads.resolve(), "generated": generated.resolve()}
    if any(destination_root.is_relative_to(path) for path in storage.values()):
        raise ValueError("El destino del respaldo debe estar fuera del almacenamiento.")
    created_at = datetime.now(timezone.utc)
    name = f"backup_{created_at:%Y%m%d_%H%M%S_%f}_{uuid4().hex[:8]}"
    destination = destination_root / name
    destination.mkdir(parents=True, exist_ok=False)

    # SQLite's backup API includes committed WAL data and keeps the source intact.
    source_uri = f"file:{quote(source.as_posix(), safe='/:')}?mode=ro"
    with (
        closing(sqlite3.connect(source_uri, uri=True)) as source_connection,
        closing(sqlite3.connect(destination / "app.db")) as target_connection,
    ):
        source_connection.backup(target_connection)
        result = target_connection.execute("PRAGMA integrity_check").fetchone()
        if result != ("ok",):
            raise RuntimeError(
                "La copia SQLite no superó la comprobación de integridad."
            )

    included = {}
    for name, path in storage.items():
        included[name] = path.is_dir()
        if included[name]:
            shutil.copytree(path, destination / name)

    manifest = {
        "created_at": created_at.isoformat(),
        "database": "app.db",
        **included,
        "status": "complete",
    }
    (destination / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destination-root", required=True, type=Path)
    arguments = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / "backend"))
    from app.core.config import settings

    destination = create_backup(
        settings.DATABASE_URL,
        settings.UPLOAD_DIR,
        settings.GENERATED_DIR,
        arguments.destination_root,
    )
    print(f"[OK] Respaldo completo: {destination}")


if __name__ == "__main__":
    main()
