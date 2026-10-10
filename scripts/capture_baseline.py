"""Capture structural references using an isolated database, without running tests."""

import argparse
import ast
import contextlib
import hashlib
import io
import json
import os
import platform
import subprocess
import sys
from importlib.metadata import distributions
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]


def source_inventory():
    roots = (
        "backend/app",
        "backend/tests",
        "backend/alembic",
        "frontend/src",
        "frontend/e2e",
    )
    files = sorted(
        path
        for directory in roots
        for path in (ROOT / directory).rglob("*")
        if path.is_file() and path.suffix in {".py", ".ts", ".tsx"}
    )
    inventory = []
    dependencies = {}
    for path in files:
        name = path.relative_to(ROOT).as_posix()
        content = path.read_bytes()
        inventory.append({"path": name, "sha256": hashlib.sha256(content).hexdigest()})
        if name.startswith("backend/app/") and path.suffix == ".py":
            tree = ast.parse(content.decode("utf-8-sig"))
            dependencies[name] = sorted(
                {
                    f"{node.module}:{alias.name}"
                    for node in ast.walk(tree)
                    if isinstance(node, ast.ImportFrom)
                    and node.module
                    and node.module.startswith("app.")
                    for alias in node.names
                }
            )
    return {"files": inventory, "backend_imports": dependencies}


class TestInventory:
    def __init__(self):
        self.nodeids = []

    def pytest_collection_finish(self, session):
        self.nodeids = sorted(item.nodeid for item in session.items)


def capture():
    # These imports use the project's virtual environment, not global packages.
    import pytest
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import create_engine, inspect, text

    temporary_root = ROOT / "backend/.venv/temp"
    temporary_root.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(
        prefix="notariado-baseline-", dir=temporary_root
    ) as directory:
        isolated = Path(directory)
        database_url = f"sqlite:///{(isolated / 'reference.sqlite').as_posix()}"
        os.environ.update(
            DATABASE_URL=database_url,
            UPLOAD_DIR=str(isolated / "uploads"),
            GENERATED_DIR=str(isolated / "generated"),
            ENVIRONMENT="testing",
        )
        sys.path.insert(0, str(ROOT / "backend"))
        from app.core.roles import ROLE_PERMISSIONS
        from app.main import app
        from app.rules.catalog import RULES_CATALOG

        configuration = Config(str(ROOT / "backend/alembic.ini"))
        command.upgrade(configuration, "head")
        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)
            tables = {}
            for name in sorted(inspector.get_table_names()):
                columns = inspector.get_columns(name)
                tables[name] = {
                    "columns": [
                        {**column, "type": str(column["type"])} for column in columns
                    ],
                    "foreign_keys": inspector.get_foreign_keys(name),
                    "unique_constraints": inspector.get_unique_constraints(name),
                    "indexes": inspector.get_indexes(name),
                    "primary_key": inspector.get_pk_constraint(name),
                }
            with engine.connect() as connection:
                revision = connection.execute(
                    text("SELECT version_num FROM alembic_version")
                ).scalar_one()
        finally:
            engine.dispose()

        collector = TestInventory()
        previous_directory = Path.cwd()
        try:
            os.chdir(ROOT / "backend")
            with (
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(io.StringIO()),
            ):
                result = pytest.main(
                    ["--collect-only", "-q", "-p", "no:cacheprovider", "tests"],
                    plugins=[collector],
                )
        finally:
            os.chdir(previous_directory)
        if result != pytest.ExitCode.OK:
            raise RuntimeError(
                f"La recolección de escenarios falló (código {result}); ejecute pytest --collect-only para diagnosticar."
            )

        packages = sorted(
            f"{distribution.metadata['Name']}=={distribution.version}"
            for distribution in distributions()
        )
        head = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        openapi = app.openapi()
        operations = sum(
            method in {"get", "post", "put", "patch", "delete", "options", "head"}
            for path in openapi["paths"].values()
            for method in path
        )
        snapshot = {
            "environment.json": {
                "git_head": head,
                "python": platform.python_version(),
                "platform": platform.platform(),
                "packages": packages,
                "manifest_sha256": {
                    name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
                    for name in (
                        "backend/requirements.txt",
                        "frontend/package.json",
                        "frontend/package-lock.json",
                    )
                },
            },
            "openapi.json": openapi,
            "database-schema.json": {"alembic_revision": revision, "tables": tables},
            "permissions.json": {
                role.value: sorted(permissions)
                for role, permissions in ROLE_PERMISSIONS.items()
            },
            "rule-catalog.json": RULES_CATALOG,
            "backend-tests.json": collector.nodeids,
            "source-inventory.json": source_inventory(),
        }
        summary = {
            "operations": operations,
            "tables": len(tables),
            "backend_tests": len(collector.nodeids),
            "rules": len(RULES_CATALOG),
            "alembic_revision": revision,
        }
        return snapshot, summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", required=True)
    arguments = parser.parse_args()
    output = (ROOT / arguments.output_directory).resolve()
    output.relative_to(ROOT)
    if output.exists() and any(output.iterdir()):
        parser.error(
            "La carpeta de referencia ya contiene archivos; elija una nueva para conservar el historial."
        )
    snapshot, summary = capture()
    output.mkdir(parents=True, exist_ok=True)
    for name, data in snapshot.items():
        (output / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
