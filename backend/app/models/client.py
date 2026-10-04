from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IdentifiableMixin

if TYPE_CHECKING:
    from app.models.case_party import CaseParty
    from app.models.legal_entity import LegalEntity


class ClientTypeEnum:
    INDIVIDUAL = "INDIVIDUAL"
    JURIDICA = "JURIDICA"


class Client(Base, IdentifiableMixin):
    """Persona individual (sujeto de derecho) en el sistema notarial guatemalteco.

    Almacena datos notariales obligatorios: DPI (13 dígitos), NIT, estado civil,
    profesión, nacionalidad y dirección. DPI y NIT se almacenan como texto
    estrictamente, nunca como enteros.
    """

    __tablename__ = "clients"

    # --- Identificación Personal ---
    first_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dpi: Mapped[str] = mapped_column(
        String(13), unique=True, nullable=False, index=True
    )
    nit: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)

    # --- Datos Notariales ---
    marital_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    profession: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nationality: Mapped[str] = mapped_column(
        String(50), default="GUATEMALTECA", nullable=False
    )
    birth_date: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # --- Contacto y Dirección ---
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Estado del Registro ---
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False, index=True
    )

    # --- Relaciones ---
    case_parties: Mapped[list["CaseParty"]] = relationship(
        "CaseParty", back_populates="client", lazy="select"
    )
    legal_entities: Mapped[list["LegalEntity"]] = relationship(
        "LegalEntity", back_populates="legal_representative", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Client {self.first_name} {self.last_name} DPI={self.dpi}>"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
