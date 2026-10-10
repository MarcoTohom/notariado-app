"""Integration tests for verified DOCX draft generation (Fase 7).

Flujo E2E principal: cliente -> expediente -> plantilla DOCX -> activación ->
valores del formulario -> generación -> verificación de placeholders ->
historial inmutable -> descarga autenticada.
"""

import io

from docx import Document as DocxDocument
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.support.auth import auth_headers as _auth
from tests.support.auth import create_user as _create_user
from tests.support.auth import login_token as _token
from tests.support.documents import docx_bytes as _docx_bytes
from tests.support.records import create_case_with_party

BASE = "/api/v1"


def _setup_full_scenario(client: TestClient, db_session: Session, suffix: str):
    """Cliente + expediente + plantilla activa + valores guardados."""
    _create_user(db_session, suffix, "ADMINISTRADOR")
    token = _token(client, f"user_{suffix}")

    case_id, _ = create_case_with_party(
        client, token, "Compraventa para generación de borrador"
    )

    # Plantilla DOCX con variables anidadas, condicional y bucle.
    content = _docx_bytes(
        [
            "ESCRITURA No. {{ numero_escritura }}",
            "COMPRADOR: {{ comprador.nombre }} DPI {{ comprador.dpi }}",
            "{% if comprador.nit %}NIT: {{ comprador.nit }}{% endif %}",
            "FINCA: {{ finca_registral }} FOLIO: {{ folio_registral }} LIBRO: {{ libro_registral }}",
            "{% for t in testigos %}TESTIGO: {{ t.nombre }} {% endfor %}",
        ]
    )
    resp = client.post(
        f"{BASE}/templates",
        data={"name": f"Compraventa Gen {suffix}", "case_type": "COMPRAVENTA"},
        files={"file": ("gen.docx", content, "application/octet-stream")},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    detail = resp.json()
    template_id = detail["id"]
    version_id = detail["versions"][0]["id"]

    resp = client.post(
        f"{BASE}/templates/{template_id}/versions/{version_id}/activate",
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text

    values = {
        "numero_escritura": "151",
        "comprador_nombre": "Carlos Mendez Ruiz",
        "comprador_dpi": "1234567890101",
        "comprador_nit": "1234567-8",
        "finca_registral": "12345",
        "folio_registral": "678",
        "libro_registral": "12",
        "testigos": [{"nombre": "Testigo Sintético Uno"}],
    }
    resp = client.put(
        f"{BASE}/fields/cases/{case_id}/versions/{version_id}",
        json={"revision": 0, "values": values},
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    return token, case_id, version_id


# ---------------------------------------------------------------------------
# Generación verificada (US-07.1 y US-07.2)
# ---------------------------------------------------------------------------


def test_generate_draft_verified_and_downloadable(
    client: TestClient, db_session: Session
):
    token, case_id, _ = _setup_full_scenario(client, db_session, "doc1")

    resp = client.post(
        f"{BASE}/documents/generate",
        json={"case_id": case_id, "notes": "Primera versión de prueba"},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    detail = resp.json()

    assert detail["versions_count"] == 1
    version = detail["versions"][0]
    assert version["version_number"] == 1
    assert version["placeholders_free"] is True
    assert version["validation_status"] == "OK"
    assert version["residual_variables"] == []
    assert len(version["file_hash"]) == 64
    assert version["file_size"] > 0
    assert version["notes"] == "Primera versión de prueba"

    # Descarga autenticada del archivo generado.
    download = client.get(version["download_url"], headers=_auth(token))
    assert download.status_code == 200
    assert download.content[:2] == b"PK"

    # El DOCX generado no conserva placeholders y trae los datos del expediente.
    document = DocxDocument(io.BytesIO(download.content))
    text = "\n".join(p.text for p in document.paragraphs)
    assert "{{" not in text
    assert "1234567890101" in text  # DPI del comprador
    assert "TESTIGO: Testigo Sintético Uno" in text


def test_generate_with_partial_data_renders_empty_sections(
    client: TestClient, db_session: Session
):
    """Datos parciales: las secciones sin datos renderizan vacío (ChainableUndefined)."""
    token, case_id, _ = _setup_full_scenario(client, db_session, "doc_partial")

    # La plantilla referencia variables del vendedor que NO están en los datos.
    resp = client.post(
        f"{BASE}/documents/generate",
        json={"case_id": case_id},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    version = resp.json()["versions"][0]
    assert version["placeholders_free"] is True


def test_generate_blocked_by_critical_findings(client: TestClient, db_session: Session):
    """El botón Generar DOCX exige cero hallazgos CRITICAL (spec §39)."""
    token, case_id, version_id = _setup_full_scenario(client, db_session, "doc2")

    # Corromper el DPI almacenado (formato válido, distinto al del cliente).
    resp = client.get(
        f"{BASE}/fields/cases/{case_id}/versions/{version_id}",
        headers=_auth(token),
    )
    saved = resp.json()
    saved["values"]["comprador_dpi"] = "1234567890102"
    resp = client.put(
        f"{BASE}/fields/cases/{case_id}/versions/{version_id}",
        json={"revision": saved["revision"], "values": saved["values"]},
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text

    resp = client.post(
        f"{BASE}/documents/generate",
        json={"case_id": case_id},
        headers=_auth(token),
    )
    assert resp.status_code == 422
    detail = resp.json()["detail"]
    assert "CRÍTICAS" in detail["message"]
    critical_rules = {f["rule_id"] for f in detail["critical_findings"]}
    assert "RULE-004" in critical_rules


def test_generate_requires_stored_values(client: TestClient, db_session: Session):
    """Sin datos del formulario no hay contexto para renderizar."""
    _create_user(db_session, "doc3", "ADMINISTRADOR")
    token = _token(client, "user_doc3")

    resp = client.post(
        f"{BASE}/clients",
        json={"first_name": "Luis", "last_name": "Perez", "dpi": "5555555555555"},
        headers=_auth(token),
    )
    client_id = resp.json()["id"]
    resp = client.post(
        f"{BASE}/cases",
        json={
            "title": "Compraventa sin datos capturados",
            "case_type": "COMPRAVENTA",
            "parties": [{"client_id": client_id, "party_role": "COMPRADOR"}],
        },
        headers=_auth(token),
    )
    case_id = resp.json()["id"]

    # Plantilla activa pero sin valores del formulario.
    content = _docx_bytes(["COMPRADOR: {{ comprador.dpi }}"])
    resp = client.post(
        f"{BASE}/templates",
        data={"name": "Compraventa Vacía", "case_type": "COMPRAVENTA"},
        files={"file": ("vacia.docx", content, "application/octet-stream")},
        headers=_auth(token),
    )
    template_id = resp.json()["id"]
    version_id = resp.json()["versions"][0]["id"]
    client.post(
        f"{BASE}/templates/{template_id}/versions/{version_id}/activate",
        headers=_auth(token),
    )

    resp = client.post(
        f"{BASE}/documents/generate",
        json={"case_id": case_id},
        headers=_auth(token),
    )
    assert resp.status_code == 422
    assert "datos capturados" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Versionamiento inmutable e historial (US-07.3)
# ---------------------------------------------------------------------------


def test_versions_accumulate_without_overwriting(
    client: TestClient, db_session: Session
):
    token, case_id, _ = _setup_full_scenario(client, db_session, "doc4")

    for note in ("v1 inicial", "v2 corregida"):
        resp = client.post(
            f"{BASE}/documents/generate",
            json={"case_id": case_id, "notes": note},
            headers=_auth(token),
        )
        assert resp.status_code == 201, resp.text

    detail = resp.json()
    assert detail["versions_count"] == 2
    numbers = {v["version_number"] for v in detail["versions"]}
    assert numbers == {1, 2}
    notes = {v["notes"] for v in detail["versions"]}
    assert notes == {"v1 inicial", "v2 corregida"}

    # Cada versión conserva su propio archivo en disco (jamás sobrescrito).
    from app.models.document import DocumentVersion

    versions_db = (
        db_session.query(DocumentVersion).filter_by(document_id=detail["id"]).all()
    )
    paths = {v.file_path for v in versions_db}
    assert len(paths) == 2
    from pathlib import Path

    for path in paths:
        assert Path(path).is_file()

    # Listado global y por expediente.
    resp = client.get(f"{BASE}/documents?case_id={case_id}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["versions_count"] == 2


# ---------------------------------------------------------------------------
# Seguridad RBAC
# ---------------------------------------------------------------------------


def test_generate_forbidden_for_auxiliar(client: TestClient, db_session: Session):
    """AUXILIAR no tiene documents:generate en la matriz RBAC."""
    _create_user(db_session, "doc5", "AUXILIAR")
    token = _token(client, "user_doc5")
    resp = client.post(
        f"{BASE}/documents/generate",
        json={"case_id": "x"},
        headers=_auth(token),
    )
    assert resp.status_code == 403


def test_download_requires_auth(client: TestClient):
    resp = client.get(f"{BASE}/documents/versions/abc/download")
    assert resp.status_code == 401
