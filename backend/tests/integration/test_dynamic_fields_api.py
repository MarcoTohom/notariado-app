import io
from uuid import uuid4
from zipfile import ZipFile

import pytest
from pypdf import PdfWriter

from app.core.security import create_access_token
from app.models.audit import AuditLog
from app.models.case_field_values import CaseFieldValues
from app.models.dynamic_field import TemplateField
from app.models.template import TemplateVersion
from app.models.user import User

BASE = "/api/v1/fields"


@pytest.fixture
def auth(db_session):
    def make(role="ADMINISTRADOR"):
        identity = uuid4().hex
        user = User(
            username=identity,
            email=f"{identity}@example.com",
            full_name="Usuario sintético",
            password_hash="unused-test-hash",
            role=role,
            status="ACTIVE",
        )
        db_session.add(user)
        db_session.commit()
        return {"Authorization": f"Bearer {create_access_token(subject=user.id)}"}

    return make


def create(client, headers, fields=None):
    fields = fields or [
        {
            "key": "precio",
            "label": "Precio",
            "field_type": "currency",
            "required": True,
            "min_value": "0",
        },
        {
            "key": "total",
            "label": "Total",
            "field_type": "computed",
            "calculation_expression": "precio + 0.1",
        },
    ]
    response = client.post(
        f"{BASE}/definitions",
        headers=headers,
        json={
            "name": "Formulario sintético",
            "case_type": "COMPRAVENTA",
            "fields": fields,
        },
    )
    assert response.status_code == 201, response.text
    case = client.post(
        "/api/v1/cases",
        headers=headers,
        json={"title": "Expediente sintético", "case_type": "COMPRAVENTA"},
    )
    assert case.status_code == 201, case.text
    version = response.json()
    path = f"{BASE}/cases/{case.json()['id']}/versions/{version['id']}"
    return version, case.json(), path


def test_persistence_versions_conflicts_and_atomicity(client, db_session, auth):
    headers = auth()
    version, _case, path = create(client, headers)
    assert db_session.query(TemplateField).count() == 2
    assert client.get(path, headers=headers).json()["revision"] == 0
    response = client.put(
        path,
        headers=headers,
        json={"values": {"precio": "0.20", "total": "999"}, "revision": 0},
    )
    assert response.status_code == 200, response.text
    assert response.json()["values"] == {"precio": "0.20", "total": "0.30"}
    assert client.get(path, headers=headers).json() == response.json()
    rejected = client.put(
        path, headers=headers, json={"values": {"precio": "-1"}, "revision": 1}
    )
    assert rejected.status_code == 422
    assert rejected.json()["detail"]["errors"][0]["path"] == "precio"
    assert client.get(path, headers=headers).json()["revision"] == 1
    conflict = client.put(
        path, headers=headers, json={"values": {"precio": "2"}, "revision": 0}
    )
    assert conflict.status_code == 409
    second = client.post(
        f"{BASE}/definitions/{version['template_id']}/versions",
        headers=headers,
        json={"fields": [{"key": "nuevo", "label": "Nuevo", "field_type": "text"}]},
    )
    assert second.status_code == 201, second.text
    assert second.json()["version_number"] == 2
    assert (
        client.get(f"{BASE}/versions/{version['id']}", headers=headers).json()
        == version
    )
    assert client.get(path, headers=headers).json()["values"]["precio"] == "0.20"
    assert db_session.query(TemplateVersion).count() == 2
    assert db_session.query(CaseFieldValues).count() == 1
    assert db_session.query(AuditLog).filter_by(module="CAMPOS_DINAMICOS").count() == 3


@pytest.mark.parametrize(
    "role,configure,read,write",
    [
        ("ADMINISTRADOR", 201, 200, 200),
        ("ABOGADO_NOTARIO", 201, 200, 200),
        ("AUXILIAR", 403, 200, 200),
        ("ADMINISTRACION", 403, 403, 403),
    ],
)
def test_permissions(client, auth, role, configure, read, write):
    admin = auth()
    _, _, path = create(client, admin)
    headers = auth(role)
    assert client.get(f"{BASE}/versions", headers=headers).status_code == read
    assert (
        client.post(
            f"{BASE}/definitions",
            headers=headers,
            json={
                "name": "Ejemplo",
                "case_type": "COMPRAVENTA",
                "fields": [{"key": "a", "label": "A", "field_type": "text"}],
            },
        ).status_code
        == configure
    )
    assert (
        client.put(path, headers=headers, json={"values": {"precio": "10"}}).status_code
        == write
    )
    assert client.get(f"{BASE}/versions").status_code == 401


