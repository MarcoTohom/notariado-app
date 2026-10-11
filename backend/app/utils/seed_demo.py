"""Semilla de demostracion con archivos reales (idempotente, 100% sintetica).

Genera en la base de datos local y en disco lo que la interfaz necesita para
poder mostrarse sin intervencion manual:

- 5 plantillas DOCX con marcadores Jinja2 (subidas por el MISMO servicio de
  produccion `template_docx_service`, con validacion OpenXML, hash SHA-256,
  extractor de variables y auditoria).
- 3 expedientes con comparecientes, ficha maestra de clientes y datos ya
  capturados en la version DOCX activa.
- 20 borradores renderizados con docxtpl (mismo camino que el boton "Generar
  DOCX": bloqueo por hallazgos CRITICAL, verificacion de placeholders e
  historial inmutable de versiones).
- 30 adjuntos de ejemplo que ejercitan el inventario y la vista previa en
  modal: DOCX, PDF con capa de texto, PDF "escaneado" sin texto, CSV y XLSX.

Invariantes del proyecto respetados:
- Datos 100% sinteticos (Faker es_ES, DPIs/NITs con formato valido).
- DPI y NIT siempre como `string`; nunca se convierten a entero.
- Montos calculados con `Decimal` y serializados como texto.
- Los DOCX se renderizan exclusivamente en el backend.
- Idempotente: puede ejecutarse varias veces sin duplicar registros.

Uso:
    python -m app.utils.seed_demo
    powershell .\\scripts\\seed_demo.ps1
"""

from __future__ import annotations

import asyncio
import io
import random
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pandas as pd
from docx import Document as DocxDocument
from sqlalchemy import func
from sqlalchemy.orm import Session
from starlette.datastructures import Headers, UploadFile

from app.core.roles import RoleEnum
from app.db.session import SessionLocal
from app.models.case import Case
from app.models.case_field_values import CaseFieldValues
from app.models.client import Client
from app.models.document import Document, DocumentVersion
from app.models.field_attachment import FieldAttachment
from app.models.template import Template, TemplateVersion
from app.models.user import User
from app.rules.engine import run_rules, summarize
from app.rules.number_words import amount_to_words
from app.schemas.case import CaseCreate, CasePartyCreate
from app.services.case_service import create_case
from app.services.document_generation_service import generate_draft
from app.services.file_validation import MIME_TYPES, verify_file
from app.services.template_docx_service import (
    activate_version,
    create_template_from_docx,
)
from app.services.validation_context import build_validation_context

DOCX_MIME = MIME_TYPES[".docx"]

#: Prefijo de todo lo creado aqui: permite reconocer y no duplicar la semilla.
DEMO_PREFIX = "DEMO"

#: Tipo de escritura -> roles de compareciente usados en las plantillas.
PARTY_ROLES: dict[str, tuple[str, ...]] = {
    "COMPRAVENTA": ("VENDEDOR", "COMPRADOR"),
    "DONACION": ("DONANTE", "DONATARIO"),
    "ARRENDAMIENTO": ("ARRENDADOR", "ARRENDATARIO"),
}


# ---------------------------------------------------------------------------
# Generadores de archivo sintetico
# ---------------------------------------------------------------------------


