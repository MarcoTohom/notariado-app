"""Comprueba que la extracción no cambia los escenarios ni sus aserciones."""

import ast
import contextlib
import io
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
REFERENCE = "05348e4"
tests_checked = 0
for path in (ROOT / "backend/tests").rglob("test_*.py"):
    relative = path.relative_to(ROOT).as_posix()
    old = subprocess.check_output(["git", "show", f"{REFERENCE}:{relative}"], cwd=ROOT, encoding="utf-8")
    def test_functions(source):
        return {node.name: ast.dump(node, include_attributes=False)
                for node in ast.parse(source).body
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_")}
    previous = test_functions(old)
    assert previous == test_functions(path.read_text(encoding="utf-8-sig")), relative
    tests_checked += len(previous)

assert not subprocess.check_output(["git", "diff", REFERENCE, "--", "backend/app", "frontend/src"], cwd=ROOT)
sys.path.insert(0, str(ROOT / "backend"))
import pytest

class Inventory:
    def pytest_collection_finish(self, session):
        self.nodeids = sorted(item.nodeid for item in session.items)

inventory = Inventory()
os.chdir(ROOT / "backend")
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    status = pytest.main(["--collect-only", "-q", "-p", "no:cacheprovider", "tests"], plugins=[inventory])
assert status == pytest.ExitCode.OK
baseline = ROOT / "docs/testing/baseline/2026-10-08"
initial = json.loads((baseline / "backend-tests.json").read_text(encoding="utf-8"))
additions = json.loads((ROOT / "docs/testing/phase1/verification-results.json").read_text(encoding="utf-8"))["contracts"]["additional_backup_tests"]
assert sorted(initial + additions) == inventory.nodeids
result = dict(reference_commit=REFERENCE, test_functions_unchanged=tests_checked,
              backend_scenarios=len(inventory.nodeids), backend_scenario_ids="identical",
              production_and_frontend="unchanged", database="isolated in-memory with savepoints",
              storage="pytest temporary directories", status="passed")
Path(__file__).with_name("test-inventory.json").write_text(json.dumps(inventory.nodeids, indent=2)+"\n", encoding="utf-8")
Path(__file__).with_name("structure-verification.json").write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
print(json.dumps(result, indent=2))