def test_relation_refresh_list_order_and_sanitization(client, db_session, auth):
    headers = auth()
    person = client.post(
        "/api/v1/clients",
        headers=headers,
        json={
            "first_name": "María Sintética",
            "last_name": "de la Peña",
            "dpi": "0000000000101",
            "nit": "00123-K",
            "address": "Dirección sintética",
            "marital_status": "SOLTERO",
        },
    )
    assert person.status_code == 201, person.text
    definitions = [
        {
            "key": "cliente",
            "label": "Cliente",
            "field_type": "relation",
            "source": "clients",
            "options_json": {
                "autofill": {
                    "dpi": "dpi",
                    "nit": "nit",
                    "direccion": "address",
                    "estado": "marital_status",
                }
            },
        },
        *[
            {"key": key, "label": key, "field_type": kind, "readonly": True}
            for key, kind in [
                ("dpi", "dpi"),
                ("nit", "nit"),
                ("direccion", "text"),
                ("estado", "text"),
            ]
        ],
        {
            "key": "bienes",
            "label": "Bienes",
            "field_type": "list",
            "options_json": {
                "fields": [
                    {
                        "key": "nombre",
                        "label": "Nombre",
                        "field_type": "name",
                        "required": True,
                    },
                    {"key": "monto", "label": "Monto", "field_type": "currency"},
                ]
            },
        },
        {
            "key": "total",
            "label": "Total",
            "field_type": "computed",
            "calculation_expression": "suma(bienes.monto)",
        },
        {"key": "notas", "label": "Notas", "field_type": "richtext"},
    ]
    _, _, path = create(client, headers, definitions)
    values = {
        "cliente": person.json()["id"],
        "dpi": "1111111111111",
        "bienes": [
            {"nombre": "Bien Dos", "monto": "0.20"},
            {"nombre": "Bien Uno", "monto": "0.10"},
        ],
        "notas": '<p onmouseover="x">Nota</p><script>bad()</script>',
    }
    response = client.put(path, headers=headers, json={"values": values})
    assert response.status_code == 200, response.text
    data = response.json()["values"]
    assert data["dpi"] == "0000000000101" and data["nit"] == "00123K"
    assert data["direccion"] == "Dirección sintética" and data["estado"] == "SOLTERO"
    assert data["total"] == "0.30" and data["bienes"][0]["nombre"] == "Bien Dos"
    assert "<script" not in data["notas"] and "onmouseover" not in data["notas"]
    logs = db_session.query(AuditLog).filter_by(module="CAMPOS_DINAMICOS").all()
    assert all("0000000000101" not in (log.details or "") for log in logs)
    values["bienes"][0]["nombre"] = "123"
    bad = client.put(path, headers=headers, json={"values": values, "revision": 1})
    assert bad.status_code == 422
    assert any(e["path"] == "bienes.0.nombre" for e in bad.json()["detail"]["errors"])
    assert client.get(path, headers=headers).json()["values"] == data