def _pdf_escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def build_pdf(pages: list[list[str]]) -> bytes:
    """PDF 1.4 valido y minimal, generado sin dependencias externas.

    Cada pagina es una lista de lineas. Una lista vacia produce una pagina sin
    capa de texto, que es exactamente el caso de un documento escaneado: el
    inventario lo marca como no extraible sin OCR (limite del MVP).
    """
    objects: dict[int, bytes] = {}
    page_count = len(pages)
    font_object = 3
    first_page_object = 4
    first_content_object = first_page_object + page_count

    kids = " ".join(f"{first_page_object + i} 0 R" for i in range(page_count))
    objects[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objects[2] = f"<< /Type /Pages /Kids [{kids}] /Count {page_count} >>".encode()
    # Sin /Encoding explícito se usa la codificación estándar: los bytes
    # latin-1 se leen igual en la extracción y evitan caracteres corruptos.
    objects[font_object] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    for index, lines in enumerate(pages):
        page_object = first_page_object + index
        content_object = first_content_object + index
        operations = ["BT", "/F1 11 Tf", "16 TL", "72 730 Td"]
        for line in lines:
            operations.append(f"({_pdf_escape(line)}) Tj")
            operations.append("T*")
        operations.append("ET")
        stream = "\n".join(operations).encode("latin-1", "replace")
        objects[page_object] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_object} 0 R >> >> "
            f"/Contents {content_object} 0 R >>"
        ).encode()
        objects[content_object] = (
            f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream"
        )

    out = bytearray(b"%PDF-1.4\n")
    offsets: dict[int, int] = {}
    for number in sorted(objects):
        offsets[number] = len(out)
        out += f"{number} 0 obj\n".encode() + objects[number] + b"\nendobj\n"

    xref_position = len(out)
    size = max(objects) + 1
    out += f"xref\n0 {size}\n".encode()
    out += b"0000000000 65535 f \n"
    for number in range(1, size):
        out += f"{offsets[number]:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {size} /Root 1 0 R >>\nstartxref\n{xref_position}\n%%EOF"
    ).encode()
    return bytes(out)


def build_csv(header: list[str], rows: list[list[object]]) -> bytes:
    """CSV UTF-8 con BOM (compatibilidad con Excel en espanol)."""
    buffer = io.StringIO()
    pd.DataFrame(rows, columns=header).to_csv(buffer, index=False)
    return buffer.getvalue().encode("utf-8-sig")


def build_xlsx(sheets: dict[str, pd.DataFrame]) -> bytes:
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        for title, frame in sheets.items():
            frame.to_excel(writer, sheet_name=title[:31], index=False)
    return buffer.getvalue()


def build_attachment_docx(title: str, lines: list[str]) -> bytes:
    document = DocxDocument()
    document.add_heading(title, level=1)
    for line in lines:
        document.add_paragraph(line)
    table = document.add_table(rows=1, cols=2)
    table.rows[0].cells[0].text = "Concepto"
    table.rows[0].cells[1].text = "Detalle"
    for concept, detail in (
        ("Emitido por", "Bufete Notarial de Demostracion (sintetico)"),
        ("Uso", "Documento de apoyo al expediente"),
    ):
        cells = table.add_row().cells
        cells[0].text = concept
        cells[1].text = detail
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# Construccion de las plantillas DOCX con marcadores Jinja2
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class TemplateSpec:
    """Plantilla DOCX sintetica a sembrar."""

    name: str
    case_type: str
    description: str
    filename: str
    paragraphs: tuple[str, ...]
    table_header: tuple[str, str] = ("Campo", "Valor")
    table_rows: tuple[tuple[str, str], ...] = ()

    def to_docx(self) -> bytes:
        document = DocxDocument()
        document.add_heading(self.name, level=1)
        for paragraph in self.paragraphs:
            document.add_paragraph(paragraph)
        table = document.add_table(rows=1, cols=2)
        table.rows[0].cells[0].text = self.table_header[0]
        table.rows[0].cells[1].text = self.table_header[1]
        for left, right in self.table_rows:
            cells = table.add_row().cells
            cells[0].text = left
            cells[0].paragraphs[0].runs[0].text = left
            cells[1].text = right
            cells[1].paragraphs[0].runs[0].text = right
        buffer = io.BytesIO()
        document.save(buffer)
        return buffer.getvalue()


