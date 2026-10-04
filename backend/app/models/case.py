from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IdentifiableMixin

if TYPE_CHECKING:
    from app.models.case_party import CaseParty


class CaseTypeEnum:
    COMPRAVENTA = "COMPRAVENTA"
    DONACION = "DONACION"
    ARRENDAMIENTO = "ARRENDAMIENTO"
    MATRIMONIO = "MATRIMONIO"
    SOCIEDAD = "SOCIEDAD"


class CaseStatusEnum:
    ABIERTO = "ABIERTO"
    EN_REVISION = "EN_REVISION"
    PENDIENTE = "PENDIENTE"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"


class Case(Base, IdentifiableMixin):
    """Expediente notarial que centraliza documentación, borradores y finanzas.

    Genera un código único EXP-YYYY-##### secuencial. Soporta los 5 tipos de
    escritura base del sistema y asocia múltiples partes comparecientes.
    """

    __tablename__ = "cases"

    # --- Identificación del Expediente ---
    case_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    case_type: Mapped[str] = mapped_column(
        String(30), default="COMPRAVENTA", nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="ABIERTO", nullable=False, index=True
    )

    # --- Descripción ---
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Datos del Instrumento ---
    instrument_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    protocol_folio: Mapped[str | None] = mapped_column(String(30), nullable=True)
    protocol_book: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # --- Fechas ---
    opened_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Responsable ---
    assigned_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )

    # --- Relaciones ---
    parties: Mapped[list["CaseParty"]] = relationship(
        "CaseParty", back_populates="case", cascade="all, delete-orphan", lazy="joined"
    )

    def __repr__(self) -> str:
        return f"<Case {self.case_number} ({self.case_type}) [{self.status}]>"

    @staticmethod
    def generate_case_number(sequence: int) -> str:
        year = datetime.now(timezone.utc).year
        return f"EXP-{year}-{sequence:05d}"
