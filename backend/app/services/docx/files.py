"""Validación de carga DOCX, nombres, hashes y directorios de almacenamiento."""

import hashlib
import re
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.services.file_validation import verify_file

DOCX_SUFFIX = ".docx"


MAX_TEMPLATE_BYTES = 10 * 1024 * 1024  # 10 MB por archivo (security.md)


def sanitize_original_name(name: str) -> str:
    """Nombre de archivo seguro: basename sin caracteres de control ni rutas."""
    cleaned = re.sub(r"[\x00-\x1f]", "", name.replace("\\", "/").split("/")[-1])
    return cleaned[:200] or "plantilla.docx"


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def template_storage_dir() -> Path:
    directory = settings.UPLOAD_DIR / "templates"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def preview_storage_dir() -> Path:
    directory = settings.GENERATED_DIR / "previews"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


async def read_valid_docx(file: UploadFile) -> tuple[bytes, str]:
    """Valida extensión, tamaño (10 MB) e integridad OpenXML del archivo."""
    original = sanitize_original_name(file.filename or "")
    suffix = Path(original).suffix.lower()
    if suffix != DOCX_SUFFIX:
        raise HTTPException(422, "Solo se permiten archivos con extensión .docx.")
    content = await file.read(MAX_TEMPLATE_BYTES + 1)
    if not content:
        raise HTTPException(422, "El archivo está vacío.")
    if len(content) > MAX_TEMPLATE_BYTES:
        raise HTTPException(413, "El archivo supera el máximo de 10 MB.")
    verify_file(content, DOCX_SUFFIX)  # zip íntegro, sin macros ni XXE
    return content, original


def document_storage_dir() -> Path:
    directory = settings.GENERATED_DIR / "documents"
    directory.mkdir(parents=True, exist_ok=True)
    return directory