def _compraventa_specs() -> list[TemplateSpec]:
    return [
        TemplateSpec(
            name=f"{DEMO_PREFIX} · Compraventa de Inmueble (modelo vigente)",
            case_type="COMPRAVENTA",
            description="Escritura de compraventa con comparecientes, precio en letras y testigos.",
            filename="plantilla_compraventa_demo.docx",
            paragraphs=(
                "ESCRITURA PUBLICA DE COMPRAVENTA",
                "Numero: {{ numero_escritura }}",
                "Fecha: {{ fecha_escritura }}",
                "En la ciudad de {{ ciudad }}, comparecen:",
                "VENDEDOR: {{ vendedor.nombre }}, DPI {{ vendedor.dpi }}, NIT {{ vendedor.nit }}",
                "COMPRADOR: {{ comprador.nombre }}, DPI {{ comprador.dpi }}, NIT {{ comprador.nit }}",
                "PRECIO DE VENTA: {{ precio }} ({{ precio_letras }})",
                "TESTIGOS:",
                "{% for testigo in testigos %}{{ testigo.nombre }}, DPI {{ testigo.dpi }};{% endfor %}",
                "PRIMERA: {{ clausulas.0.texto }}",
                "SEGUNDA: {{ clausulas.1.texto }}",
            ),
            table_header=("Party", "Documento"),
            table_rows=(
                ("Vendedor", "{{ vendedor.nombre }}"),
                ("Comprador", "{{ comprador.nombre }}"),
            ),
        ),
        TemplateSpec(
            name=f"{DEMO_PREFIX} · Compraventa (variante con finca registral)",
            case_type="COMPRAVENTA",
            description="Variante con datos registrales del inmueble.",
            filename="plantilla_compraventa_finca_demo.docx",
            paragraphs=(
                "ESCRITURA DE COMPRAVENTA CON FINCA REGISTRAL",
                "Numero: {{ numero_escritura }}",
                "Fecha: {{ fecha_escritura }}",
                "VENDEDOR: {{ vendedor.nombre }}, DPI {{ vendedor.dpi }}",
                "COMPRADOR: {{ comprador.nombre }}, DPI {{ comprador.dpi }}",
                "FINCA REGISTRAL: {{ finca_registral }}",
                "FOLIO REGISTRAL: {{ folio_registral }}",
                "LIBRO REGISTRAL: {{ libro_registral }}",
                "PRECIO: {{ precio }} ({{ precio_letras }})",
            ),
            table_header=("Dato registral", "Valor"),
            table_rows=(
                ("Finca", "{{ finca_registral }}"),
                ("Municipio", "{{ municipio }}"),
            ),
        ),
    ]


def _donacion_spec() -> TemplateSpec:
    return TemplateSpec(
        name=f"{DEMO_PREFIX} · Donacion entre Vivos",
        case_type="DONACION",
        description="Escritura de donacion con cláusula de cargas.",
        filename="plantilla_donacion_demo.docx",
        paragraphs=(
            "ESCRITURA PUBLICA DE DONACION ENTRE VIVOS",
            "Numero: {{ numero_escritura }}",
            "Fecha: {{ fecha_escritura }}",
            "DONANTE: {{ donante.nombre }}, DPI {{ donante.dpi }}, NIT {{ donante.nit }}",
            "DONATARIO: {{ donatario.nombre }}, DPI {{ donatario.dpi }}, NIT {{ donatario.nit }}",
            "DONACION: {{ precio }} ({{ precio_letras }})",
            "TESTIGOS:",
            "{% for testigo in testigos %}{{ testigo.nombre }}, DPI {{ testigo.dpi }};{% endfor %}",
            "CLAUSULA: {{ clausulas.0.texto }}",
        ),
    )


def _arrendamiento_spec() -> TemplateSpec:
    return TemplateSpec(
        name=f"{DEMO_PREFIX} · Arrendamiento de Inmueble",
        case_type="ARRENDAMIENTO",
        description="Contrato de arrendamiento con canon y plazo.",
        filename="plantilla_arrendamiento_demo.docx",
        paragraphs=(
            "CONTRATO DE ARRENDAMIENTO",
            "Numero: {{ numero_escritura }}",
            "Fecha: {{ fecha_escritura }}",
            "ARRENDADOR: {{ arrendador.nombre }}, DPI {{ arrendador.dpi }}",
            "ARRENDATARIO: {{ arrendatario.nombre }}, DPI {{ arrendatario.dpi }}",
            "CANON MENSUAL: {{ precio }} ({{ precio_letras }})",
            "PLAZO: {{ plazo_meses }} meses",
            "TESTIGOS:",
            "{% for testigo in testigos %}{{ testigo.nombre }}, DPI {{ testigo.dpi }};{% endfor %}",
        ),
    )


