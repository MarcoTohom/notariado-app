"""Integration tests for the DOCX template repository (Fase 5).

Flujo: carga -> extracción de variables -> versionamiento inmutable ->
activación única -> render de prueba verificado -> baja lógica.
"""

import io

from docx import Document
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_user(db_session: Session, suffix: str, role: str) -> User:
    user = User(
        username=f"user_{suffix}",
        email=f"user_{suffix}@bufetenotarial.demo",
        full_name=f"Usuario {suffix}",
        password_hash=get_password_hash("Admin1234!"),
        role=role,
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()
    return user


def _get_token(client: TestClient, username: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "Admin1234!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _docx_bytes(paragraphs: list[str], table_text: str | None = None) -> bytes:
    document = Document()
    for text in paragraphs:
        document.add_paragraph(text)
    if table_text is not None:
        table = document.add_table(rows=1, cols=1)
        table.cell(0, 0).text = table_text
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def _upload(
    client: TestClient, token: str, content: bytes, name: str = "Compraventa Base"
) -> dict:
    resp = client.post(
        "/api/v1/templates",
        data={
            "name": name,
            "case_type": "COMPRAVENTA",
            "description": "Plantilla de prueba sintética",
        },
        files={
            "file": (
                "compraventa_v1.docx",
                content,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Carga e ingesta (US-05.1)
# ---------------------------------------------------------------------------


def test_create_template_extracts_variables_and_suggested_types(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "tpl1", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl1")
    content = _docx_bytes(
        [
            "ESCRITURA No. {{ numero_escritura }} de fecha {{ fecha_escritura }}.",
            "COMPARECE: {{ comprador.nombre_completo }}, DPI {{ comprador.dpi }}, NIT {{ comprador.nit }}.",
            "PRECIO: {{ precio_inmueble }}.",
        ],
        table_text="Finca: {{ finca_registral }}",
    )
    detail = _upload(client, token, content)

    assert detail["name"] == "Compraventa Base"
    assert detail["case_type"] == "COMPRAVENTA"
    assert detail["versions_count"] == 1
    assert detail["active_version_id"] is None

    version = detail["versions"][0]
    assert version["version_number"] == 1
    assert version["status"] == "BORRADOR"
    assert version["has_file"] is True
    assert version["original_filename"] == "compraventa_v1.docx"
    assert len(version["file_hash"]) == 64
    assert version["file_size"] > 0

    detected = {field["docx_variable"]: field for field in version["fields"]}
    assert detected["comprador.dpi"]["field_type"] == "dpi"
    assert detected["comprador.nit"]["field_type"] == "nit"
    assert detected["precio_inmueble"]["field_type"] == "currency"
    assert detected["fecha_escritura"]["field_type"] == "date"
    assert detected["finca_registral"]["auto_detected"] is True


def test_loop_collection_registers_list_field_with_subfields(
    client: TestClient, db_session: Session
):
    """Los bucles {% for %} generan un campo lista con subcampos válidos
    para el motor de formularios (options_json.fields no vacío)."""
    _create_user(db_session, "tpl_loop", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl_loop")
    content = _docx_bytes(
        [
            "{% for comp in compradores %}{{ comp.nombre }} DPI {{ comp.dpi }}{% endfor %}"
        ]
    )
    detail = _upload(client, token, content)
    version = detail["versions"][0]

    list_field = next(
        f for f in version["fields"] if f["docx_variable"] == "compradores"
    )
    assert list_field["field_type"] == "list"

    # Compatibilidad con el motor de formularios (Fase 4): la lista debe
    # validar como FieldDefinition, lo que exige subcampos definidos.
    from app.schemas.dynamic_field import FieldDefinition

    parsed = FieldDefinition.model_validate(
        {
            "key": list_field["key"],
            "label": list_field["label"],
            "field_type": list_field["field_type"],
            "options_json": _read_options(db_session, list_field["id"]),
        }
    )
    sub_keys = [sub.key for sub in parsed.options_json.fields]
    assert "nombre" in sub_keys
    assert "dpi" in sub_keys


def _read_options(db_session: Session, field_id: str) -> dict:
    from app.models.dynamic_field import TemplateField

    return db_session.get(TemplateField, field_id).options_json


def test_create_template_rejects_non_docx(client: TestClient, db_session: Session):
    _create_user(db_session, "tpl2", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl2")
    resp = client.post(
        "/api/v1/templates",
        data={"name": "Archivo Invalido", "case_type": "COMPRAVENTA"},
        files={"file": ("notas.txt", b"texto plano", "text/plain")},
        headers=_auth(token),
    )
    assert resp.status_code == 422


def test_create_template_rejects_corrupt_docx(client: TestClient, db_session: Session):
    _create_user(db_session, "tpl3", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl3")
    resp = client.post(
        "/api/v1/templates",
        data={"name": "Docx Corrupto", "case_type": "COMPRAVENTA"},
        files={
            "file": ("falso.docx", b"esto no es un zip", "application/octet-stream")
        },
        headers=_auth(token),
    )
    assert resp.status_code == 422


def test_create_template_forbidden_for_auxiliar(
    client: TestClient, db_session: Session
):
    """AUXILIAR tiene templates:read pero no templates:create."""
    _create_user(db_session, "tpl4", "AUXILIAR")
    token = _get_token(client, "user_tpl4")
    resp = client.post(
        "/api/v1/templates",
        data={"name": "Sin Permiso", "case_type": "COMPRAVENTA"},
        files={"file": ("a.docx", _docx_bytes(["Hola"]), "application/octet-stream")},
        headers=_auth(token),
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Versionamiento inmutable y activación (US-05.3)
# ---------------------------------------------------------------------------


def _second_version(client: TestClient, token: str, template_id: str) -> dict:
    resp = client.post(
        f"/api/v1/templates/{template_id}/versions",
        data={"notes": "Segunda versión de prueba"},
        files={
            "file": (
                "compraventa_v2.docx",
                _docx_bytes(["Versión mejorada {{ numero_escritura }}"]),
                "application/octet-stream",
            )
        },
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_versions_are_immutable_and_only_one_active(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "tpl5", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl5")
    detail = _upload(client, token, _docx_bytes(["v1 {{ numero_escritura }}"]))
    template_id = detail["id"]
    v1_id = detail["versions"][0]["id"]

    detail = _second_version(client, token, template_id)
    assert detail["versions_count"] == 2
    numbers = {v["version_number"] for v in detail["versions"]}
    assert numbers == {1, 2}
    v2_id = next(v["id"] for v in detail["versions"] if v["version_number"] == 2)

    # Activar v2: v1 queda archivada, nunca sobrescrita.
    resp = client.post(
        f"/api/v1/templates/{template_id}/versions/{v2_id}/activate",
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    statuses = {v["version_number"]: v["status"] for v in resp.json()["versions"]}
    assert statuses == {1: "ARCHIVADA", 2: "ACTIVA"}
    assert resp.json()["active_version_id"] == v2_id

    # Reactivar v1: el puntero se mueve y el historial se conserva.
    resp = client.post(
        f"/api/v1/templates/{template_id}/versions/{v1_id}/activate",
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    statuses = {v["version_number"]: v["status"] for v in resp.json()["versions"]}
    assert statuses == {1: "ACTIVA", 2: "ARCHIVADA"}
    assert len(resp.json()["versions"]) == 2


def test_activate_rejects_unknown_version(client: TestClient, db_session: Session):
    _create_user(db_session, "tpl6", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl6")
    detail = _upload(client, token, _docx_bytes(["{{ x }}"]))
    resp = client.post(
        f"/api/v1/templates/{detail['id']}/versions/00000000-0000-0000-0000-000000000000/activate",
        headers=_auth(token),
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Render de prueba verificado (skill docx-template, paso 3)
# ---------------------------------------------------------------------------


def test_preview_renders_without_residual_placeholders(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "tpl7", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl7")
    content = _docx_bytes(
        [
            "ESCRITURA No. {{ numero_escritura }} de fecha {{ fecha_escritura }}.",
            "{% for comp in compradores %}COMPARECE: {{ comp.nombre }} DPI {{ comp.dpi }}. {% endfor %}",
        ]
    )
    detail = _upload(client, token, content)
    template_id = detail["id"]
    version_id = detail["versions"][0]["id"]

    resp = client.post(
        f"/api/v1/templates/{template_id}/versions/{version_id}/preview",
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["placeholders_free"] is True
    assert result["residual_variables"] == []

    download = client.get(result["download_url"], headers=_auth(token))
    assert download.status_code == 200
    assert download.content[:2] == b"PK"
    assert b"numero_escritura" not in download.content


def test_preview_reports_residual_variables(client: TestClient, db_session: Session):
    """Si docxtpl deja un {{ ... }} residual, el render se marca no conforme."""
    _create_user(db_session, "tpl8", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl8")
    # Un bucle sin cierre {% endfor %} provoca error de sintaxis al renderizar.
    content = _docx_bytes(["{% for comp in compradores %}{{ comp.nombre }}"])
    detail = _upload(client, token, content)
    version_id = detail["versions"][0]["id"]

    resp = client.post(
        f"/api/v1/templates/{detail['id']}/versions/{version_id}/preview",
        headers=_auth(token),
    )
    assert resp.status_code == 422
    assert "sintaxis" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Listado, baja lógica y trazabilidad
# ---------------------------------------------------------------------------


def test_list_and_deactivate_template(client: TestClient, db_session: Session):
    _create_user(db_session, "tpl9", "ADMINISTRADOR")
    token = _get_token(client, "user_tpl9")
    detail = _upload(client, token, _docx_bytes(["{{ x }}"]), name="Plantilla Lista")

    resp = client.get("/api/v1/templates?search=Lista", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["versions_count"] == 1

    resp = client.delete(f"/api/v1/templates/{detail['id']}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "INACTIVE"

    # No se pueden cargar versiones nuevas en una plantilla inactiva.
    resp = client.post(
        f"/api/v1/templates/{detail['id']}/versions",
        files={
            "file": ("v2.docx", _docx_bytes(["{{ y }}"]), "application/octet-stream")
        },
        headers=_auth(token),
    )
    assert resp.status_code == 404


def test_templates_require_authentication(client: TestClient):
    resp = client.get("/api/v1/templates")
    assert resp.status_code == 401
