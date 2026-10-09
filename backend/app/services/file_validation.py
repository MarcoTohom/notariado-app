"""Validación estructural de los formatos de archivo permitidos."""

import io
from xml.etree import ElementTree
from zipfile import ZipFile

from fastapi import HTTPException

MIME_TYPES = {
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def verify_file(content, suffix):
    try:
        if suffix == ".pdf":
            from pypdf import PdfReader

            if not content.startswith(b"%PDF-"):
                raise ValueError()
            reader = PdfReader(io.BytesIO(content), strict=True)
            if reader.is_encrypted:
                raise ValueError()
            len(reader.pages)
        elif suffix == ".csv":
            text = content.decode("utf-8-sig")
            if "\x00" in text or not text.strip():
                raise ValueError()
        else:
            with ZipFile(io.BytesIO(content)) as archive:
                infos = archive.infolist()
                if (
                    len(infos) > 2000
                    or sum(i.file_size for i in infos) > 30 * 1024 * 1024
                ):
                    raise ValueError()
                required = (
                    "word/document.xml" if suffix == ".docx" else "xl/workbook.xml"
                )
                if (
                    required not in archive.namelist()
                    or "[Content_Types].xml" not in archive.namelist()
                ):
                    raise ValueError()
                if any("vbaproject" in i.filename.lower() for i in infos):
                    raise ValueError()
                if archive.testzip():
                    raise ValueError()
                for member in (required, "[Content_Types].xml"):
                    xml = archive.read(member)
                    if b"<!DOCTYPE" in xml or b"<!ENTITY" in xml:
                        raise ValueError()
                    ElementTree.fromstring(xml)
    except Exception as exc:
        # Parser exceptions are deliberately converted to a non-sensitive client error.
        raise HTTPException(
            422, "El contenido no corresponde a un archivo permitido válido."
        ) from exc