def _matrimonio_spec() -> TemplateSpec:
    return TemplateSpec(
        name=f"{DEMO_PREFIX} · Protocolacion de Matrimonio",
        case_type="MATRIMONIO",
        description="Protocolo de celebracion de matrimonio (sin expediente semilla).",
        filename="plantilla_matrimonio_demo.docx",
        paragraphs=(
            "ACTA DE PROTOCOLACION DE MATRIMONIO",
            "Numero: {{ numero_escritura }}",
            "Fecha: {{ fecha_escritura }}",
            "NOVIO: {{ novio.nombre }}, DPI {{ novio.dpi }}",
            "NOVIA: {{ novia.nombre }}, DPI {{ novia.dpi }}",
            "TESTIGOS:",
            "{% for testigo in testigos %}{{ testigo.nombre }}, DPI {{ testigo.dpi }};{% endfor %}",
        ),
    )


def template_specs() -> list[TemplateSpec]:
    return [
        *_compraventa_specs(),
        _donacion_spec(),
        _arrendamiento_spec(),
        _matrimonio_spec(),
    ]


# ---------------------------------------------------------------------------
# Datos sinteticos coherentes con la ficha maestra (evita hallazgos CRITICAL)
# ---------------------------------------------------------------------------


@dataclass
class CaseSpec:
    case_type: str
    title: str
    instrument_number: str
    protocol_folio: str
    protocol_book: str
    description: str
    amount: Decimal


def case_specs() -> list[CaseSpec]:
    return [
        CaseSpec(
            case_type="COMPRAVENTA",
            title="Compraventa de inmueble urbano - Finca 20245",
            instrument_number="DEMO-CV-001",
            protocol_folio="12",
            protocol_book="III",
            description="Compraventa de predio habitacional con dos testigos.",
            amount=Decimal("450000.00"),
        ),
        CaseSpec(
            case_type="DONACION",
            title="Donacion entre vivos - Inmueble familiar",
            instrument_number="DEMO-DN-001",
            protocol_folio="24",
            protocol_book="IV",
            description="Donacion pura y simple entre familiares.",
            amount=Decimal("120000.00"),
        ),
        CaseSpec(
            case_type="ARRENDAMIENTO",
            title="Arrendamiento de local comercial - Canon mensual",
            instrument_number="DEMO-AR-001",
            protocol_folio="31",
            protocol_book="V",
            description="Contrato de arrendamiento por doce meses.",
            amount=Decimal("3500.00"),
        ),
    ]


def _fake_person(
    rng: random.Random, *, first: str = "", last: str = ""
) -> dict[str, str]:
    """Persona sintetica con DPI de 13 digitos como texto."""
    from app.utils.synthetic_data import synthetic_person

    person = synthetic_person(_fake_person.faker, rng)
    if first:
        person["first_name"] = first
    if last:
        person["last_name"] = last
    return person


def _install_faker() -> None:
    from app.utils.synthetic_data import make_faker

    _fake_person.faker = make_faker()  # type: ignore[attr-defined]


def _client_values(db: Session, person: dict[str, str], rng: random.Random) -> Client:
    """Ficha maestra del compareciente. DPI/NIT SIEMPRE como texto."""
    existing = (
        db.query(Client)
        .filter(
            Client.first_name == person["first_name"],
            Client.last_name == person["last_name"],
        )
        .first()
    )
    if existing is not None:
        return existing
    birth = date(1970, 1, 1) + timedelta(days=rng.randrange(0, 15000))
    client = Client(
        first_name=person["first_name"],
        last_name=person["last_name"],
        dpi=str(person["dpi"]),  # invariante: string de 13 digitos
        nit=person.get("nit"),
        marital_status=person.get("marital_status"),
        profession=person.get("profession"),
        nationality="GT",
        birth_date=birth.isoformat(),
        address="Zona 1, Ciudad de Guatemala (sintetico)",
        phone=f"+502 {rng.randrange(2000, 9999)} {rng.randrange(1000, 9999)}",
        email=f"{person['first_name'].lower()}.{person['last_name'].lower()}@demo.local",
        status="ACTIVE",
    )
    db.add(client)
    db.flush()
    return client


