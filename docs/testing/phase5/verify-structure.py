"""Comprueba extracciones y contratos usando exclusivamente una SQLite temporal."""

import ast
import copy
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
APP = ROOT / "backend/app"
REFERENCE = "8531a74"
BASELINE = ROOT / "docs/testing/baseline/2026-10-08"
MANIFEST = json.loads(Path(__file__).with_name("moves.json").read_text(encoding="utf-8"))


def declarations(source):
    result = {}
    for node in ast.parse(source).body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            result[node.name] = node
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    result[target.id] = node
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            result[node.target.id] = node
    return result


class PublicNames(ast.NodeTransformer):
    def visit_Name(self, node):
        node.id = MANIFEST["renames"].get(node.id, node.id)
        return node

    def visit_FunctionDef(self, node):
        node.name = MANIFEST["renames"].get(node.name, node.name)
        return self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef


def normalized(node):
    return ast.dump(PublicNames().visit(copy.deepcopy(node)), include_attributes=False)


sources = {}
for groups in MANIFEST["groups"].values():
    for source, _ in groups:
        if source not in sources:
            sources[source] = declarations(subprocess.check_output(
                ["git", "show", f"{REFERENCE}:backend/app/{source}"], cwd=ROOT,
                encoding="utf-8",
            ))

moved = set()
for destination, groups in MANIFEST["groups"].items():
    current = declarations((APP / destination).read_text(encoding="utf-8-sig"))
    for source, names in groups:
        for name in names:
            public = MANIFEST["renames"].get(name, name)
            assert normalized(sources[source][name]) == normalized(current[public]), (source, name)
            moved.add((source, name))

retained = 0
for source, previous in sources.items():
    current = declarations((APP / source).read_text(encoding="utf-8-sig"))
    for name, node in previous.items():
        if (source, name) not in moved:
            assert normalized(node) == normalized(current[name]), (source, name)
            retained += 1

# Configuración, catálogo, permisos y migraciones conservados respecto a la extracción.
protected = ["backend/app/core", "backend/app/schemas", "backend/alembic", "backend/app/rules/catalog.py"]
assert not subprocess.check_output(["git", "diff", REFERENCE, "--", *protected], cwd=ROOT)

sys.path.insert(0, str(ROOT / "backend"))
temp_root = ROOT / "backend/.venv/temp"
temp_root.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=temp_root) as directory:
    fixture = Path(directory)
    os.environ.update(DATABASE_URL=f"sqlite:///{fixture.as_posix()}/schema.sqlite",
                      UPLOAD_DIR=str(fixture / "uploads"), GENERATED_DIR=str(fixture / "generated"),
                      ENVIRONMENT="testing")
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import create_engine, inspect, text
    from app.main import app

    api = json.loads(json.dumps(app.openapi()))
    reference_api = json.loads((BASELINE / "openapi.json").read_text(encoding="utf-8"))
    if api != reference_api:
        fixture.joinpath("current-openapi.json").write_text(json.dumps(api))
        def differences(a, b, path=""):
            if isinstance(a, dict) and isinstance(b, dict):
                for key in a.keys() | b.keys():
                    yield from differences(a.get(key), b.get(key), path + "/" + key)
            elif a != b:
                yield (path, a, b)
        raise AssertionError(list(differences(api, reference_api))[:8])
    config = Config(str(ROOT / "backend/alembic.ini"))
    config.set_main_option("script_location", str(ROOT / "backend/alembic"))
    command.upgrade(config, "head")
    engine = create_engine(os.environ["DATABASE_URL"])
    inspector = inspect(engine)
    tables = {}
    for table in sorted(inspector.get_table_names()):
        columns = inspector.get_columns(table)
        for column in columns:
            column["type"] = str(column["type"])
        tables[table] = dict(columns=columns, foreign_keys=inspector.get_foreign_keys(table),
                             indexes=inspector.get_indexes(table), primary_key=inspector.get_pk_constraint(table),
                             unique_constraints=inspector.get_unique_constraints(table))
    with engine.connect() as connection:
        revision = connection.scalar(text("SELECT version_num FROM alembic_version"))
    engine.dispose()
    assert dict(alembic_revision=revision, tables=tables) == json.loads(
        (BASELINE / "database-schema.json").read_text(encoding="utf-8")), "SQLite schema changed"

result = dict(reference_commit=REFERENCE, moved_declarations=len(moved),
              retained_declarations=retained, rule_order="identical",
              openapi="identical", sqlite_schema="identical", tables=len(tables),
              migrations_permissions_catalog_schemas="unchanged", status="passed")
Path(__file__).with_name("structure-verification.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