def test_files_content_size_scope_and_authorized_download(
    client, auth, monkeypatch, tmp_path
):
    from app.core.config import settings

    monkeypatch.setattr(settings, "UPLOAD_DIR", tmp_path)
    headers = auth()
    defs = [
        {
            "key": "archivo",
            "label": "Archivo",
            "field_type": "file",
            "options_json": {"extensions": [".pdf"], "max_bytes": 2048},
        }
    ]
    _, case, path = create(client, headers, defs)
    pdf = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(pdf)
    upload = client.post(
        f"{path}/files?field=archivo",
        headers=headers,
        files={"file": ("../../sintetico.pdf", pdf.getvalue(), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    file_id = upload.json()["id"]
    assert upload.json()["name"] == "sintetico.pdf"
    assert (
        client.put(
            path, headers=headers, json={"values": {"archivo": file_id}}
        ).status_code
        == 200
    )
    download = f"{BASE}/cases/{case['id']}/files/{file_id}"
    assert client.get(download, headers=headers).content == pdf.getvalue()
    assert client.get(download).status_code == 401
    assert client.get(download, headers=auth("ADMINISTRACION")).status_code == 403
    _, other, other_path = create(client, headers, defs)
    assert (
        client.put(
            other_path, headers=headers, json={"values": {"archivo": file_id}}
        ).status_code
        == 422
    )
    assert (
        client.get(
            f"{BASE}/cases/{other['id']}/files/{file_id}", headers=headers
        ).status_code
        == 404
    )
    for filename, content, mime, code in [
        ("fake.pdf", b"not pdf", "application/pdf", 422),
        ("large.pdf", b"x" * 2049, "application/pdf", 413),
        ("a.exe", b"x", "application/pdf", 422),
        ("a.pdf", pdf.getvalue(), "text/html", 422),
    ]:
        assert (
            client.post(
                f"{path}/files?field=archivo",
                headers=headers,
                files={"file": (filename, content, mime)},
            ).status_code
            == code
        )
    assert len(list((tmp_path / "attachments").iterdir())) == 1


def test_closed_cases_wrong_type_and_preview_does_not_persist(client, db_session, auth):
    headers = auth()
    version, case, path = create(client, headers)
    response = client.post(
        f"{path}/validate", headers=headers, json={"values": {"precio": "0.20"}}
    )
    assert response.status_code == 200 and response.json()["values"]["total"] == "0.30"
    assert db_session.query(CaseFieldValues).count() == 0
    client.put(
        f"/api/v1/cases/{case['id']}", headers=headers, json={"status": "FINALIZADO"}
    )
    assert (
        client.put(path, headers=headers, json={"values": {"precio": "1"}}).status_code
        == 409
    )
    other = client.post(
        "/api/v1/cases",
        headers=headers,
        json={"title": "Donación sintética", "case_type": "DONACION"},
    ).json()
    assert (
        client.get(
            f"{BASE}/cases/{other['id']}/versions/{version['id']}", headers=headers
        ).status_code
        == 422
    )
    assert client.get(f"{BASE}/versions/{uuid4()}", headers=headers).status_code == 404


def test_csv_and_zip_attachments_and_nested_path(client, auth):
    headers = auth()
    definitions = [
        {
            "key": "bienes",
            "label": "Bienes",
            "field_type": "list",
            "options_json": {
                "fields": [
                    {"key": "archivo", "label": "Archivo", "field_type": "file"},
                ]
            },
        }
    ]
    _, _, path = create(client, headers, definitions)
    csv = client.post(
        f"{path}/files?field=bienes.0.archivo",
        headers=headers,
        files={"file": ("sintetico.csv", b"nombre,valor\nEjemplo,10", "text/csv")},
    )
    assert csv.status_code == 201, csv.text
    saved = client.put(
        path,
        headers=headers,
        json={"values": {"bienes": [{}, {"archivo": csv.json()["id"]}]}},
    )
    assert saved.status_code == 200, saved.text
    for suffix, member in [
        (".docx", "word/document.xml"),
        (".xlsx", "xl/workbook.xml"),
    ]:
        contents = io.BytesIO()
        with ZipFile(contents, "w") as archive:
            archive.writestr(member, "<document/>")
            archive.writestr("[Content_Types].xml", "<Types/>")
        response = client.post(
            f"{path}/files?field=bienes.0.archivo",
            headers=headers,
            files={
                "file": (
                    f"sintetico{suffix}",
                    contents.getvalue(),
                    "application/octet-stream",
                )
            },
        )
        assert response.status_code == 201, response.text
    invalid = io.BytesIO()
    with ZipFile(invalid, "w") as archive:
        archive.writestr("word/document.xml", "<broken")
        archive.writestr("[Content_Types].xml", "<Types/>")
    response = client.post(
        f"{path}/files?field=bienes.0.archivo",
        headers=headers,
        files={
            "file": ("invalido.docx", invalid.getvalue(), "application/octet-stream")
        },
    )
    assert response.status_code == 422
    for name, content in [("invalid.csv", b"\xff\x00"), ("invalid.docx", b"not a zip")]:
        assert (
            client.post(
                f"{path}/files?field=bienes.0.archivo",
                headers=headers,
                files={"file": (name, content, "application/octet-stream")},
            ).status_code
            == 422
        )
    assert (
        client.post(
            f"{path}/files?field=missing",
            headers=headers,
            files={"file": ("a.csv", b"a,b", "text/csv")},
        ).status_code
        == 404
    )


def test_invalid_schema_is_not_persisted(client, db_session, auth):
    headers = auth()
    invalid = [
        [
            {
                "key": "a",
                "label": "A",
                "field_type": "currency",
                "min_value": "not-a-number",
            }
        ],
        [
            {
                "key": "a",
                "label": "A",
                "field_type": "computed",
                "calculation_expression": "missing + 1",
            }
        ],
        [
            {
                "key": "a",
                "label": "A",
                "field_type": "select",
                "options_json": {
                    "choices": [
                        {"label": "A", "value": "x"},
                        {"label": "B", "value": "x"},
                    ]
                },
            }
        ],
    ]
    for fields in invalid:
        response = client.post(
            f"{BASE}/definitions",
            headers=headers,
            json={"name": "Inválido", "case_type": "COMPRAVENTA", "fields": fields},
        )
        assert response.status_code == 422, response.text
    assert db_session.query(TemplateVersion).count() == 0