def build_values(
    spec: CaseSpec,
    clients: dict[str, Client],
    rng: random.Random,
    *,
    instrument_number: str,
) -> dict[str, object]:
    """Valores del expediente para la version DOCX, coherentes con la ficha.

    Las claves se derivan de las variables Jinja2 de la plantilla
    (`comprador.nombre` -> `comprador_nombre`) que es exactamente la
    transformacion que aplica el extractor de variables del servicio real.
    """
    amount = str(spec.amount)
    letters = amount_to_words(spec.amount)
    today = date.today()
    first_role, second_role = PARTY_ROLES[spec.case_type]
    first, second = clients[first_role], clients[second_role]

    values: dict[str, object] = {
        "numero_escritura": instrument_number,
        "fecha_escritura": today.isoformat(),
        "ciudad": "Guatemala",
        "precio": amount,
        "precio_letras": letters,
        "finca_registral": str(rng.randrange(10000, 99999)),
        "folio_registral": str(rng.randrange(100, 999)),
        "libro_registral": str(rng.randrange(1, 99)),
        "municipio": "Guatemala",
        "plazo_meses": "12",
        f"{first_role.lower()}_nombre": first.full_name,
        f"{first_role.lower()}_dpi": str(first.dpi),
        f"{first_role.lower()}_nit": first.nit or "",
        f"{second_role.lower()}_nombre": second.full_name,
        f"{second_role.lower()}_dpi": str(second.dpi),
        f"{second_role.lower()}_nit": second.nit or "",
        # alias en ingles para las plantillas que los usan
        "comprador_nombre": clients.get("COMPRADOR", second).full_name,
        "comprador_dpi": str(clients.get("COMPRADOR", second).dpi),
        "vendedor_nombre": clients.get("VENDEDOR", first).full_name,
        "vendedor_dpi": str(clients.get("VENDEDOR", first).dpi),
        "vendedor_nit": clients.get("VENDEDOR", first).nit or "",
        "novio_nombre": first.full_name,
        "novio_dpi": str(first.dpi),
        "novia_nombre": second.full_name,
        "novia_dpi": str(second.dpi),
        "testigos": [
            {"nombre": t.full_name, "dpi": str(t.dpi)}
            for t in (
                clients.get("TESTIGO_A"),
                clients.get("TESTIGO_B"),
            )
            if t is not None
        ],
        "clausulas": [
            {
                "numero": "1",
                "texto": "El vendedor transfiere la propiedad al comprador.",
            },
            {"numero": "2", "texto": "El comprador acepta la escritura presente."},
        ],
    }
    return values


# ---------------------------------------------------------------------------
# Siembra
# ---------------------------------------------------------------------------


def _demo_admin(db: Session) -> User:
    admin = (
        db.query(User)
        .filter(User.role == RoleEnum.ADMINISTRADOR.value, User.status == "ACTIVE")
        .first()
    )
    if admin is None:
        raise SystemExit(
            "No hay un administrador activo. Ejecute scripts/seed.ps1 primero."
        )
    return admin


async def _upload_template(db: Session, spec: TemplateSpec, user: User) -> Template:
    """Crea la plantilla por el servicio real de ingesta (no escritura directa)."""
    upload = UploadFile(
        file=io.BytesIO(spec.to_docx()),
        filename=spec.filename,
        headers=Headers({"content-type": DOCX_MIME}),
    )
    detail = await create_template_from_docx(
        db,
        name=spec.name,
        case_type=spec.case_type,
        description=spec.description,
        notes="Plantilla sintetica creada por seed_demo.",
        file=upload,
        user=user,
    )
    version = next(v for v in detail.versions if v.version_number == 1)
    activate_version(db, detail.id, version.id, user)
    template = db.get(Template, detail.id)
    return template


