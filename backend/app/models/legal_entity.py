from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IdentifiableMixin

if TYPE_CHECKING:
    from app.models.client import Client


class SocietyTypeEnum:
    SOCIEDAD_ANONIMA = "SOCIEDAD_ANONIMA"
    SOCIEDAD_RESPONSABILIDAD_LIMITADA = "SOCIEDAD_RESPONSABILIDAD_LIMITADA"
    SOCIEDAD_COLECTIVA = "SOCIEDAD_COLECTIVA"
    SOCIEDAD_EN_COMANDITA = "SOCIEDAD_EN_COMANDITA"
    ASOCIACION = "ASOCIACION"
    FUNDACION = "FUNDACION"
    OTRA = "OTRA"


class LegalEntity(Base, IdentifiableMixin):
    """Persona jurídica (sociedad mercantil, asociación o entidad).

    Registra datos de inscripción registral y vincula al representante legal
    (persona individual) que actúa en nombre de la entidad ante fedatario.
    """

    __tablename__ = "legal_entities"

    # --- Identificación de la Entidad ---
    business_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    trade_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    nit: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    society_type: Mapped[str] = mapped_column(
        String(50), default="SOCIEDAD_ANONIMA", nullable=False
    )

    # --- Datos de Inscripción Registral ---
    registry_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    registry_folio: Mapped[str | None] = mapped_column(String(30), nullable=True)
    registry_book: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # --- Representación Legal ---
    legal_representative_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=True, index=True
    )
    representative_position: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    # --- Contacto ---
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Estado ---
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False, index=True
    )

    # --- Relaciones ---
    legal_representative: Mapped["Client | None"] = relationship(
        "Client", back_populates="legal_entities", lazy="joined"
    )

    def __repr__(self) -> str:
        return f"<LegalEntity {self.business_name} NIT={self.nit}>"
