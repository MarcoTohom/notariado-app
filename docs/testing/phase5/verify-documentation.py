import ast
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[3]
DOCS = [ROOT / "README.md", *sorted((ROOT / "docs").rglob("*.md"))]


def unfenced(body):
    fence = None
    output = []
    for line in body.splitlines():
        match = re.match(r"^\s*(`{3,}|~{3,})", line)
        if match and fence is None:
            fence = match.group(1)
        elif match and fence and match.group(1)[0] == fence[0]:
            fence = None
        elif fence is None:
            output.append(line)
    return "\n".join(output)


def anchors(body):
    result = set()
    seen = {}
    for heading in re.findall(r"^#{1,6}\s+(.+)$", unfenced(body), re.MULTILINE):
        heading = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", heading)
        slug = "".join(
            char for char in heading.lower()
            if char in " -_" or unicodedata.category(char)[0] in "LN"
        ).replace(" ", "-")
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        result.add(slug if not count else f"{slug}-{count}")
    return result


errors = []
link_count = 0
external_links = 0
for source in DOCS:
    body = source.read_text(encoding="utf-8-sig")
    if "file://" in body:
        errors.append(f"External filesystem link: {source.relative_to(ROOT)}")
    for target in re.findall(r"!?\[[^]\n]+\]\(([^)\n]+)\)", unfenced(body)):
        target = target.strip().strip("<>")
        if urlsplit(target).scheme:
            external_links += 1
            continue
        link_count += 1
        filename, _, fragment = target.partition("#")
        destination = (source.parent / unquote(filename)).resolve() if filename else source
        if not destination.exists():
            errors.append(f"Missing target: {source.relative_to(ROOT)} -> {target}")
        elif fragment and destination.suffix.lower() == ".md":
            if unquote(fragment) not in anchors(destination.read_text(encoding="utf-8-sig")):
                errors.append(f"Missing anchor: {source.relative_to(ROOT)} -> {target}")

baseline = ROOT / "docs/testing/baseline/2026-10-08"
api = json.loads((baseline / "openapi.json").read_text(encoding="utf-8"))
module_body = (ROOT / "docs/modules.md").read_text(encoding="utf-8-sig")
operations = re.findall(
    r"^\|\s*(GET|POST|PUT|DELETE|PATCH)\s*\|\s*`([^`]+)`", module_body, re.MULTILINE
)
for method, path in operations:
    if method.lower() not in api["paths"].get(path, {}):
        errors.append(f"Undocumented API operation: {method} {path}")

frontend = (ROOT / "frontend/src/app/AppRoutes.tsx").read_text(encoding="utf-8-sig")
routes = set(re.findall(r'<Route\s+path="([^"]+)"', frontend)) - {"*"}
mapped_routes = set(re.findall(r"`(/[a-z]*)`", module_body)) & routes
if mapped_routes != routes:
    errors.append(f"Missing frontend routes: {sorted(routes - mapped_routes)}")

schema = json.loads((baseline / "database-schema.json").read_text(encoding="utf-8"))
model_tables = set()
for path in (ROOT / "backend/app/models").glob("*.py"):
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8-sig"))):
        if isinstance(node, ast.Assign):
            if any(isinstance(target, ast.Name) and target.id == "__tablename__" for target in node.targets):
                model_tables.add(ast.literal_eval(node.value))
documented_tables = set(re.findall(r"`([a-z_]+)`", (ROOT / "docs/database.md").read_text(encoding="utf-8-sig"))) & set(schema["tables"])
if model_tables | {"alembic_version"} != set(schema["tables"]):
    errors.append("Model tables differ from schema reference")
if documented_tables != set(schema["tables"]):
    errors.append(f"Missing table documentation: {sorted(set(schema['tables']) - documented_tables)}")

commands = ["setup", "test", "seed", "dev", "backup", "experiment"]
for name in commands:
    if not (ROOT / f"scripts/{name}.ps1").is_file():
        errors.append(f"Missing operational script: {name}")


def git(*args):
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return result.stdout.splitlines()


changed = git("diff", "--name-only") + git("ls-files", "--others", "--exclude-standard")
non_documentation = [
    path for path in changed
    if path != "README.md"
    and not path.startswith(("backend/app/", "backend/tests/"))
    and not (path.startswith("docs/") and Path(path).suffix in {".md", ".json", ".py"})
    and path not in {
        "docs/testing/phase5/verify-structure.cjs",
        "docs/testing/phase5/verify-documentation.py",
    }
]
if non_documentation:
    errors.append(f"Out-of-scope changes: {non_documentation}")
git("diff", "--check")
result = {
    "date": "2026-10-08",
    "phase": 5,
    "reference_commit": git("rev-parse", "--short", "HEAD")[0],
    "markdown_files": len(DOCS),
    "internal_links_checked": link_count,
    "external_links_not_fetched": external_links,
    "documented_api_operations_checked": len(operations),
    "frontend_routes_checked": len(routes),
    "database_tables_checked": len(schema["tables"]),
    "operational_scripts_checked": len(commands),
    "out_of_scope_changes": non_documentation,
    "diff_check": "passed",
    "errors": errors,
    "status": "passed" if not errors else "failed",
    "functional_suite": "backend checks recorded in phase5/verification-results.json",
}
print(json.dumps(result, ensure_ascii=False, indent=2))
if errors:
    raise SystemExit(1)
destination = ROOT / "docs/testing/phase5/documentation-verification.json"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