def _active_version(db: Session, template: Template) -> TemplateVersion:
    return (
        db.query(TemplateVersion)
        .filter_by(template_id=template.id, status="ACTIVA")
        .first()
    )


def _seed_templates(db: Session, user: User) -> list[Template]:
    templates: list[Template] = []
    for spec in template_specs():
        existing = db.query(Template).filter(Template.name == spec.name).first()
        if existing is not None:
            print(f"  = plantilla ya existe: {spec.name}")
            templates.append(existing)
            continue
        template = asyncio.run(_upload_template(db, spec, user))
        print(f"  + plantilla creada: {template.name} (v1 ACTIVADA)")
        templates.append(template)
    return templates


def _seed_case(
    db: Session,
    spec: CaseSpec,
    user: User,
    rng: random.Random,
    instruments: dict[str, str],
) -> tuple[object, dict[str, Client]]:
    existing = db.query(Case).filter(Case.title == spec.title).first()
    if existing is not None:
        parties = _existing_clients(db, existing.id)
        print(f"  = expediente ya existe: {existing.case_number} - {existing.title}")
        return existing, parties

    clients: dict[str, Client] = {}
    first_role, second_role = PARTY_ROLES[spec.case_type]
    for role in (first_role, second_role, "TESTIGO_A", "TESTIGO_B"):
        clients[role] = _client_values(db, _fake_person(rng), rng)

    parties = [
        CasePartyCreate(
            client_id=clients[first_role].id, party_role=first_role, order_index=0
        ),
        CasePartyCreate(
            client_id=clients[second_role].id, party_role=second_role, order_index=1
        ),
        CasePartyCreate(
            client_id=clients["TESTIGO_A"].id, party_role="TESTIGO", order_index=2
        ),
        CasePartyCreate(
            client_id=clients["TESTIGO_B"].id, party_role="TESTIGO", order_index=3
        ),
    ]
    instrument = instruments[spec.case_type]
    case = create_case(
        db,
        CaseCreate(
            case_type=spec.case_type,
            title=spec.title,
            description=spec.description,
            instrument_number=instrument,
            protocol_folio=spec.protocol_folio,
            protocol_book=spec.protocol_book,
            assigned_user_id=user.id,
            parties=parties,
        ),
        operator_user=user,
    )
    print(f"  + expediente creado: {case.case_number} - {case.title}")
    return case, clients


def _existing_clients(db: Session, case_id: str) -> dict[str, Client]:
    from app.models.case_party import CaseParty

    parties = db.query(CaseParty).filter_by(case_id=case_id).all()
    mapping: dict[str, Client] = {}
    witness_index = 0
    for party in parties:
        client = db.get(Client, party.client_id)
        if client is None:
            continue
        if party.party_role == "TESTIGO":
            mapping[f"TESTIGO_{'AB'[witness_index]}"] = client
            witness_index += 1
        else:
            mapping[party.party_role] = client
    return mapping


def _store_values(
    db: Session, case, version: TemplateVersion, spec: CaseSpec, clients, rng
) -> None:
    instrument = str(rng.randrange(100, 999))
    values = build_values(
        spec, clients, rng, instrument_number=f"{spec.instrument_number}/{instrument}"
    )
    existing = (
        db.query(CaseFieldValues)
        .filter_by(case_id=case.id, template_version_id=version.id)
        .first()
    )
    if existing is not None:
        existing.values = values
    else:
        db.add(
            CaseFieldValues(
                case_id=case.id,
                template_version_id=version.id,
                values=values,
                revision=1,
            )
        )
    db.commit()


