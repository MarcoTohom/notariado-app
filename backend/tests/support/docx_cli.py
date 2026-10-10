"""Puente de Playwright a python-docx; solo procesa documentos sintéticos."""

import io
import json
import sys
from pathlib import Path

from docx import Document


def main():
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from tests.support.documents import docx_bytes

    if sys.argv[1] == "template":
        sys.stdout.buffer.write(
            docx_bytes(
                [
                    "ESCRITURA No. {{ numero_escritura }}",
                    "COMPRADOR: {{ comprador.nombre }} DPI {{ comprador.dpi }}",
                    "NIT: {{ comprador.nit }}",
                    "FINCA: {{ finca_registral }} FOLIO: {{ folio_registral }} LIBRO: {{ libro_registral }}",
                ]
            )
        )
    elif sys.argv[1] == "verify":
        document = Document(io.BytesIO(sys.stdin.buffer.read()))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        assert "{{" not in text and "{%" not in text
        assert f"ESCRITURA No. {sys.argv[2]}" in text
        assert "0000000000301" in text
        assert "COMPRADOR: Carlos Sintetico Mendez" in text
        assert "NIT: 00126K" in text
        print(json.dumps(dict(residuals=0, expected_values=True)))
    else:
        raise SystemExit("Operación de prueba desconocida.")


if __name__ == "__main__":
    main()