def _assert_no_critical(
    db: Session, case_id: str, version_id: str, values: dict
) -> None:
    context = build_validation_context(db, case_id, version_id, values)
    findings = run_rules(context)
    critical = [f for f in findings if f.severity == "CRITICAL"]
    if critical:
        summary = summarize(findings)
        detail = "; ".join(f"{f.rule_id} en {f.field_key}" for f in critical)
        raise RuntimeError(
            f"La semilla genero datos con hallazgos CRITICAL ({detail}). "
            f"Resumen: {summary}"
        )


def _seed_drafts(
    db: Session, user: User, plan: list[tuple[object, TemplateVersion, str, int]], rng
) -> int:
    created = 0
    for case, version, instrument, target in plan:
        stored = (
            db.query(CaseFieldValues)
            .filter_by(case_id=case.id, template_version_id=version.id)
            .first()
        )
        if stored is None:
            continue
        existing_versions = (
            db.query(func.count(DocumentVersion.id))
            .join(Document, Document.id == DocumentVersion.document_id)
            .filter(
                Document.case_id == case.id,
                DocumentVersion.template_version_id == version.id,
            )
            .scalar()
            or 0
        )
        for index in range(existing_versions, target):
            detail = generate_draft(
                db,
                case_id=case.id,
                template_version_id=version.id,
                notes=f"Version {index + 1} generada por seed_demo (sintetica).",
                user=user,
            )
            number = max(v.version_number for v in detail.versions)
            status = (
                "sin placeholders"
                if all(v.placeholders_free for v in detail.versions)
                else "CON placeholders"
            )
            created += 1
            print(f"  + borrador {case.case_number}: v{number} ({status})")
            _ = instrument
    return created


def _seed_attachments(
    db: Session,
    plan: list[tuple[object, TemplateVersion]],
    rng,
    *,
    total: int = 30,
) -> int:
    """Reparte `total` adjitos entre los expedientes, variando el formato.

    Los formatos cubren los tres caminos del preview en modal: texto (DOCX y
    PDF con capa de texto), tabla (CSV y XLSX) y el estado sin capa de texto
    (PDF "escaneado"), que el MVP no puede extraer sin OCR.
    """
    from app.core.config import settings

    directory = settings.UPLOAD_DIR / "attachments"
    directory.mkdir(parents=True, exist_ok=True)

    # Un adjunto por expediente y vuelta: la version DOCX activa del expediente.
    unique: list[tuple[object, TemplateVersion]] = []
    seen_cases: set[str] = set()
    for case, version in plan:
        if case.id in seen_cases:
            continue
        seen_cases.add(case.id)
        unique.append((case, version))
    if not unique:
        return 0

    builders = (
        ("soporte", "docx", "Contrato de soporte del expediente"),
        ("certificacion", "pdf_texto", "Certificacion de no registro"),
        ("inventario", "csv", "Inventario de bienes"),
        ("escaneo", "pdf_escaneo", "Copia escaneada sin capa de texto"),
        ("planilla", "xlsx", "Planilla de amortizacion"),
    )

    created = 0
    per_case = total // len(unique)
    remainder = total % len(unique)
    for position, (case, version) in enumerate(unique):
        count = per_case + (1 if position < remainder else 0)
        # Idempotencia: no se excede la cuota si el expediente ya tiene adjuntos.
        existing = (
            db.query(func.count(FieldAttachment.id))
            .filter(FieldAttachment.case_id == case.id)
            .scalar()
            or 0
        )
        for index in range(existing, count):
            field_key, kind, title = builders[(created) % len(builders)]
            original = f"demo_{case.case_number[-5:]}_{field_key}_{index + 1:02d}"
            if kind == "docx":
                suffix = ".docx"
                content = build_attachment_docx(
                    title, [f"Adjunto sintetico {index + 1}."]
                )
            elif kind == "pdf_texto":
                suffix = ".pdf"
                content = build_pdf(
                    [
                        [
                            title.upper(),
                            f"EXPEDIENTE: {case.case_number}",
                            f"FECHA: {date.today().isoformat()}",
                            "DOCUMENTO SINTETICO PARA DEMOSTRACION",
                        ]
                    ]
                )
            elif kind == "pdf_escaneo":
                suffix, content = ".pdf", build_pdf([[]])  # sin capa de texto
            elif kind == "csv":
                suffix = ".csv"
                content = build_csv(
                    ["concepto", "cantidad", "estado"],
                    [
                        ["Muebles", 3, "Nuevo"],
                        ["Equipo de oficina", 12, "Nuevo"],
                        ["Electrodomesticos", 5, "Usado"],
                    ],
                )
            else:
                suffix = ".xlsx"
                content = build_xlsx(
                    {
                        "Resumen": pd.DataFrame(
                            {
                                "mes": ["2026-01", "2026-02", "2026-03"],
                                "canon": ["3500.00", "3500.00", "3500.00"],
                            }
                        )
                    }
                )

            verify_file(content, suffix)
            storage_name = f"{uuid4()}{suffix}"
            (directory / storage_name).write_bytes(content)
            db.add(
                FieldAttachment(
                    case_id=case.id,
                    template_version_id=version.id,
                    field_key=f"{field_key}_{index + 1}",
                    original_name=f"{original}{suffix}",
                    storage_name=storage_name,
                    media_type=MIME_TYPES[suffix],
                    size=len(content),
                )
            )
            db.commit()
            created += 1
    return created


def seed_demo() -> dict[str, int]:
    """Punto de entrada idempotente. Devuelve un resumen de lo sembrado."""
    _install_faker()
    rng = random.Random(20261011)  # corpus reproducible entre ejecuciones

    db = SessionLocal()
    try:
        admin = _demo_admin(db)
        print(f"[1/4] Plantillas DOCX ({len(template_specs())} especificadas)")
        templates = _seed_templates(db, admin)

        print("[2/4] Expedientes y datos capturados")
        specs = case_specs()
        instruments: dict[str, str] = {}
        counter = 0
        for spec in specs:
            counter += 1
            instruments[spec.case_type] = f"{spec.instrument_number}-{counter:03d}"

        seeded: list[tuple[object, TemplateVersion, str, int]] = []
        case_versions: list[tuple[object, TemplateVersion]] = []
        for spec in specs:
            case, clients = _seed_case(db, spec, admin, rng, instruments)
            matching = [t for t in templates if t.case_type == spec.case_type]
            if not matching:
                continue
            version = _active_version(db, matching[0])
            if version is None:
                continue
            _store_values(db, case, version, spec, clients, rng)
            stored = (
                db.query(CaseFieldValues)
                .filter_by(case_id=case.id, template_version_id=version.id)
                .first()
            )
            if stored is not None:
                _assert_no_critical(db, case.id, version.id, stored.values)
                print(
                    f"    datos capturados y validados sin CRITICAL: {case.case_number}"
                )
            target = 4 if len(matching) > 1 else 6
            seeded.append((case, version, instruments[spec.case_type], target))
            case_versions.append((case, version))
            # Segunda plantilla del mismo tipo de escritura -> mas versiones.
            for extra in matching[1:]:
                extra_version = _active_version(db, extra)
                if extra_version is None:
                    continue
                _store_values(db, case, extra_version, spec, clients, rng)
                seeded.append(
                    (case, extra_version, instruments[spec.case_type], target)
                )
                case_versions.append((case, extra_version))

        print("[3/4] Borradores generados con docxtpl")
        drafts = _seed_drafts(db, admin, seeded, rng)

        print("[4/4] Adjuntos de ejemplo")
        attachments = _seed_attachments(db, case_versions, rng)

        totals = {
            "plantillas": len(templates),
            "expedientes": len(specs),
            "borradores": drafts,
            "adjuntos": attachments,
        }
        print("\n[OK] Resumen de la siembra de demostracion:")
        print(f"  Plantillas DOCX : {totals['plantillas']}")
        print(f"  Expedientes     : {totals['expedientes']}")
        print(f"  Borradores       : {totals['borradores']}")
        print(f"  Adjuntos         : {totals['adjuntos']}")
        db.commit()
        return totals
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
